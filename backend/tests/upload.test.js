import fs from "node:fs";
import path from "node:path";

import request from "supertest";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { app, cleanup, cookieFor, createTeacher, createUser, makeTag, prisma } from "./helpers.js";

const tag = makeTag("upl");
const UPLOAD_DIR = process.env.UPLOAD_DIR;
let teacher;
let parent;

const upload = (user, buffer, { filename = "photo.jpg", contentType = "image/jpeg" } = {}) => {
  const req = request(app).post("/api/teachers/me/photo");
  if (user) req.set("Cookie", cookieFor(user));
  return buffer ? req.attach("photo", buffer, { filename, contentType }) : req;
};

const storedFile = (res) => path.join(UPLOAD_DIR, res.body.profile.photoUrl.split("/uploads/")[1]);

const solid = (width, height, background = "#3b82f6") =>
  sharp({ create: { width, height, channels: 3, background } });

beforeAll(async () => {
  // sharp keeps read files open in a cache, which on Windows blocks deleting them afterwards.
  sharp.cache(false);
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  teacher = await createTeacher(tag, "teacher", { photoUrl: null });
  parent = await createUser(tag, "parent");
});

afterAll(async () => {
  await cleanup(tag);
  fs.rmSync(UPLOAD_DIR, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  await prisma.$disconnect();
});

describe("who may upload", () => {
  it("requires login and the TEACHER role", async () => {
    const img = await solid(50, 50).jpeg().toBuffer();
    expect((await upload(null, img)).status).toBe(401);
    expect((await upload(parent, img)).status).toBe(403);
  });

  it("rejects a request with no file", async () => {
    const res = await upload(teacher.user);
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/no photo/i);
  });
});

describe("processing a valid photo", () => {
  it("re-encodes to WebP, caps the size, and removes EXIF/GPS metadata", async () => {
    const marker = "SECRET-HOME-ADDRESS-42";
    const original = await solid(3000, 2000)
      .jpeg()
      .withExif({ IFD0: { Copyright: marker, ImageDescription: marker } })
      .toBuffer();
    expect(original.includes(Buffer.from(marker))).toBe(true); // sanity: the input does carry it

    const res = await upload(teacher.user, original);
    expect(res.status).toBe(200);
    expect(res.body.profile.photoUrl).toMatch(/\/uploads\/\d+-[0-9a-f-]{36}\.webp$/);

    const file = storedFile(res);
    const bytes = fs.readFileSync(file);
    expect(bytes.includes(Buffer.from(marker))).toBe(false);

    const meta = await sharp(file).metadata();
    expect(meta.format).toBe("webp");
    expect(Math.max(meta.width, meta.height)).toBeLessThanOrEqual(800);
    expect(meta.exif).toBeUndefined();
    expect(bytes.length).toBeLessThan(original.length);
  });

  it("applies the EXIF rotation before discarding it, so photos aren't turned sideways", async () => {
    // 200x100 stored with orientation 6 means "display rotated": it should come out 100x200.
    const rotated = await solid(200, 100).jpeg().withMetadata({ orientation: 6 }).toBuffer();
    const res = await upload(teacher.user, rotated);
    const meta = await sharp(storedFile(res)).metadata();
    expect([meta.width, meta.height]).toEqual([100, 200]);
  });

  it("never enlarges a small image", async () => {
    const res = await upload(teacher.user, await solid(120, 90).jpeg().toBuffer());
    const meta = await sharp(storedFile(res)).metadata();
    expect([meta.width, meta.height]).toEqual([120, 90]);
  });

  it.each([
    ["PNG", () => solid(60, 60).png().toBuffer(), "image/png", "p.png"],
    ["WebP", () => solid(60, 60).webp().toBuffer(), "image/webp", "p.webp"],
  ])("accepts a %s", async (_label, make, contentType, filename) => {
    const res = await upload(teacher.user, await make(), { contentType, filename });
    expect(res.status).toBe(200);
  });

  it("ignores the client's filename and names the file itself", async () => {
    const res = await upload(teacher.user, await solid(50, 50).jpeg().toBuffer(), {
      filename: "../../../etc/passwd.jpg",
    });
    expect(res.status).toBe(200);
    expect(path.dirname(storedFile(res))).toBe(path.resolve(UPLOAD_DIR));
    expect(path.basename(storedFile(res))).not.toContain("passwd");
  });

  it("deletes the previous photo when it is replaced", async () => {
    const first = await upload(teacher.user, await solid(50, 50).jpeg().toBuffer());
    const firstFile = storedFile(first);
    expect(fs.existsSync(firstFile)).toBe(true);

    const second = await upload(teacher.user, await solid(60, 60, "#ef4444").jpeg().toBuffer());
    expect(storedFile(second)).not.toBe(firstFile);
    await new Promise((resolve) => setTimeout(resolve, 100)); // the unlink is fire-and-forget
    expect(fs.existsSync(firstFile)).toBe(false);
    expect(fs.existsSync(storedFile(second))).toBe(true);
  });
});

describe("rejecting bad uploads", () => {
  it("rejects a non-image sent with an image Content-Type (the header isn't trusted)", async () => {
    const res = await upload(teacher.user, Buffer.from("<?php echo 'pwned'; ?>"), {
      contentType: "image/png",
      filename: "shell.png",
    });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/isn't a valid/);
  });

  it("rejects a real image in a format that isn't allowed, even if labelled as PNG", async () => {
    const gif = await solid(40, 40).gif().toBuffer();
    const res = await upload(teacher.user, gif, { contentType: "image/png", filename: "a.png" });
    expect(res.status).toBe(400);
  });

  it.each([
    ["GIF", "image/gif"],
    ["SVG", "image/svg+xml"],
    ["PDF", "application/pdf"],
  ])("rejects a declared %s", async (_label, contentType) => {
    const res = await upload(teacher.user, Buffer.from("data"), { contentType, filename: "x.bin" });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/JPEG, PNG, or WEBP/);
  });

  it("rejects files over 5 MB with a clear message", async () => {
    const res = await upload(teacher.user, Buffer.alloc(6 * 1024 * 1024, 1));
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/5 MB/);
  });

  it("rejects a tiny file that would decompress into a huge image", async () => {
    const bomb = await solid(7000, 7000).png({ compressionLevel: 9 }).toBuffer();
    expect(bomb.length).toBeLessThan(5 * 1024 * 1024); // small enough to pass the size limit
    const res = await upload(teacher.user, bomb, { contentType: "image/png", filename: "b.png" });
    expect(res.status).toBe(400);
  });

  it("leaves no file behind when an upload is rejected", async () => {
    const before = fs.readdirSync(UPLOAD_DIR).length;
    await upload(teacher.user, Buffer.from("not an image"), { contentType: "image/jpeg" });
    expect(fs.readdirSync(UPLOAD_DIR).length).toBe(before);
  });
});
