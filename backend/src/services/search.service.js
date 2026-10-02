const prisma = require("../lib/prisma");

const MODE_FIELDS = {
  online: "onlineAvailable",
  offline: "offlineAvailable",
  home: "homeTuitionAvailable",
  visit: "studentCanVisit",
  group: "groupTuitionAvailable",
  individual: "individualTuitionAvailable",
  demo: "demoClassAvailable",
};

const MODE_LABELS = [
  ["onlineAvailable", "Online"],
  ["offlineAvailable", "Offline"],
  ["homeTuitionAvailable", "Home Tuition"],
];

// Always secondary-sorted by id so pagination stays stable when the primary value ties.
const ORDER_BY = {
  newest: [{ createdAt: "desc" }, { id: "desc" }],
  experience_desc: [{ experienceYears: "desc" }, { id: "desc" }],
  fee_asc: [{ feeMin: "asc" }, { id: "desc" }],
  fee_desc: [{ feeMin: "desc" }, { id: "desc" }],
};

// Only fields that are safe to show to anyone — this is a card, not the full profile.
const CARD_SELECT = {
  slug: true,
  headline: true,
  photoUrl: true,
  city: true,
  area: true,
  experienceYears: true,
  feeMin: true,
  feeMax: true,
  isVerified: true,
  onlineAvailable: true,
  offlineAvailable: true,
  homeTuitionAvailable: true,
  user: { select: { name: true } },
  subjects: { select: { subject: { select: { name: true } } } },
  grades: { select: { grade: { select: { name: true } } } },
};

function buildWhere(filters) {
  // AND across different filters, OR within a single filter's list of values.
  const where = {
    isPublished: true,
    user: { status: "ACTIVE" },
  };

  if (filters.subject) {
    where.subjects = { some: { subject: { name: { in: filters.subject }, isActive: true } } };
  }
  if (filters.grade) {
    where.grades = { some: { grade: { name: { in: filters.grade }, isActive: true } } };
  }
  if (filters.board) {
    where.boards = { some: { board: { name: { in: filters.board }, isActive: true } } };
  }
  if (filters.language) {
    where.languages = { some: { language: { name: { in: filters.language } } } };
  }
  if (filters.city) {
    where.OR = [
      { city: { contains: filters.city } },
      { area: { contains: filters.city } },
    ];
  }
  if (filters.mode) {
    where[MODE_FIELDS[filters.mode]] = true;
  }
  if (filters.feeMax != null) {
    // A teacher is within budget if their lowest fee fits; unknown fees can't be matched.
    where.feeMin = { lte: filters.feeMax };
  }
  if (filters.experienceMin != null) {
    where.experienceYears = { gte: filters.experienceMin };
  }

  return where;
}

function toCard(profile) {
  return {
    slug: profile.slug,
    name: profile.user.name,
    headline: profile.headline,
    photoUrl: profile.photoUrl,
    city: profile.city,
    area: profile.area,
    experienceYears: profile.experienceYears,
    feeMin: profile.feeMin,
    feeMax: profile.feeMax,
    isVerified: profile.isVerified,
    modes: MODE_LABELS.filter(([field]) => profile[field]).map(([, label]) => label),
    subjects: profile.subjects.map((ts) => ts.subject.name),
    grades: profile.grades.map((tg) => tg.grade.name),
  };
}

async function searchTeachers(filters) {
  const where = buildWhere(filters);
  const { page, pageSize } = filters;

  const [total, profiles] = await Promise.all([
    prisma.teacherProfile.count({ where }),
    prisma.teacherProfile.findMany({
      where,
      select: CARD_SELECT,
      orderBy: ORDER_BY[filters.sort],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    teachers: profiles.map(toCard),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

module.exports = { searchTeachers };
