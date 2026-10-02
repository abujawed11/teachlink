const fs = require("fs");
const path = require("path");

const asyncHandler = require("../middleware/asyncHandler");
const teacherService = require("../services/teacher.service");
const AppError = require("../utils/AppError");
const { UPLOAD_DIR } = require("../middleware/upload");

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

const uploadPhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("No photo file provided", 400, "VALIDATION_ERROR");
  }

  const previousProfile = await teacherService.getOwnProfile(req.user.sub);

  const photoUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  const profile = await teacherService.updateOwnProfile(req.user.sub, { photoUrl });

  if (previousProfile.photoUrl) {
    const previousFilename = previousProfile.photoUrl.split("/uploads/")[1];
    if (previousFilename) {
      fs.unlink(path.join(UPLOAD_DIR, previousFilename), () => {});
    }
  }

  res.json({ profile });
});

const getBySlug = asyncHandler(async (req, res) => {
  const profile = await teacherService.getPublicProfileBySlug(req.params.slug);
  res.json({ profile });
});

module.exports = { getMe, updateMe, publishMe, unpublishMe, uploadPhoto, getBySlug };
