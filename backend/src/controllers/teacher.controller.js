const asyncHandler = require("../middleware/asyncHandler");
const teacherService = require("../services/teacher.service");

const getMe = asyncHandler(async (req, res) => {
  const profile = await teacherService.getOwnProfile(req.user.sub);
  res.json({ profile });
});

const updateMe = asyncHandler(async (req, res) => {
  const profile = await teacherService.updateOwnProfile(req.user.sub, req.body);
  res.json({ profile });
});

const publishMe = asyncHandler(async (req, res) => {
  const profile = await teacherService.publishOwnProfile(req.user.sub);
  res.json({ profile });
});

const unpublishMe = asyncHandler(async (req, res) => {
  const profile = await teacherService.unpublishOwnProfile(req.user.sub);
  res.json({ profile });
});

const getBySlug = asyncHandler(async (req, res) => {
  const profile = await teacherService.getPublicProfileBySlug(req.params.slug);
  res.json({ profile });
});

module.exports = { getMe, updateMe, publishMe, unpublishMe, getBySlug };
