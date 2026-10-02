const env = require("../config/env");

const isProd = env.nodeEnv === "production";

const accessCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  maxAge: 15 * 60 * 1000,
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie("accessToken", accessToken, accessCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
}

function clearAuthCookies(res) {
  res.clearCookie("accessToken", accessCookieOptions);
  res.clearCookie("refreshToken", refreshCookieOptions);
}

module.exports = { setAuthCookies, clearAuthCookies };
