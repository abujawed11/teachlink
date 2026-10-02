import os from "node:os";
import path from "node:path";

import dotenv from "dotenv";
import { defineConfig } from "vitest/config";

dotenv.config({ quiet: true });

// Tests run against their own database so they can never touch real data. The name is derived
// from DATABASE_URL, and the suite refuses to start unless it ends in "_test".
const devUrl = process.env.DATABASE_URL;
if (!devUrl) throw new Error("DATABASE_URL must be set in backend/.env to run the tests");
const testUrl = devUrl.replace(/\/[^/?]+(\?|$)/, "/teachlink_test$1");
const dbName = new URL(testUrl).pathname.slice(1);
if (!dbName.endsWith("_test")) {
  throw new Error(`Refusing to run tests against database "${dbName}" (name must end in _test)`);
}

export default defineConfig({
  test: {
    include: ["tests/**/*.test.js"],
    globalSetup: ["./tests/globalSetup.mjs"],
    // The files share one database and some assert on global state (rate limits, lookups).
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 120_000,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: testUrl,
      JWT_SECRET: "test-access-secret-0123456789abcdef0123456789abcdef",
      JWT_REFRESH_SECRET: "test-refresh-secret-fedcba9876543210fedcba9876543210",
      FRONTEND_URL: "http://localhost:5173",
      DISABLE_RATE_LIMIT: "1",
      UPLOAD_DIR: path.join(os.tmpdir(), "teachlink-test-uploads"),
    },
  },
});
