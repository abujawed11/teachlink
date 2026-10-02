const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const { verifyAccessToken } = require("../utils/jwt");

function requireAuth(req, res, next) {
  const token = req.cookies?.accessToken;
  if (!token) {
    return next(new AppError("Authentication required", 401, "UNAUTHENTICATED"));
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    next(new AppError("Invalid or expired session", 401, "UNAUTHENTICATED"));
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("Forbidden", 403, "FORBIDDEN"));
    }
    next();
  };
}

// Admin routes re-check the database rather than trusting the token, so a demoted or
// suspended admin loses access immediately instead of when their token expires.
async function requireActiveAdmin(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { role: true, status: true },
    });
    if (!user || user.role !== "ADMIN" || user.status !== "ACTIVE") {
      return next(new AppError("Forbidden", 403, "FORBIDDEN"));
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth, requireRole, requireActiveAdmin };
