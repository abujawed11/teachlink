import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { api, cleanup, createTeacher, createUser, makeTag, PASSWORD, prisma } from "./helpers.js";

const tag = makeTag("adm");
const createdLookups = [];
let admin;
let parent;
let teacher; // published, with a phone number, used to check every moderation effect

beforeAll(async () => {
  admin = await createUser(tag, "admin", "ADMIN");
  parent = await createUser(tag, "parent");
  teacher = await createTeacher(tag, "teacher", {
    city: `${tag}city`,
    contactPreference: "PHONE",
    contactNumber: "+91 98765 43210",
  });
});

afterAll(async () => {
  await cleanup(tag);
  for (const [model, id] of createdLookups) await prisma[model].delete({ where: { id } }).catch(() => {});
  await prisma.$disconnect();
});

const isInSearch = async () =>
  (await api.get(`/teachers?city=${tag}city`)).body.teachers.some((t) => t.slug === teacher.slug);

describe("access control", () => {
  it("rejects anonymous visitors, users and teachers", async () => {
    expect((await api.get("/admin/users")).status).toBe(401);
    expect((await api.get("/admin/users", parent)).status).toBe(403);
    expect((await api.get("/admin/users", teacher.user)).status).toBe(403);
  });

  it("lets an admin in", async () => {
    expect((await api.get("/admin/users", admin)).status).toBe(200);
  });

  it("checks the database, not the token: a forged ADMIN role is refused", async () => {
    const forged = { ...parent, role: "ADMIN" }; // token says ADMIN, the database says USER
    expect((await api.get("/admin/users", forged)).status).toBe(403);
  });

  it("locks out an admin who is suspended or demoted immediately", async () => {
    const temp = await createUser(tag, "temp_admin", "ADMIN");
    expect((await api.get("/admin/users", temp)).status).toBe(200);

    await prisma.user.update({ where: { id: temp.id }, data: { status: "SUSPENDED" } });
    expect((await api.get("/admin/users", temp)).status).toBe(403);

    await prisma.user.update({ where: { id: temp.id }, data: { status: "ACTIVE", role: "USER" } });
    expect((await api.get("/admin/users", temp)).status).toBe(403);
  });
});

describe("user management", () => {
  it("searches and filters users, never exposing password hashes", async () => {
    const res = await api.get(`/admin/users?q=${tag}_teach&role=TEACHER&status=ACTIVE`, admin);
    expect(res.status).toBe(200);
    expect(res.body.users.map((u) => u.id)).toEqual([teacher.user.id]);
    expect(JSON.stringify(res.body)).not.toMatch(/password|\$2[aby]\$/);
  });

  it("paginates and treats blank filters as 'all'", async () => {
    const res = await api.get("/admin/users?role=&status=&pageSize=2&page=1", admin);
    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeLessThanOrEqual(2);
    expect(res.body.pagination).toMatchObject({ page: 1, pageSize: 2 });
  });

  it("rejects an invalid filter", async () => {
    expect((await api.get("/admin/users?role=HACKER", admin)).status).toBe(400);
  });

  it("refuses to suspend yourself, another admin, or an unknown user", async () => {
    const otherAdmin = await createUser(tag, "admin2", "ADMIN");
    expect((await api.patch(`/admin/users/${admin.id}/status`, admin, { status: "SUSPENDED" })).status).toBe(400);
    expect((await api.patch(`/admin/users/${otherAdmin.id}/status`, admin, { status: "SUSPENDED" })).status).toBe(403);
    expect((await api.patch("/admin/users/999999999/status", admin, { status: "SUSPENDED" })).status).toBe(404);
    expect((await api.patch("/admin/users/abc/status", admin, { status: "ACTIVE" })).status).toBe(404);
    expect((await api.patch(`/admin/users/${parent.id}/status`, admin, { status: "BANNED" })).status).toBe(400);
  });

  it("suspending a teacher hides them everywhere and blocks login; reactivating restores them", async () => {
    expect((await api.get(`/teachers/${teacher.slug}`)).status).toBe(200);
    expect(await isInSearch()).toBe(true);

    const suspended = await api.patch(`/admin/users/${teacher.user.id}/status`, admin, { status: "SUSPENDED" });
    expect(suspended.status).toBe(200);
    expect(suspended.body.user.status).toBe("SUSPENDED");
    expect(JSON.stringify(suspended.body)).not.toContain("password");

    expect((await api.get(`/teachers/${teacher.slug}`)).status).toBe(404);
    expect(await isInSearch()).toBe(false);
    const login = await api.post("/auth/login", null, { username: teacher.user.username, password: PASSWORD });
    expect(login.status).toBe(403);
    expect((await api.get("/auth/me", teacher.user)).status).toBe(403);

    await api.patch(`/admin/users/${teacher.user.id}/status`, admin, { status: "ACTIVE" });
    expect((await api.get(`/teachers/${teacher.slug}`)).status).toBe(200);
    expect(await isInSearch()).toBe(true);
    expect((await api.post("/auth/login", null, { username: teacher.user.username, password: PASSWORD })).status).toBe(200);
  });
});

describe("teacher moderation", () => {
  it("lists teachers with their real visibility and no private data", async () => {
    const draft = await createTeacher(tag, "draft", { isPublished: false });
    const res = await api.get(`/admin/teachers?q=${tag}`, admin);
    expect(res.status).toBe(200);

    const row = res.body.teachers.find((t) => t.id === teacher.profile.id);
    expect(row).toMatchObject({ isVisible: true, accountStatus: "ACTIVE", isHiddenByAdmin: false });
    expect(JSON.stringify(res.body)).not.toMatch(/98765|@test\.local/);

    const drafts = await api.get(`/admin/teachers?q=${tag}&visibility=draft`, admin);
    expect(drafts.body.teachers.map((t) => t.id)).toEqual([draft.profile.id]);
  });

  it("validates moderation requests", async () => {
    expect((await api.patch(`/admin/teachers/${teacher.profile.id}`, admin, {})).status).toBe(400);
    expect((await api.patch("/admin/teachers/999999999", admin, { isVerified: true })).status).toBe(404);
  });

  it("verifies a teacher, and the badge shows publicly", async () => {
    const res = await api.patch(`/admin/teachers/${teacher.profile.id}`, admin, { isVerified: true });
    expect(res.body.teacher.isVerified).toBe(true);
    expect((await api.get(`/teachers/${teacher.slug}`)).body.profile.isVerified).toBe(true);
  });

  it("hiding a profile removes it from every public surface and can't be undone by the teacher", async () => {
    const parentSender = await createUser(tag, "sender");
    const hide = await api.patch(`/admin/teachers/${teacher.profile.id}`, admin, { isHiddenByAdmin: true });
    expect(hide.body.teacher).toMatchObject({ isHiddenByAdmin: true, isVisible: false });

    expect((await api.get(`/teachers/${teacher.slug}`)).status).toBe(404);
    expect(await isInSearch()).toBe(false);
    expect((await api.post(`/teachers/${teacher.slug}/contact`, parentSender, { message: "hello there, need help" })).status).toBe(404);

    const unlock = await api.get(`/teachers/${teacher.slug}/contact-number`, parentSender);
    expect(unlock.status).toBe(404);
    expect(JSON.stringify(unlock.body)).not.toContain("98765");

    const republish = await api.post("/teachers/me/publish", teacher.user);
    expect(republish.status).toBe(403);
    expect(republish.body.error.code).toBe("PROFILE_HIDDEN");
    expect((await api.get("/teachers/me", teacher.user)).body.profile.isHiddenByAdmin).toBe(true);

    const hidden = await api.get(`/admin/teachers?q=${tag}&visibility=hidden`, admin);
    expect(hidden.body.teachers.map((t) => t.id)).toEqual([teacher.profile.id]);

    await api.patch(`/admin/teachers/${teacher.profile.id}`, admin, { isHiddenByAdmin: false });
    expect((await api.get(`/teachers/${teacher.slug}`)).status).toBe(200);
    expect(await isInSearch()).toBe(true);
  });
});

describe("lookup management", () => {
  const remember = (model, item) => createdLookups.push([model, item.id]);

  it("is admin-only and rejects unknown list types", async () => {
    expect((await api.get("/admin/lookups/subjects", teacher.user)).status).toBe(403);
    expect((await api.get("/admin/lookups/nonsense", admin)).status).toBe(404);
  });

  it("lists items with how many teachers use them", async () => {
    const res = await api.get("/admin/lookups/subjects", admin);
    expect(res.status).toBe(200);
    expect(res.body.items[0]).toHaveProperty("teacherCount");
  });

  it("creates (trimmed), rejects duplicates case-insensitively, renames and validates", async () => {
    const name = `${tag} Astronomy`;
    const created = await api.post("/admin/lookups/subjects", admin, { name: `  ${name}  ` });
    expect(created.status).toBe(201);
    expect(created.body.item.name).toBe(name);
    remember("subject", created.body.item);
    const id = created.body.item.id;

    expect((await api.post("/admin/lookups/subjects", admin, { name: name.toLowerCase() })).status).toBe(409);
    expect((await api.post("/admin/lookups/subjects", admin, { name: "   " })).status).toBe(400);

    const renamed = await api.patch(`/admin/lookups/subjects/${id}`, admin, { name: `${name} 2` });
    expect(renamed.body.item.name).toBe(`${name} 2`);
    expect((await api.patch(`/admin/lookups/subjects/${id}`, admin, {})).status).toBe(400);
    expect((await api.patch("/admin/lookups/subjects/999999999", admin, { isActive: false })).status).toBe(404);
  });

  it("deactivating hides an item from public lists but not from the admin", async () => {
    const item = (await api.post("/admin/lookups/boards", admin, { name: `${tag} Board` })).body.item;
    remember("board", item);

    expect((await api.get("/lookups/boards")).body.boards.some((b) => b.id === item.id)).toBe(true);
    await api.patch(`/admin/lookups/boards/${item.id}`, admin, { isActive: false });
    expect((await api.get("/lookups/boards")).body.boards.some((b) => b.id === item.id)).toBe(false);
    const adminView = await api.get("/admin/lookups/boards", admin);
    expect(adminView.body.items.find((b) => b.id === item.id)).toMatchObject({ isActive: false });
  });

  it("appends new classes after the last one, and supports deactivating languages", async () => {
    const max = (await prisma.grade.aggregate({ _max: { sortOrder: true } }))._max.sortOrder;
    const grade = await api.post("/admin/lookups/grades", admin, { name: `${tag} Class 13` });
    remember("grade", grade.body.item);
    expect(grade.body.item.sortOrder).toBe(max + 1);

    const lang = (await api.post("/admin/lookups/languages", admin, { name: `${tag} Lang` })).body.item;
    remember("language", lang);
    expect(lang.isActive).toBe(true);
    await api.patch(`/admin/lookups/languages/${lang.id}`, admin, { isActive: false });
    expect((await api.get("/lookups/languages")).body.languages.some((l) => l.id === lang.id)).toBe(false);
  });

  it("has no delete endpoint (items are only deactivated)", async () => {
    const item = (await api.post("/admin/lookups/subjects", admin, { name: `${tag} Keep` })).body.item;
    remember("subject", item);
    const res = await api.delete(`/admin/lookups/subjects/${item.id}`, admin);
    expect(res.status).toBe(404);
    expect(await prisma.subject.count({ where: { id: item.id } })).toBe(1);
  });
});
