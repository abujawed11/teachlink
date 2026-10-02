import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";

import { app, api, cleanup, createUser, makeTag, PASSWORD, prisma } from "./helpers.js";
import { signRefreshToken } from "../src/utils/jwt.js";

const tag = makeTag("auth");

const signup = (key, overrides = {}) => ({
  name: `User ${key}`,
  username: `${tag}_${key}`,
  email: `${tag}_${key}@test.local`,
  password: PASSWORD,
  confirmPassword: PASSWORD,
  ...overrides,
});

const cookiesOf = (res) => res.headers["set-cookie"] || [];

afterAll(async () => {
  await cleanup(tag);
  await prisma.$disconnect();
});

describe("registration", () => {
  it("creates a USER account and sets httpOnly auth cookies", async () => {
    const res = await api.post("/auth/register", null, signup("reg1"));
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ username: `${tag}_reg1`, role: "USER", status: "ACTIVE" });
    expect(res.body.user.password).toBeUndefined();

    const cookies = cookiesOf(res);
    expect(cookies.find((c) => c.startsWith("accessToken="))).toMatch(/HttpOnly/i);
    expect(cookies.find((c) => c.startsWith("refreshToken="))).toMatch(/HttpOnly/i);
    expect(cookies.join(";")).toMatch(/SameSite=Lax/i);
  });

  it("stores only a hash of the password", async () => {
    const stored = await prisma.user.findUnique({ where: { username: `${tag}_reg1` } });
    expect(stored.password).not.toBe(PASSWORD);
    expect(stored.password).toMatch(/^\$2[aby]\$/);
  });

  it("creates a TEACHER with an empty draft profile via register-teacher", async () => {
    const res = await api.post("/auth/register-teacher", null, signup("teach1"));
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("TEACHER");

    const profile = await prisma.teacherProfile.findUnique({ where: { userId: res.body.user.id } });
    expect(profile).toMatchObject({ isPublished: false, isHiddenByAdmin: false });
    expect(profile.slug).toMatch(/^user-teach1-|^[a-z0-9-]+-[a-z0-9]{4}$/);
  });

  it("ignores a client-supplied role (no privilege escalation)", async () => {
    const res = await api.post("/auth/register", null, signup("evil", { role: "ADMIN" }));
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("USER");
  });

  it("rejects a duplicate email and a duplicate username with distinct codes", async () => {
    const dupEmail = await api.post("/auth/register", null, signup("dupe1", { email: `${tag}_reg1@test.local` }));
    expect(dupEmail.status).toBe(409);
    expect(dupEmail.body.error.code).toBe("EMAIL_IN_USE");

    const dupName = await api.post("/auth/register", null, signup("dupe2", { username: `${tag}_reg1` }));
    expect(dupName.status).toBe(409);
    expect(dupName.body.error.code).toBe("USERNAME_IN_USE");
  });

  it.each([
    ["short password", { password: "short", confirmPassword: "short" }],
    ["mismatched confirmation", { confirmPassword: "Different1!" }],
    ["invalid email", { email: "not-an-email" }],
    ["short username", { username: "ab" }],
    ["username with spaces", { username: "has space" }],
    ["short name", { name: "A" }],
  ])("rejects %s", async (_label, override) => {
    const res = await api.post("/auth/register", null, signup("bad", override));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("login", () => {
  it("logs in with valid credentials", async () => {
    const res = await api.post("/auth/login", null, { username: `${tag}_reg1`, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe(`${tag}_reg1`);
    expect(res.body.user.password).toBeUndefined();
    expect(cookiesOf(res).length).toBeGreaterThanOrEqual(2);
  });

  it("gives the same generic error for a wrong password and an unknown user (no enumeration)", async () => {
    const wrongPassword = await api.post("/auth/login", null, { username: `${tag}_reg1`, password: "nope-nope" });
    const unknownUser = await api.post("/auth/login", null, { username: `${tag}_ghost`, password: "nope-nope" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownUser.status).toBe(401);
    expect(wrongPassword.body.error.message).toBe(unknownUser.body.error.message);
    expect(wrongPassword.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("blocks a suspended account", async () => {
    const user = await createUser(tag, "suspended", "USER", { status: "SUSPENDED" });
    const res = await api.post("/auth/login", null, { username: user.username, password: PASSWORD });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("ACCOUNT_SUSPENDED");
  });
});

describe("session", () => {
  it("returns the current user from /auth/me, and 401 without a session", async () => {
    const user = await createUser(tag, "me");
    const ok = await api.get("/auth/me", user);
    expect(ok.status).toBe(200);
    expect(ok.body.user.id).toBe(user.id);
    expect(ok.body.user.password).toBeUndefined();

    expect((await api.get("/auth/me")).status).toBe(401);
  });

  it("rejects a tampered or garbage access token", async () => {
    const res = await request(app).get("/api/auth/me").set("Cookie", "accessToken=garbage.token.value");
    expect(res.status).toBe(401);
  });

  it("signs a suspended user out on /auth/me and clears their cookies", async () => {
    const user = await createUser(tag, "gets_suspended");
    await prisma.user.update({ where: { id: user.id }, data: { status: "SUSPENDED" } });

    const res = await api.get("/auth/me", user);
    expect(res.status).toBe(403);
    expect(cookiesOf(res).join(";")).toMatch(/accessToken=;/);
  });

  it("logout clears both cookies", async () => {
    const res = await api.post("/auth/logout", null, {});
    expect(res.status).toBe(200);
    const cookies = cookiesOf(res).join(";");
    expect(cookies).toMatch(/accessToken=;/);
    expect(cookies).toMatch(/refreshToken=;/);
  });
});

describe("token refresh", () => {
  it("issues new cookies for a valid refresh token", async () => {
    const user = await createUser(tag, "refresh");
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role, email: user.email });

    const res = await request(app).post("/api/auth/refresh").set("Cookie", `refreshToken=${refreshToken}`);
    expect(res.status).toBe(200);
    expect(cookiesOf(res).find((c) => c.startsWith("accessToken="))).toBeTruthy();
  });

  it("rejects a missing, garbage, or access-token-as-refresh token", async () => {
    expect((await request(app).post("/api/auth/refresh")).status).toBe(401);
    expect(
      (await request(app).post("/api/auth/refresh").set("Cookie", "refreshToken=garbage")).status
    ).toBe(401);

    const user = await createUser(tag, "wrongtype");
    const accessAsRefresh = (await api.get("/auth/me", user)).request.header.Cookie.split("=")[1];
    expect(
      (await request(app).post("/api/auth/refresh").set("Cookie", `refreshToken=${accessAsRefresh}`)).status
    ).toBe(401);
  });

  it("refuses to refresh a suspended user", async () => {
    const user = await createUser(tag, "refresh_susp", "USER", { status: "SUSPENDED" });
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role, email: user.email });
    const res = await request(app).post("/api/auth/refresh").set("Cookie", `refreshToken=${refreshToken}`);
    expect(res.status).toBe(401);
  });
});
