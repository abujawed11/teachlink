const rateLimit = require("express-rate-limit");

const FIFTEEN_MINUTES = 15 * 60 * 1000;

// Returns the same JSON error shape as the rest of the API (the frontend shows
// `error.message`), instead of express-rate-limit's default plain-text body.
function makeLimiter({ max, message, windowMs = FIFTEEN_MINUTES, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    // Evaluated per request so automated tests can switch limiting on for one case.
    skip: () => process.env.DISABLE_RATE_LIMIT === "1",
    handler: (req, res) => {
      res.status(429).json({ error: { message, code: "RATE_LIMITED" } });
    },
  });
}

// Everything under /api, per IP. Generous: a single page of browsing makes several requests.
const globalLimiter = makeLimiter({
  max: 600,
  message: "Too many requests. Please slow down and try again in a few minutes.",
});

// Creating accounts.
const registerLimiter = makeLimiter({
  max: 10,
  message: "Too many sign-up attempts. Please try again in 15 minutes.",
});

// Only failed logins count, so a normal user is never locked out by logging in successfully,
// while password guessing is stopped after a handful of tries.
const loginLimiter = makeLimiter({
  max: 10,
  skipSuccessfulRequests: true,
  message: "Too many failed login attempts. Please try again in 15 minutes.",
});

// Guessing the current password through a (possibly stolen) session.
const passwordLimiter = makeLimiter({
  max: 5,
  skipSuccessfulRequests: true,
  message: "Too many failed password attempts. Please try again in 15 minutes.",
});

const refreshLimiter = makeLimiter({
  max: 60,
  message: "Too many session refresh attempts. Please log in again.",
});

module.exports = { globalLimiter, registerLimiter, loginLimiter, passwordLimiter, refreshLimiter };
