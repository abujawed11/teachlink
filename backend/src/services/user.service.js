const bcrypt = require("bcryptjs");

const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");

const SALT_ROUNDS = 10;

// Never include the password hash.
const SAFE_USER_SELECT = {
  id: true,
  name: true,
  username: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  isEmailVerified: true,
  createdAt: true,
  updatedAt: true,
};

async function updateAccount(userId, changes) {
  return prisma.user.update({
    where: { id: userId },
    data: changes,
    select: SAFE_USER_SELECT,
  });
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("User not found", 404, "NOT_FOUND");
  }

  // 400, not 401: the session itself is fine, only the supplied password is wrong.
  const matches = await bcrypt.compare(currentPassword, user.password);
  if (!matches) {
    throw new AppError("Your current password is incorrect", 400, "INVALID_PASSWORD");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { password: await bcrypt.hash(newPassword, SALT_ROUNDS) },
  });
}

module.exports = { updateAccount, changePassword };
