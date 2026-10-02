const bcrypt = require("bcryptjs");

const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const slugify = require("../utils/slugify");
const { signAccessToken, signRefreshToken } = require("../utils/jwt");

const SALT_ROUNDS = 10;

async function generateUniqueSlug(name) {
  const base = slugify(name) || "teacher";
  let slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;

  while (await prisma.teacherProfile.findUnique({ where: { slug } })) {
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }

  return slug;
}

async function registerUser({ name, email, password, role = "USER" }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError("This email is already registered", 409, "EMAIL_IN_USE");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role },
  });

  if (role === "TEACHER") {
    const slug = await generateUniqueSlug(name);
    await prisma.teacherProfile.create({
      data: { userId: user.id, slug },
    });
  }

  return user;
}

async function authenticateUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  if (user.status === "SUSPENDED") {
    throw new AppError("This account has been suspended", 403, "ACCOUNT_SUSPENDED");
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  return user;
}

function buildTokenPayload(user) {
  return { sub: user.id, role: user.role, email: user.email };
}

function issueTokens(user) {
  const payload = buildTokenPayload(user);
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

module.exports = { registerUser, authenticateUser, issueTokens };
