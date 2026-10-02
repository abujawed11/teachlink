import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";

import { app, prisma } from "./helpers.js";

afterAll(async () => {
  await prisma.$disconnect();
});

describe("malformed and oversized requests", () => {
  it("answers invalid JSON with a 400, not a 500", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{not valid json");
    expect(res.status).toBe(400);
    expect(res.body.error).toEqual({ message: "The request body is not valid JSON", code: "BAD_REQUEST" });
  });

  it("answers an oversized body with a 413", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "a", password: "b", padding: "x".repeat(200_000) });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe("BAD_REQUEST");
  });

  it("answers unknown API routes with JSON, not an HTML page", async () => {
    const res = await request(app).get("/api/does/not/exist?x=1");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(res.body.error.message).toContain("GET /api/does/not/exist");
  });

  it("never exposes a stack trace or framework details in errors", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{bad");
    expect(JSON.stringify(res.body)).not.toMatch(/at |node_modules|\.js:\d+/);
  });
});

describe("security headers", () => {
  it("sets the standard Helmet protections and hides the framework", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBeDefined();
    expect(res.headers["strict-transport-security"]).toBeDefined();
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("lets uploaded photos load from the frontend's different origin", async () => {
    const res = await request(app).get("/uploads/missing.webp");
    expect(res.status).toBe(404);
    // Static 404s don't pass through setHeaders, so assert on a real file instead:
    const dir = process.env.UPLOAD_DIR;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "hardening-probe.txt"), "x");
    try {
      const ok = await request(app).get("/uploads/hardening-probe.txt");
      expect(ok.status).toBe(200);
      expect(ok.headers["cross-origin-resource-policy"]).toBe("cross-origin");
    } finally {
      fs.rmSync(path.join(dir, "hardening-probe.txt"), { force: true });
    }
  });
});

describe("CORS", () => {
  it("allows credentialed requests from the configured frontend", async () => {
    const res = await request(app).get("/api/health").set("Origin", "http://localhost:5173");
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("does not grant access to any other origin", async () => {
    const res = await request(app).get("/api/health").set("Origin", "http://evil.example");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("answers a preflight from the frontend and denies one from elsewhere", async () => {
    const allowed = await request(app)
      .options("/api/users/me")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "PATCH");
    expect(allowed.headers["access-control-allow-origin"]).toBe("http://localhost:5173");

    const denied = await request(app)
      .options("/api/users/me")
      .set("Origin", "http://evil.example")
      .set("Access-Control-Request-Method", "PATCH");
    expect(denied.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

// ---- Startup configuration ------------------------------------------------------------------
// env.js runs its checks at import time, so each case runs it in a fresh Node process, from an
// empty directory so dotenv can't pull the developer's real .env into the scenario.

const ENV_MODULE = path.resolve("src/config/env.js");
const STRONG_A = "a".repeat(48);
const STRONG_B = "b".repeat(48);

function loadEnvModule(overrides, print = "") {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "teachlink-env-"));
  try {
    const result = spawnSync(
      process.execPath,
      ["-e", `const env = require(${JSON.stringify(ENV_MODULE)}); ${print}`],
      {
        cwd,
        encoding: "utf8",
        env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, DATABASE_URL: "mysql://x", ...overrides },
      }
    );
    return { status: result.status, stdout: result.stdout, stderr: result.stderr };
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
}

const productionEnv = {
  NODE_ENV: "production",
  JWT_SECRET: STRONG_A,
  JWT_REFRESH_SECRET: STRONG_B,
  FRONTEND_URL: "https://teachlink.example",
};

describe("startup configuration checks", () => {
  it("starts in production with strong, distinct secrets and a frontend URL", () => {
    expect(loadEnvModule(productionEnv).status).toBe(0);
  });

  it.each([
    ["placeholder secrets", { JWT_SECRET: "change_this_secret", JWT_REFRESH_SECRET: "change_this_refresh_secret" }, /placeholder/],
    ["short secrets", { JWT_SECRET: "short", JWT_REFRESH_SECRET: "alsoshort" }, /at least 32/],
    ["the same secret for both tokens", { JWT_REFRESH_SECRET: STRONG_A }, /must be different/],
    ["no FRONTEND_URL", { FRONTEND_URL: "" }, /FRONTEND_URL/],
  ])("refuses to start in production with %s", (_label, override, message) => {
    const result = loadEnvModule({ ...productionEnv, ...override });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(message);
  });

  it("only warns outside production, and says how to fix it", () => {
    const result = loadEnvModule({
      NODE_ENV: "development",
      JWT_SECRET: "change_this_secret",
      JWT_REFRESH_SECRET: "change_this_refresh_secret",
    });
    expect(result.status).toBe(0);
    expect(result.stderr).toMatch(/\[security\].*placeholder/s);
    expect(result.stderr).toMatch(/randomBytes/);
  });

  it("is quiet in the test environment", () => {
    const result = loadEnvModule({ NODE_ENV: "test", JWT_SECRET: "x", JWT_REFRESH_SECRET: "y" });
    expect(result.status).toBe(0);
    expect(result.stderr).not.toContain("[security]");
  });

  it("still requires the core variables", () => {
    const result = loadEnvModule({ NODE_ENV: "development", JWT_REFRESH_SECRET: STRONG_B });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/Missing required environment variable: JWT_SECRET/);
  });

  it.each([
    [undefined, "undefined"],
    ["1", "1"],
    ["2", "2"],
    ["true", "true"],
    ["false", "false"],
  ])("reads TRUST_PROXY=%s", (value, expected) => {
    const result = loadEnvModule(
      { ...productionEnv, ...(value === undefined ? {} : { TRUST_PROXY: value }) },
      "console.log(String(env.trustProxy))"
    );
    expect(result.stdout.trim()).toBe(expected);
  });

  it("supports several allowed frontend origins", () => {
    const result = loadEnvModule(
      { ...productionEnv, FRONTEND_URL: "https://a.example, https://b.example" },
      "console.log(JSON.stringify(env.frontendUrls))"
    );
    expect(JSON.parse(result.stdout)).toEqual(["https://a.example", "https://b.example"]);
  });
});

describe("auth cookies", () => {
  const cookieOptions = (nodeEnv) =>
    JSON.parse(
      execFileSync(
        process.execPath,
        [
          "-e",
          `const res = { cookie: (n, v, o) => (out[n] = o) }; const out = {};
           require(${JSON.stringify(path.resolve("src/utils/cookies.js"))}).setAuthCookies(res, { accessToken: "a", refreshToken: "r" });
           console.log(JSON.stringify(out));`,
        ],
        {
          encoding: "utf8",
          env: {
            PATH: process.env.PATH,
            SystemRoot: process.env.SystemRoot,
            NODE_ENV: nodeEnv,
            DATABASE_URL: "mysql://x",
            JWT_SECRET: STRONG_A,
            JWT_REFRESH_SECRET: STRONG_B,
            FRONTEND_URL: "https://teachlink.example",
          },
          cwd: fs.mkdtempSync(path.join(os.tmpdir(), "teachlink-cookie-")),
        }
      )
    );

  it("are HttpOnly and SameSite=Lax always, and Secure in production", () => {
    for (const env of ["development", "production"]) {
      const { accessToken, refreshToken } = cookieOptions(env);
      for (const options of [accessToken, refreshToken]) {
        expect(options.httpOnly).toBe(true);
        expect(options.sameSite).toBe("lax");
        expect(options.secure).toBe(env === "production");
      }
    }
  });

  it("expire after 15 minutes (access) and 30 days (refresh)", () => {
    const { accessToken, refreshToken } = cookieOptions("production");
    expect(accessToken.maxAge).toBe(15 * 60 * 1000);
    expect(refreshToken.maxAge).toBe(30 * 24 * 60 * 60 * 1000);
  });
});
