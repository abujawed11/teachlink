import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { app, api, cleanup, createUser, makeTag, PASSWORD, prisma } from "./helpers.js";

// The limiters keep their counters in memory for the life of the process, and every request here
// comes from the same address, so the order of these tests matters: each describe uses its own
// limiter, and the global one (which counts everything) goes last.
const tag = makeTag("rl");
let user;

beforeAll(async () => {
  // The rest of the suite switches limiting off; this file needs it on.
  process.env.DISABLE_RATE_LIMIT = "0";
  user = await createUser(tag, "user");
});

afterAll(async () => {
  process.env.DISABLE_RATE_LIMIT = "1";
  await cleanup(tag);
  await prisma.$disconnect();
});

const login = (password) => api.post("/auth/login", null, { username: user.username, password });

describe("login limiter", () => {
  it("doesn't count successful logins, so normal users are never locked out", async () => {
    for (let i = 0; i < 12; i++) {
      expect((await login(PASSWORD)).status).toBe(200);
    }
  });

  it("stops password guessing after 10 failed attempts, with a JSON error", async () => {
    for (let i = 0; i < 10; i++) {
      expect((await login("wrong-password")).status).toBe(401);
    }
    const blocked = await login("wrong-password");
    expect(blocked.status).toBe(429);
    expect(blocked.headers["content-type"]).toMatch(/json/);
    expect(blocked.body.error.code).toBe("RATE_LIMITED");
    expect(blocked.body.error.message).toMatch(/failed login attempts/i);
    expect(blocked.headers["retry-after"]).toBeDefined();
  });

  it("then refuses even the correct password until the window passes", async () => {
    expect((await login(PASSWORD)).status).toBe(429);
  });
});

describe("registration limiter", () => {
  const signup = (i) => ({
    name: "Rate Limited",
    username: `${tag}_reg${i}`,
    email: `${tag}_reg${i}@test.local`,
    password: PASSWORD,
    confirmPassword: PASSWORD,
  });

  it("allows 10 sign-ups, then blocks further ones", async () => {
    for (let i = 0; i < 10; i++) {
      expect((await api.post("/auth/register", null, signup(i))).status).toBe(201);
    }
    const blocked = await api.post("/auth/register", null, signup(11));
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.message).toMatch(/sign-up/i);
  });

  it("shares that budget with teacher sign-ups", async () => {
    expect((await api.post("/auth/register-teacher", null, signup(12))).status).toBe(429);
  });
});

describe("password-change limiter", () => {
  it("allows 5 wrong guesses at the current password, then blocks", async () => {
    const attacker = await createUser(tag, "stolen_session");
    const body = { currentPassword: "guess", newPassword: "NewPassw0rd!", confirmPassword: "NewPassw0rd!" };

    for (let i = 0; i < 5; i++) {
      const res = await api.post("/users/me/password", attacker, body);
      expect(res.status).toBe(400);
    }
    const blocked = await api.post("/users/me/password", attacker, body);
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe("RATE_LIMITED");

    // The real password is refused too while locked out.
    const right = await api.post("/users/me/password", attacker, { ...body, currentPassword: PASSWORD });
    expect(right.status).toBe(429);
  });
});

describe("refresh limiter", () => {
  it("allows 60 refresh attempts, then blocks", async () => {
    let lastOk = 0;
    for (let i = 0; i < 60; i++) {
      const res = await request(app).post("/api/auth/refresh");
      expect(res.status).toBe(401); // no cookie: refused, but it still counts
      lastOk = i + 1;
    }
    expect(lastOk).toBe(60);
    const blocked = await request(app).post("/api/auth/refresh");
    expect(blocked.status).toBe(429);
  });
});

describe("global limiter", () => {
  it("caps a single address at 600 API requests per window", async () => {
    let limitedAt = null;
    for (let i = 0; i < 700 && limitedAt === null; i++) {
      const res = await request(app).get("/api/health");
      if (res.status === 429) {
        limitedAt = i;
        expect(res.body.error.code).toBe("RATE_LIMITED");
      }
    }
    expect(limitedAt).not.toBeNull();
    // Earlier tests in this file already used part of the budget.
    expect(limitedAt).toBeGreaterThan(300);
    expect(limitedAt).toBeLessThanOrEqual(600);
  }, 60_000);

  it("does not count photo downloads against the limit", async () => {
    // Static files are served ahead of the limiter, so they stay available even when it trips.
    const res = await request(app).get("/uploads/anything.webp");
    expect(res.status).toBe(404); // missing file, but not 429
  });
});
