import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { api, cleanup, createTeacher, createUser, makeTag, prisma } from "./helpers.js";

const tag = makeTag("cnt");
const MESSAGE = "Hi, I need maths tuition for class 10";
let teacher;
let otherTeacher;
let parent;

beforeAll(async () => {
  teacher = await createTeacher(tag, "teacher");
  otherTeacher = await createTeacher(tag, "other");
  parent = await createUser(tag, "parent");
});

afterAll(async () => {
  await cleanup(tag);
  await prisma.$disconnect();
});

describe("sending a contact request", () => {
  it("requires login", async () => {
    const res = await api.post(`/teachers/${teacher.slug}/contact`, null, { message: MESSAGE });
    expect(res.status).toBe(401);
  });

  it.each([
    ["a too-short message", { message: "short" }],
    ["a message over 1000 characters", { message: "x".repeat(1001) }],
    ["a malformed phone number", { message: MESSAGE, phone: "abc" }],
    ["no message", {}],
  ])("rejects %s", async (_label, body) => {
    const res = await api.post(`/teachers/${teacher.slug}/contact`, parent, body);
    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown, unpublished, hidden or suspended teacher", async () => {
    const draft = await createTeacher(tag, "draft", { isPublished: false });
    const hidden = await createTeacher(tag, "hidden", { isHiddenByAdmin: true });
    const suspended = await createTeacher(tag, "susp", {}, { status: "SUSPENDED" });

    for (const slug of ["no-such-slug", draft.slug, hidden.slug, suspended.slug]) {
      const res = await api.post(`/teachers/${slug}/contact`, parent, { message: MESSAGE });
      expect(res.status, slug).toBe(404);
    }
  });

  it("won't let a teacher contact themselves", async () => {
    const res = await api.post(`/teachers/${teacher.slug}/contact`, teacher.user, { message: MESSAGE });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/own profile/);
  });

  it("won't let a suspended account send", async () => {
    const banned = await createUser(tag, "banned", "USER", { status: "SUSPENDED" });
    const res = await api.post(`/teachers/${teacher.slug}/contact`, banned, { message: MESSAGE });
    expect(res.status).toBe(403);
  });

  it("stores the request for any logged-in user, teachers included", async () => {
    const fromParent = await api.post(`/teachers/${teacher.slug}/contact`, parent, {
      message: MESSAGE,
      phone: "+91 98765 43210",
    });
    expect(fromParent.status).toBe(201);
    expect(fromParent.body.request.id).toBeTypeOf("number");

    const fromTeacher = await api.post(`/teachers/${teacher.slug}/contact`, otherTeacher.user, {
      message: "One teacher writing to another is fine",
    });
    expect(fromTeacher.status).toBe(201);
  });

  it("limits each account to 5 requests per day", async () => {
    const spammer = await createUser(tag, "spammer");
    for (let i = 0; i < 5; i++) {
      const ok = await api.post(`/teachers/${teacher.slug}/contact`, spammer, { message: `Request number ${i} please` });
      expect(ok.status).toBe(201);
    }
    const blocked = await api.post(`/teachers/${teacher.slug}/contact`, spammer, { message: "This one is too many" });
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe("RATE_LIMITED");

    // Another account is unaffected, because the limit is per sender.
    const fine = await api.post(`/teachers/${teacher.slug}/contact`, parent, { message: "Another genuine question" });
    expect(fine.status).toBe(201);
  });
});

describe("the teacher's inbox", () => {
  it("is only for teachers", async () => {
    expect((await api.get("/contact-requests/received")).status).toBe(401);
    expect((await api.get("/contact-requests/received", parent)).status).toBe(403);
  });

  it("lists requests with sender details, newest first, and counts unread", async () => {
    const res = await api.get("/contact-requests/received", teacher.user);
    expect(res.status).toBe(200);
    expect(res.body.requests.length).toBeGreaterThanOrEqual(2);
    expect(res.body.unreadCount).toBe(res.body.requests.filter((r) => !r.isRead).length);

    const fromParent = res.body.requests.find((r) => r.sender.name === "parent" && r.phone);
    expect(fromParent.sender.email).toBe(`${tag}_parent@test.local`);
    expect(fromParent.phone).toBe("+91 98765 43210");
    expect(JSON.stringify(res.body)).not.toContain("password");

    const times = res.body.requests.map((r) => new Date(r.createdAt).getTime());
    expect(times).toEqual([...times].sort((x, y) => y - x));
  });

  it("only shows a teacher the requests addressed to them", async () => {
    const res = await api.get("/contact-requests/received", otherTeacher.user);
    expect(res.body.requests).toEqual([]);
    expect(res.body.unreadCount).toBe(0);
  });

  it("marks a request read, and only for its owner", async () => {
    const inbox = await api.get("/contact-requests/received", teacher.user);
    const { id } = inbox.body.requests[0];
    const before = (await api.get("/contact-requests/received/unread-count", teacher.user)).body.unreadCount;

    expect((await api.patch(`/contact-requests/${id}/read`, otherTeacher.user)).status).toBe(404);
    expect((await api.patch(`/contact-requests/${id}/read`, teacher.user)).status).toBe(204);

    const after = (await api.get("/contact-requests/received/unread-count", teacher.user)).body.unreadCount;
    expect(after).toBe(before - 1);
  });

  it("returns 404 for a non-numeric request id", async () => {
    expect((await api.patch("/contact-requests/abc/read", teacher.user)).status).toBe(404);
  });
});

describe("a sender's own list", () => {
  it("shows only what that user sent", async () => {
    const res = await api.get("/contact-requests/sent", parent);
    expect(res.status).toBe(200);
    expect(res.body.requests.length).toBeGreaterThanOrEqual(1);
    expect(res.body.requests.every((r) => r.teacher.slug === teacher.slug)).toBe(true);

    const none = await api.get("/contact-requests/sent", otherTeacher.user);
    expect(none.body.requests.every((r) => r.teacher.slug === teacher.slug)).toBe(true);
    expect((await api.get("/contact-requests/sent")).status).toBe(401);
  });

  it("drops the profile link once the teacher unpublishes", async () => {
    await prisma.teacherProfile.update({ where: { id: teacher.profile.id }, data: { isPublished: false } });
    const res = await api.get("/contact-requests/sent", parent);
    expect(res.body.requests[0].teacher.slug).toBeNull();
    await prisma.teacherProfile.update({ where: { id: teacher.profile.id }, data: { isPublished: true } });
  });
});

describe("unlocking a teacher's contact number", () => {
  const NUMBER = "+91 98765 43210";
  let phoneTeacher;
  let whatsappTeacher;

  beforeAll(async () => {
    phoneTeacher = await createTeacher(tag, "phone", { contactPreference: "PHONE", contactNumber: NUMBER });
    whatsappTeacher = await createTeacher(tag, "wa", { contactPreference: "WHATSAPP", contactNumber: "+91 91111 22222" });
  });

  it("is never present in public responses, only flagged", async () => {
    const page = await api.get(`/teachers/${phoneTeacher.slug}`);
    expect(page.body.profile.hasContactNumber).toBe(true);
    expect(page.body.profile).not.toHaveProperty("contactNumber");
    expect(JSON.stringify(page.body)).not.toContain("98765");

    const list = await api.get(`/teachers?city=Testville&pageSize=50`);
    expect(JSON.stringify(list.body)).not.toContain("98765");
  });

  it("is not flagged for teachers who chose platform-only or entered no number", async () => {
    const platformOnly = await createTeacher(tag, "plat", { contactPreference: "PLATFORM_ONLY", contactNumber: "+91 90000 00000" });
    const noNumber = await createTeacher(tag, "nonum", { contactPreference: "PHONE", contactNumber: null });
    for (const t of [platformOnly, noNumber]) {
      const page = await api.get(`/teachers/${t.slug}`);
      expect(page.body.profile.hasContactNumber).toBe(false);
      expect((await api.get(`/teachers/${t.slug}/contact-number`, parent)).status).toBe(404);
    }
    expect(JSON.stringify(await api.get(`/teachers/${platformOnly.slug}/contact-number`, parent))).not.toContain("90000");
  });

  it("requires login", async () => {
    const res = await api.get(`/teachers/${phoneTeacher.slug}/contact-number`);
    expect(res.status).toBe(401);
    expect(JSON.stringify(res.body)).not.toContain("98765");
  });

  it("returns the number and how to use it to a logged-in user, and records the unlock once", async () => {
    const viewer = await createUser(tag, "viewer");
    const first = await api.get(`/teachers/${phoneTeacher.slug}/contact-number`, viewer);
    expect(first.status).toBe(200);
    expect(first.body).toEqual({ contactPreference: "PHONE", contactNumber: NUMBER });

    const wa = await api.get(`/teachers/${whatsappTeacher.slug}/contact-number`, viewer);
    expect(wa.body.contactPreference).toBe("WHATSAPP");

    await api.get(`/teachers/${phoneTeacher.slug}/contact-number`, viewer);
    expect(await prisma.contactReveal.count({ where: { userId: viewer.id } })).toBe(2);
  });

  it("returns 404 (and no number) for unpublished, hidden and suspended teachers", async () => {
    const draft = await createTeacher(tag, "d2", { isPublished: false, contactPreference: "PHONE", contactNumber: "+91 93333 44444" });
    const hidden = await createTeacher(tag, "h2", { isHiddenByAdmin: true, contactPreference: "PHONE", contactNumber: "+91 94444 55555" });
    for (const t of [draft, hidden]) {
      const res = await api.get(`/teachers/${t.slug}/contact-number`, parent);
      expect(res.status).toBe(404);
      expect(JSON.stringify(res.body)).not.toMatch(/9333|9444/);
    }
  });

  it("lets a teacher read their own number without counting as an unlock", async () => {
    const res = await api.get(`/teachers/${phoneTeacher.slug}/contact-number`, phoneTeacher.user);
    expect(res.status).toBe(200);
    expect(await prisma.contactReveal.count({ where: { userId: phoneTeacher.user.id } })).toBe(0);
  });

  it("caps new unlocks at 20 per day, but numbers already unlocked stay available", async () => {
    const scraper = await createUser(tag, "scraper");
    const targets = [];
    for (let i = 0; i < 21; i++) {
      targets.push(await createTeacher(tag, `bulk${i}`, { contactPreference: "PHONE", contactNumber: `+91 9000000${String(i).padStart(3, "0")}` }));
    }
    for (const t of targets.slice(0, 20)) {
      expect((await api.get(`/teachers/${t.slug}/contact-number`, scraper)).status).toBe(200);
    }
    const over = await api.get(`/teachers/${targets[20].slug}/contact-number`, scraper);
    expect(over.status).toBe(429);
    expect(over.body.error.code).toBe("RATE_LIMITED");

    expect((await api.get(`/teachers/${targets[0].slug}/contact-number`, scraper)).status).toBe(200);
  });
});
