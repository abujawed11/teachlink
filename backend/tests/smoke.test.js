import { afterAll, describe, expect, it } from "vitest";

import { api, cleanup, createUser, makeTag, prisma } from "./helpers.js";

const tag = makeTag("smoke");

describe("test harness", () => {
  afterAll(async () => {
    await cleanup(tag);
    await prisma.$disconnect();
  });

  it("talks to the isolated test database", async () => {
    expect(new URL(process.env.DATABASE_URL).pathname).toMatch(/_test$/);
  });

  it("serves the health endpoint", async () => {
    const res = await api.get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("authenticates a created user", async () => {
    const user = await createUser(tag, "a");
    const res = await api.get("/auth/me", user);
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe(`${tag}_a`);
  });
});
