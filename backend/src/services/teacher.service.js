const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");

const PROFILE_INCLUDE = {
  subjects: { include: { subject: true } },
  grades: { include: { grade: true } },
  boards: { include: { board: true } },
  languages: { include: { language: true } },
  qualifications: true,
  experiences: true,
  availabilities: true,
};

function shapeProfile(profile) {
  return {
    ...profile,
    subjects: profile.subjects.map((ts) => ts.subject),
    grades: profile.grades.map((tg) => tg.grade),
    boards: profile.boards.map((tb) => tb.board),
    languages: profile.languages.map((tl) => tl.language),
  };
}

async function getRawOwnProfile(userId) {
  const profile = await prisma.teacherProfile.findUnique({
    where: { userId },
    include: PROFILE_INCLUDE,
  });
  if (!profile) {
    throw new AppError("Teacher profile not found", 404, "NOT_FOUND");
  }
  return profile;
}

async function getOwnProfile(userId) {
  const profile = await getRawOwnProfile(userId);
  return shapeProfile(profile);
}

async function updateOwnProfile(userId, data) {
  await getRawOwnProfile(userId);
  await prisma.teacherProfile.update({ where: { userId }, data });
  return getOwnProfile(userId);
}

function getPublishRequirementErrors(profile) {
  const errors = [];

  if (!profile.city) {
    errors.push("City is required before publishing");
  }

  const hasTeachingMode =
    profile.onlineAvailable ||
    profile.offlineAvailable ||
    profile.homeTuitionAvailable;
  if (!hasTeachingMode) {
    errors.push("At least one teaching mode (online, offline, or home tuition) is required");
  }

  if (!profile.headline && !profile.bio) {
    errors.push("A headline or bio is required before publishing");
  }

  if (profile.subjects.length === 0) {
    errors.push("At least one subject is required before publishing");
  }

  if (profile.grades.length === 0) {
    errors.push("At least one class/grade is required before publishing");
  }

  return errors;
}

async function publishOwnProfile(userId) {
  const profile = await getOwnProfile(userId);
  if (profile.isHiddenByAdmin) {
    throw new AppError(
      "This profile has been hidden by an administrator and can't be published",
      403,
      "PROFILE_HIDDEN"
    );
  }
  const errors = getPublishRequirementErrors(profile);

  if (errors.length > 0) {
    throw new AppError(errors.join("; "), 400, "PROFILE_INCOMPLETE");
  }

  await prisma.teacherProfile.update({ where: { userId }, data: { isPublished: true } });
  return getOwnProfile(userId);
}

async function unpublishOwnProfile(userId) {
  await getRawOwnProfile(userId);
  await prisma.teacherProfile.update({ where: { userId }, data: { isPublished: false } });
  return getOwnProfile(userId);
}

// Replaces a teacher's whole selection for one lookup (subjects, grades, boards or languages).
//
// The ids are validated BEFORE anything is deleted: createMany({ skipDuplicates }) quietly swallows
// foreign-key failures, so an unknown id would otherwise wipe the existing selection and insert
// nothing, with no error. Deactivated items can't be newly chosen, but a teacher who already has
// one keeps it (their profile still shows it, so the form sends it back on every save).
async function replaceSelection(userId, ids, { model, joinModel, field, label }) {
  const profile = await getRawOwnProfile(userId);
  const uniqueIds = [...new Set(ids)];

  const held = await prisma[joinModel].findMany({
    where: { teacherProfileId: profile.id },
    select: { [field]: true },
  });
  const heldIds = new Set(held.map((row) => row[field]));

  const found = await prisma[model].findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, isActive: true },
  });
  const usable = found.filter((item) => item.isActive || heldIds.has(item.id));
  if (usable.length !== uniqueIds.length) {
    throw new AppError(`One or more selected ${label} are not available`, 400, "VALIDATION_ERROR");
  }

  await prisma.$transaction([
    prisma[joinModel].deleteMany({ where: { teacherProfileId: profile.id } }),
    prisma[joinModel].createMany({
      data: uniqueIds.map((id) => ({ teacherProfileId: profile.id, [field]: id })),
    }),
  ]);
  return getOwnProfile(userId);
}

const setSubjects = (userId, ids) =>
  replaceSelection(userId, ids, {
    model: "subject",
    joinModel: "teacherSubject",
    field: "subjectId",
    label: "subjects",
  });

const setGrades = (userId, ids) =>
  replaceSelection(userId, ids, {
    model: "grade",
    joinModel: "teacherGrade",
    field: "gradeId",
    label: "classes",
  });

const setBoards = (userId, ids) =>
  replaceSelection(userId, ids, {
    model: "board",
    joinModel: "teacherBoard",
    field: "boardId",
    label: "boards",
  });

const setLanguages = (userId, ids) =>
  replaceSelection(userId, ids, {
    model: "language",
    joinModel: "teacherLanguage",
    field: "languageId",
    label: "languages",
  });

async function addQualification(userId, data) {
  const profile = await getRawOwnProfile(userId);
  await prisma.teacherQualification.create({
    data: { ...data, teacherProfileId: profile.id },
  });
  return getOwnProfile(userId);
}

async function deleteQualification(userId, qualificationId) {
  const profile = await getRawOwnProfile(userId);
  const qualification = await prisma.teacherQualification.findUnique({
    where: { id: qualificationId },
  });
  if (!qualification || qualification.teacherProfileId !== profile.id) {
    throw new AppError("Qualification not found", 404, "NOT_FOUND");
  }
  await prisma.teacherQualification.delete({ where: { id: qualificationId } });
  return getOwnProfile(userId);
}

async function addExperience(userId, data) {
  const profile = await getRawOwnProfile(userId);
  await prisma.teacherExperience.create({
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      teacherProfileId: profile.id,
    },
  });
  return getOwnProfile(userId);
}

async function deleteExperience(userId, experienceId) {
  const profile = await getRawOwnProfile(userId);
  const experience = await prisma.teacherExperience.findUnique({
    where: { id: experienceId },
  });
  if (!experience || experience.teacherProfileId !== profile.id) {
    throw new AppError("Experience entry not found", 404, "NOT_FOUND");
  }
  await prisma.teacherExperience.delete({ where: { id: experienceId } });
  return getOwnProfile(userId);
}

async function addAvailability(userId, data) {
  const profile = await getRawOwnProfile(userId);
  await prisma.teacherAvailability.create({
    data: { ...data, teacherProfileId: profile.id },
  });
  return getOwnProfile(userId);
}

async function deleteAvailability(userId, availabilityId) {
  const profile = await getRawOwnProfile(userId);
  const availability = await prisma.teacherAvailability.findUnique({
    where: { id: availabilityId },
  });
  if (!availability || availability.teacherProfileId !== profile.id) {
    throw new AppError("Availability slot not found", 404, "NOT_FOUND");
  }
  await prisma.teacherAvailability.delete({ where: { id: availabilityId } });
  return getOwnProfile(userId);
}

function toPublicProfile(profile, viewerId) {
  return {
    slug: profile.slug,
    // Lets the frontend hide actions that make no sense on your own page (e.g. "Contact").
    isOwner: viewerId != null && profile.userId === viewerId,
    name: profile.user.name,
    headline: profile.headline,
    bio: profile.bio,
    photoUrl: profile.photoUrl,
    gender: profile.gender,
    experienceYears: profile.experienceYears,
    qualificationSummary: profile.qualificationSummary,
    country: profile.country,
    state: profile.state,
    city: profile.city,
    area: profile.area,
    onlineAvailable: profile.onlineAvailable,
    offlineAvailable: profile.offlineAvailable,
    homeTuitionAvailable: profile.homeTuitionAvailable,
    studentCanVisit: profile.studentCanVisit,
    groupTuitionAvailable: profile.groupTuitionAvailable,
    individualTuitionAvailable: profile.individualTuitionAvailable,
    demoClassAvailable: profile.demoClassAvailable,
    feeMin: profile.feeMin,
    feeMax: profile.feeMax,
    contactPreference: profile.contactPreference,
    // The number itself is never in the public payload; logged-in users unlock it through
    // GET /:slug/contact-number. This flag only says there is one to unlock.
    hasContactNumber:
      profile.contactPreference !== "PLATFORM_ONLY" && Boolean(profile.contactNumber),
    isVerified: profile.isVerified,
    subjects: profile.subjects.map((ts) => ts.subject.name),
    grades: profile.grades.map((tg) => tg.grade.name),
    boards: profile.boards.map((tb) => tb.board.name),
    languages: profile.languages.map((tl) => tl.language.name),
    qualifications: profile.qualifications.map((q) => ({
      title: q.title,
      institution: q.institution,
      yearCompleted: q.yearCompleted,
      type: q.type,
    })),
    experiences: profile.experiences.map((e) => ({
      institutionName: e.institutionName,
      role: e.role,
      startDate: e.startDate,
      endDate: e.endDate,
      description: e.description,
    })),
    availabilities: profile.availabilities.map((a) => ({
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
    })),
  };
}

async function getPublicProfileBySlug(slug, viewerId) {
  const profile = await prisma.teacherProfile.findUnique({
    where: { slug },
    include: { user: true, ...PROFILE_INCLUDE },
  });

  if (
    !profile ||
    !profile.isPublished ||
    profile.isHiddenByAdmin ||
    profile.user.status !== "ACTIVE"
  ) {
    throw new AppError("Teacher profile not found", 404, "NOT_FOUND");
  }

  return toPublicProfile(profile, viewerId);
}

module.exports = {
  getOwnProfile,
  updateOwnProfile,
  publishOwnProfile,
  unpublishOwnProfile,
  setSubjects,
  setGrades,
  setBoards,
  setLanguages,
  addQualification,
  deleteQualification,
  addExperience,
  deleteExperience,
  addAvailability,
  deleteAvailability,
  getPublicProfileBySlug,
};
