const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");

function paginate(total, page, pageSize) {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

// ---------- Users ----------

async function listUsers({ q, role, status, page, pageSize }) {
  const where = {};
  if (role) where.role = role;
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { username: { contains: q } },
      { email: { contains: q } },
    ];
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      // Never select the password hash.
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  return { users, pagination: paginate(total, page, pageSize) };
}

async function setUserStatus(adminId, userId, status) {
  if (userId === adminId) {
    throw new AppError("You can't change your own account status", 400, "VALIDATION_ERROR");
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) {
    throw new AppError("User not found", 404, "NOT_FOUND");
  }
  // Admin accounts are managed directly in the database, never through the UI.
  if (user.role === "ADMIN") {
    throw new AppError("Admin accounts can't be suspended here", 403, "FORBIDDEN");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { status },
    select: { id: true, name: true, username: true, email: true, role: true, status: true, createdAt: true },
  });
}

// ---------- Teachers ----------

const TEACHER_SELECT = {
  id: true,
  slug: true,
  city: true,
  isPublished: true,
  isHiddenByAdmin: true,
  isVerified: true,
  createdAt: true,
  user: { select: { name: true, username: true, status: true } },
};

function toTeacherRow(profile) {
  const { user, ...rest } = profile;
  return {
    ...rest,
    name: user.name,
    username: user.username,
    accountStatus: user.status,
    // What a visitor can actually see right now.
    isVisible: profile.isPublished && !profile.isHiddenByAdmin && user.status === "ACTIVE",
  };
}

async function listTeachers({ q, visibility, page, pageSize }) {
  const where = {};
  if (visibility === "published") {
    where.isPublished = true;
    where.isHiddenByAdmin = false;
  } else if (visibility === "draft") {
    where.isPublished = false;
  } else if (visibility === "hidden") {
    where.isHiddenByAdmin = true;
  }
  if (q) {
    where.OR = [
      { user: { name: { contains: q } } },
      { user: { username: { contains: q } } },
      { city: { contains: q } },
    ];
  }

  const [total, profiles] = await Promise.all([
    prisma.teacherProfile.count({ where }),
    prisma.teacherProfile.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: TEACHER_SELECT,
    }),
  ]);

  return { teachers: profiles.map(toTeacherRow), pagination: paginate(total, page, pageSize) };
}

async function moderateTeacher(profileId, changes) {
  const existing = await prisma.teacherProfile.findUnique({
    where: { id: profileId },
    select: { id: true },
  });
  if (!existing) {
    throw new AppError("Teacher profile not found", 404, "NOT_FOUND");
  }

  const profile = await prisma.teacherProfile.update({
    where: { id: profileId },
    data: changes,
    select: TEACHER_SELECT,
  });
  return toTeacherRow(profile);
}

// ---------- Lookups (subjects, grades, boards, languages) ----------

const LOOKUPS = {
  subjects: { model: "subject", sorted: false },
  grades: { model: "grade", sorted: true },
  boards: { model: "board", sorted: false },
  languages: { model: "language", sorted: false },
};

function getLookup(type) {
  const lookup = LOOKUPS[type];
  if (!lookup) {
    throw new AppError("Unknown lookup type", 404, "NOT_FOUND");
  }
  return { ...lookup, table: prisma[lookup.model] };
}

async function listLookup(type) {
  const { table, sorted } = getLookup(type);
  const items = await table.findMany({
    orderBy: sorted ? [{ sortOrder: "asc" }, { name: "asc" }] : { name: "asc" },
    include: { _count: { select: { teachers: true } } },
  });
  return items.map(({ _count, ...item }) => ({ ...item, teacherCount: _count.teachers }));
}

async function createLookup(type, { name, sortOrder }) {
  const { table, sorted } = getLookup(type);

  if (await table.findUnique({ where: { name } })) {
    throw new AppError(`"${name}" already exists`, 409, "CONFLICT");
  }

  const data = { name };
  if (sorted) {
    // New classes go to the end unless the admin picks a position.
    const last = await table.aggregate({ _max: { sortOrder: true } });
    data.sortOrder = sortOrder ?? (last._max.sortOrder ?? -1) + 1;
  }
  return table.create({ data });
}

// Lookups are deactivated rather than deleted, because teachers' profiles still reference them.
async function updateLookup(type, id, { name, isActive, sortOrder }) {
  const { table, sorted } = getLookup(type);

  const existing = await table.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Item not found", 404, "NOT_FOUND");
  }

  if (name && name !== existing.name) {
    const clash = await table.findUnique({ where: { name } });
    if (clash && clash.id !== id) {
      throw new AppError(`"${name}" already exists`, 409, "CONFLICT");
    }
  }

  const data = {};
  if (name !== undefined) data.name = name;
  if (isActive !== undefined) data.isActive = isActive;
  if (sortOrder !== undefined && sorted) data.sortOrder = sortOrder;

  return table.update({ where: { id }, data });
}

module.exports = {
  listUsers,
  setUserStatus,
  listTeachers,
  moderateTeacher,
  listLookup,
  createLookup,
  updateLookup,
};
