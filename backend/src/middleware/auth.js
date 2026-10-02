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

module.exports = { requireAuth, requireRole };
