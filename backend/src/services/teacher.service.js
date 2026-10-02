const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");

async function getOwnProfile(userId) {
  const profile = await prisma.teacherProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new AppError("Teacher profile not found", 404, "NOT_FOUND");
  }
  return profile;
}

async function updateOwnProfile(userId, data) {
  await getOwnProfile(userId);
  return prisma.teacherProfile.update({ where: { userId }, data });
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

  return errors;
}

async function publishOwnProfile(userId) {
  const profile = await getOwnProfile(userId);
  const errors = getPublishRequirementErrors(profile);

  if (errors.length > 0) {
    throw new AppError(errors.join("; "), 400, "PROFILE_INCOMPLETE");
  }

  return prisma.teacherProfile.update({
    where: { userId },
    data: { isPublished: true },
  });
}

async function unpublishOwnProfile(userId) {
  await getOwnProfile(userId);
  return prisma.teacherProfile.update({
    where: { userId },
    data: { isPublished: false },
  });
}

function toPublicProfile(profile) {
  return {
    slug: profile.slug,
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
    isVerified: profile.isVerified,
  };
}

async function getPublicProfileBySlug(slug) {
  const profile = await prisma.teacherProfile.findUnique({
    where: { slug },
    include: { user: true },
  });

  if (!profile || !profile.isPublished || profile.user.status !== "ACTIVE") {
    throw new AppError("Teacher profile not found", 404, "NOT_FOUND");
  }

  return toPublicProfile(profile);
}

module.exports = {
  getOwnProfile,
  updateOwnProfile,
  publishOwnProfile,
  unpublishOwnProfile,
  getPublicProfileBySlug,
};
