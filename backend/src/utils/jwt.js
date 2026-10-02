const jwt = require("jsonwebtoken");
const env = require("../config/env");

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "30d";

function signAccessToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: ACCESS_TOKEN_TTL });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: REFRESH_TOKEN_TTL });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
