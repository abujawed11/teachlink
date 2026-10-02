const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");

// Each request is tied to a real account, so abuse is capped per sender rather than per IP.
const DAILY_REQUEST_LIMIT = 5;
const DAY_MS = 24 * 60 * 60 * 1000;
const LIST_LIMIT = 100;
// Distinct teachers whose number one account may unlock per day — stops bulk harvesting.
const DAILY_REVEAL_LIMIT = 20;

async function sendRequest(senderId, slug, { message, phone }) {
  const profile = await prisma.teacherProfile.findUnique({
    where: { slug },
    include: { user: { select: { status: true } } },
  });

  if (!profile || !profile.isPublished || profile.user.status !== "ACTIVE") {
    throw new AppError("Teacher profile not found", 404, "NOT_FOUND");
  }

  if (profile.userId === senderId) {
    throw new AppError("You can't send a request to your own profile", 400, "VALIDATION_ERROR");
  }

  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { status: true },
  });
  if (!sender || sender.status !== "ACTIVE") {
    throw new AppError("Your account can't send requests", 403, "FORBIDDEN");
  }

  const sentToday = await prisma.contactRequest.count({
    where: { senderId, createdAt: { gte: new Date(Date.now() - DAY_MS) } },
  });
  if (sentToday >= DAILY_REQUEST_LIMIT) {
    throw new AppError(
      `You can send up to ${DAILY_REQUEST_LIMIT} requests per day. Please try again tomorrow.`,
      429,
      "RATE_LIMITED"
    );
  }

  const request = await prisma.contactRequest.create({
    data: { teacherProfileId: profile.id, senderId, message, phone: phone || null },
    select: { id: true, createdAt: true },
  });
  return request;
}

async function revealContactNumber(userId, slug) {
  const profile = await prisma.teacherProfile.findUnique({
    where: { slug },
    include: { user: { select: { status: true } } },
  });

  const optedIn =
    profile && profile.contactPreference !== "PLATFORM_ONLY" && Boolean(profile.contactNumber);
  if (!profile || !profile.isPublished || profile.user.status !== "ACTIVE" || !optedIn) {
    throw new AppError("This teacher hasn't shared a contact number", 404, "NOT_FOUND");
  }

  const key = { userId_teacherProfileId: { userId, teacherProfileId: profile.id } };
  const alreadyUnlocked = await prisma.contactReveal.findUnique({ where: key });

  // Numbers you've already unlocked stay available and don't count against the daily limit.
  if (!alreadyUnlocked && profile.userId !== userId) {
    const revealedToday = await prisma.contactReveal.count({
      where: { userId, createdAt: { gte: new Date(Date.now() - DAY_MS) } },
    });
    if (revealedToday >= DAILY_REVEAL_LIMIT) {
      throw new AppError(
        `You can unlock up to ${DAILY_REVEAL_LIMIT} new contact numbers per day. Please try again tomorrow.`,
        429,
        "RATE_LIMITED"
      );
    }
    await prisma.contactReveal.create({ data: { userId, teacherProfileId: profile.id } });
  }

  return { contactPreference: profile.contactPreference, contactNumber: profile.contactNumber };
}

async function getOwnTeacherProfileId(userId) {
  const profile = await prisma.teacherProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) {
    throw new AppError("Teacher profile not found", 404, "NOT_FOUND");
  }
  return profile.id;
}

// Teachers see who contacted them — the sender's account email and any phone they chose to
// include are shared with this teacher only.
async function listReceived(userId) {
  const teacherProfileId = await getOwnTeacherProfileId(userId);

  const [requests, unreadCount] = await Promise.all([
    prisma.contactRequest.findMany({
      where: { teacherProfileId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: LIST_LIMIT,
      include: { sender: { select: { name: true, email: true } } },
    }),
    prisma.contactRequest.count({ where: { teacherProfileId, isRead: false } }),
  ]);

  return {
    unreadCount,
    requests: requests.map((r) => ({
      id: r.id,
      message: r.message,
      phone: r.phone,
      isRead: r.isRead,
      createdAt: r.createdAt,
      sender: { name: r.sender.name, email: r.sender.email },
    })),
  };
}

async function getUnreadCount(userId) {
  const teacherProfileId = await getOwnTeacherProfileId(userId);
  return prisma.contactRequest.count({ where: { teacherProfileId, isRead: false } });
}

async function markRead(userId, requestId) {
  const teacherProfileId = await getOwnTeacherProfileId(userId);
  // Scoping the update to this teacher's profile means other teachers' ids are simply "not found".
  const result = await prisma.contactRequest.updateMany({
    where: { id: requestId, teacherProfileId },
    data: { isRead: true },
  });
  if (result.count === 0) {
    throw new AppError("Request not found", 404, "NOT_FOUND");
  }
}

async function listSent(userId) {
  const requests = await prisma.contactRequest.findMany({
    where: { senderId: userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: LIST_LIMIT,
    include: {
      teacherProfile: { select: { slug: true, isPublished: true, user: { select: { name: true } } } },
    },
  });

  return requests.map((r) => ({
    id: r.id,
    message: r.message,
    phone: r.phone,
    createdAt: r.createdAt,
    teacher: {
      name: r.teacherProfile.user.name,
      // Only link to the profile while it's still public.
      slug: r.teacherProfile.isPublished ? r.teacherProfile.slug : null,
    },
  }));
}

module.exports = {
  DAILY_REQUEST_LIMIT,
  sendRequest,
  revealContactNumber,
  listReceived,
  getUnreadCount,
  markRead,
  listSent,
};
