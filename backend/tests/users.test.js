import bcrypt from "bcryptjs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { api, cleanup, createUser, makeTag, PASSWORD, prisma } from "./helpers.js";

const tag = makeTag("usr");

afterAll(async () => {
  await cleanup(tag);
  await prisma.$disconnect();
});

describe("account details", () => {
  let validationUser;
  beforeAll(async () => {
    validationUser = await createUser(tag, "validation");
  });

  it("requires login", async () => {
    expect((await api.patch("/users/me", null, { name: "Nope" })).status).toBe(401);
  });

  it.each([
    ["an empty update", {}],
    ["a too-short name", { name: "A" }],
    ["a malformed phone number", { phone: "abc" }],
  ])("rejects %s", async (_label, body) => {
    expect((await api.patch("/users/me", validationUser, body)).status).toBe(400);
  });

  it("updates the name and phone (trimmed), and clears the phone with null", async () => {
    const user = await createUser(tag, "update");
    const res = await api.patch("/users/me", user, { name: "  New Name  ", phone: "+91 98765 43210" });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ name: "New Name", phone: "+91 98765 43210" });
    expect(JSON.stringify(res.body)).not.toMatch(/password|\$2[aby]\$/);

    expect((await api.get("/auth/me", user)).body.user.name).toBe("New Name");
    expect((await api.patch("/users/me", user, { phone: null })).body.user.phone).toBeNull();
  });

  it("can't be used to change role, email or username", async () => {
    const user = await createUser(tag, "escalate");
    await api.patch("/users/me", user, { name: "Still Me", role: "ADMIN", email: "evil@x.test", username: "hacked" });

    const stored = await prisma.user.findUnique({ where: { id: user.id } });
    expect(stored).toMatchObject({ role: "USER", email: `${tag}_escalate@test.local`, username: `${tag}_escalate`, name: "Still Me" });
  });
});

describe("changing the password", () => {
  let rejectUser;
  beforeAll(async () => {
    rejectUser = await createUser(tag, "rejects");
  });
  const good = { currentPassword: PASSWORD, newPassword: "NewPassw0rd!", confirmPassword: "NewPassw0rd!" };

  it("requires login", async () => {
    expect((await api.post("/users/me/password", null, good)).status).toBe(401);
  });

  it("returns 400 (not 401) for a wrong current password, so the session isn't treated as expired", async () => {
    const user = await createUser(tag, "wrongcurrent");
    const res = await api.post("/users/me/password", user, { ...good, currentPassword: "not-my-password" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_PASSWORD");
  });

  it.each([
    ["a mismatched confirmation", { confirmPassword: "Different1!" }],
    ["a too-short new password", { newPassword: "short", confirmPassword: "short" }],
    ["a new password equal to the current one", { newPassword: PASSWORD, confirmPassword: PASSWORD }],
  ])("rejects %s and leaves the password unchanged", async (_label, override) => {
    const res = await api.post("/users/me/password", rejectUser, { ...good, ...override });
    expect(res.status).toBe(400);

    const stored = await prisma.user.findUnique({ where: { id: rejectUser.id } });
    expect(bcrypt.compareSync(PASSWORD, stored.password)).toBe(true);
  });

  it("changes the password: stored hashed, old one stops working, new one logs in", async () => {
    const user = await createUser(tag, "change");
    const res = await api.post("/users/me/password", user, good);
    expect(res.status).toBe(200);

    const stored = await prisma.user.findUnique({ where: { id: user.id } });
    expect(stored.password).not.toBe(good.newPassword);
    expect(bcrypt.compareSync(good.newPassword, stored.password)).toBe(true);

    const old = await api.post("/auth/login", null, { username: user.username, password: PASSWORD });
    expect(old.status).toBe(401);
    const fresh = await api.post("/auth/login", null, { username: user.username, password: good.newPassword });
    expect(fresh.status).toBe(200);
  });
});
