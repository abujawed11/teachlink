import bcrypt from "bcryptjs";
import request from "supertest";

import app from "../src/app.js";
import prisma from "../src/lib/prisma.js";
import { signAccessToken } from "../src/utils/jwt.js";

export { app, prisma };

export const PASSWORD = "Passw0rd!x";
const PASSWORD_HASH = bcrypt.hashSync(PASSWORD, 4); // low cost: tests create many users

// Every test file works under its own tag so its rows can be found and removed afterwards
// without touching anything else in the database.
export function makeTag(prefix = "t") {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export async function createUser(tag, key, role = "USER", extra = {}) {
  return prisma.user.create({
    data: {
      name: key,
      username: `${tag}_${key}`,
      email: `${tag}_${key}@test.local`,
      password: PASSWORD_HASH,
      role,
      ...extra,
    },
  });
}

// A teacher account plus its profile. Defaults to a published, fully visible profile.
export async function createTeacher(tag, key, profile = {}, userExtra = {}) {
  const user = await createUser(tag, key, "TEACHER", userExtra);
  const teacherProfile = await prisma.teacherProfile.create({
    data: {
      userId: user.id,
      slug: `${tag}-${key}`,
      isPublished: true,
      city: "Testville",
      headline: `${key} headline`,
      onlineAvailable: true,
      ...profile,
    },
  });
  return { user, profile: teacherProfile, slug: teacherProfile.slug };
}

export function cookieFor(user, roleOverride) {
  return `accessToken=${signAccessToken({ sub: user.id, role: roleOverride || user.role })}`;
}

// Tiny wrapper so tests read `api.get(path, user)` instead of repeating cookie plumbing.
export const api = {
  get: (path, user) => withAuth(request(app).get(`/api${path}`), user),
  post: (path, user, body) => withAuth(request(app).post(`/api${path}`), user).send(body),
  put: (path, user, body) => withAuth(request(app).put(`/api${path}`), user).send(body),
  patch: (path, user, body) => withAuth(request(app).patch(`/api${path}`), user).send(body),
  delete: (path, user) => withAuth(request(app).delete(`/api${path}`), user),
};

function withAuth(req, user) {
  return user ? req.set("Cookie", cookieFor(user)) : req;
}

// Removes everything a test file created. Users cascade to profiles, requests and reveals.
export async function cleanup(tag) {
  await prisma.user.deleteMany({ where: { username: { startsWith: `${tag}_` } } });
}
