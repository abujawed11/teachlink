const asyncHandler = require("../middleware/asyncHandler");
const authService = require("../services/auth.service");
const { setAuthCookies, clearAuthCookies } = require("../utils/cookies");
const { verifyRefreshToken } = require("../utils/jwt");
const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");

function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser({ ...req.body, role: "USER" });
  const tokens = authService.issueTokens(user);
  setAuthCookies(res, tokens);
  res.status(201).json({ user: sanitizeUser(user) });
});

const registerTeacher = asyncHandler(async (req, res) => {
  const user = await authService.registerUser({ ...req.body, role: "TEACHER" });
  const tokens = authService.issueTokens(user);
  setAuthCookies(res, tokens);
  res.status(201).json({ user: sanitizeUser(user) });
});

const login = asyncHandler(async (req, res) => {
  const user = await authService.authenticateUser(req.body);
  const tokens = authService.issueTokens(user);
  setAuthCookies(res, tokens);
  res.json({ user: sanitizeUser(user) });
});

const logout = asyncHandler(async (req, res) => {
  clearAuthCookies(res);
  res.json({ success: true });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
  }

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch (err) {
    throw new AppError("Invalid or expired session", 401, "UNAUTHENTICATED");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.status === "SUSPENDED") {
    throw new AppError("Invalid or expired session", 401, "UNAUTHENTICATED");
  }

  const tokens = authService.issueTokens(user);
  setAuthCookies(res, tokens);
  res.json({ success: true });
});

const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
  if (!user) {
    throw new AppError("User not found", 404, "NOT_FOUND");
  }
  if (user.status === "SUSPENDED") {
    clearAuthCookies(res);
    throw new AppError("This account has been suspended", 403, "ACCOUNT_SUSPENDED");
  }
  res.json({ user: sanitizeUser(user) });
});

module.exports = { register, registerTeacher, login, logout, refresh, me };
