require("dotenv").config();

const required = ["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

const MIN_SECRET_LENGTH = 32;
const PLACEHOLDER_SECRET = /^(change[_-]?this|changeme|secret|password|your[_-]|example)/i;

// Anyone who knows a JWT secret can forge a login (including an admin's), so production refuses
// to start with a weak, placeholder or reused one. Elsewhere it only warns, so local dev and
// tests aren't blocked.
function checkSecrets() {
  const problems = [];

  for (const key of ["JWT_SECRET", "JWT_REFRESH_SECRET"]) {
    const value = process.env[key];
    if (PLACEHOLDER_SECRET.test(value)) {
      problems.push(`${key} is still a placeholder value`);
    } else if (value.length < MIN_SECRET_LENGTH) {
      problems.push(`${key} must be at least ${MIN_SECRET_LENGTH} characters`);
    }
  }
  if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    problems.push("JWT_SECRET and JWT_REFRESH_SECRET must be different");
  }
  if (isProduction && !process.env.FRONTEND_URL) {
    problems.push("FRONTEND_URL must be set (it is the only origin allowed by CORS)");
  }

  if (problems.length === 0) return;

  const summary = problems.map((problem) => `  - ${problem}`).join("\n");
  if (isProduction) {
    throw new Error(`Refusing to start in production with insecure configuration:\n${summary}`);
  }
  if (nodeEnv !== "test") {
    console.warn(
      `[security] Insecure configuration (fine for local development, not for deployment):\n${summary}\n` +
        "  Generate secrets with: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
    );
  }
}

checkSecrets();

// TRUST_PROXY: number of reverse-proxy hops in front of the app (e.g. 1 on most hosts), so rate
// limiting sees each visitor's real IP rather than the proxy's. Leave unset when not behind one.
function parseTrustProxy(value) {
  if (value === undefined || value === "") return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  const hops = Number(value);
  return Number.isInteger(hops) && hops >= 0 ? hops : value;
}

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv,
  isProduction,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  // One or more comma-separated origins allowed to call the API with cookies.
  frontendUrls: (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean),
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
};
