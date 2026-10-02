import { execSync } from "node:child_process";

// Runs once before the suite: bring the test database up to the current schema and make sure
// the lookup tables (subjects, classes...) are populated. Both steps are idempotent.
export default function setup(project) {
  const testEnv = project.config.env;

  const dbName = new URL(testEnv.DATABASE_URL).pathname.slice(1);
  if (!dbName.endsWith("_test")) {
    throw new Error(`Refusing to set up tests against database "${dbName}"`);
  }

  const env = {
    ...process.env,
    ...testEnv,
    // Blank (not undefined) so dotenv doesn't pull the real admin credentials from .env:
    // the seed then skips its admin step.
    ADMIN_USERNAME: "",
    ADMIN_EMAIL: "",
    ADMIN_PASSWORD: "",
  };

  execSync("npx prisma migrate deploy", { env, stdio: "pipe" });
  execSync("node prisma/seed.js", { env, stdio: "pipe" });
}
