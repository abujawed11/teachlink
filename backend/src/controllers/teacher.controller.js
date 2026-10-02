const fs = require("fs");
const path = require("path");

const asyncHandler = require("../middleware/asyncHandler");
const teacherService = require("../services/teacher.service");
const searchService = require("../services/search.service");
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

const setSubjects = asyncHandler(async (req, res) => {
  const profile = await teacherService.setSubjects(req.user.sub, req.body.ids);
  res.json({ profile });
});

const setGrades = asyncHandler(async (req, res) => {
  const profile = await teacherService.setGrades(req.user.sub, req.body.ids);
  res.json({ profile });
});

const setBoards = asyncHandler(async (req, res) => {
  const profile = await teacherService.setBoards(req.user.sub, req.body.ids);
  res.json({ profile });
});

const setLanguages = asyncHandler(async (req, res) => {
  const profile = await teacherService.setLanguages(req.user.sub, req.body.ids);
  res.json({ profile });
});

const addQualification = asyncHandler(async (req, res) => {
  const profile = await teacherService.addQualification(req.user.sub, req.body);
  res.status(201).json({ profile });
});

const deleteQualification = asyncHandler(async (req, res) => {
  const profile = await teacherService.deleteQualification(
    req.user.sub,
    Number(req.params.id)
  );
  res.json({ profile });
});

const addExperience = asyncHandler(async (req, res) => {
  const profile = await teacherService.addExperience(req.user.sub, req.body);
  res.status(201).json({ profile });
});

const deleteExperience = asyncHandler(async (req, res) => {
  const profile = await teacherService.deleteExperience(
    req.user.sub,
    Number(req.params.id)
  );
  res.json({ profile });
});

const addAvailability = asyncHandler(async (req, res) => {
  const profile = await teacherService.addAvailability(req.user.sub, req.body);
  res.status(201).json({ profile });
});

const deleteAvailability = asyncHandler(async (req, res) => {
  const profile = await teacherService.deleteAvailability(
    req.user.sub,
    Number(req.params.id)
  );
  res.json({ profile });
});

const search = asyncHandler(async (req, res) => {
  const result = await searchService.searchTeachers(req.query);
  res.json(result);
});

const getBySlug = asyncHandler(async (req, res) => {
  const profile = await teacherService.getPublicProfileBySlug(req.params.slug, req.user?.sub);
  res.json({ profile });
});

module.exports = {
  getMe,
  updateMe,
  publishMe,
  unpublishMe,
  uploadPhoto,
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
  search,
  getBySlug,
};
