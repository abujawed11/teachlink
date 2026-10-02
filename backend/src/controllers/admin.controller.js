const asyncHandler = require("../middleware/asyncHandler");
const AppError = require("../utils/AppError");
const adminService = require("../services/admin.service");

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Not found", 404, "NOT_FOUND");
  }
  return id;
}

const listUsers = asyncHandler(async (req, res) => {
  res.json(await adminService.listUsers(req.query));
});

const setUserStatus = asyncHandler(async (req, res) => {
  const user = await adminService.setUserStatus(
    req.user.sub,
    parseId(req.params.id),
    req.body.status
  );
  res.json({ user });
});

const listTeachers = asyncHandler(async (req, res) => {
  res.json(await adminService.listTeachers(req.query));
});

const moderateTeacher = asyncHandler(async (req, res) => {
  const teacher = await adminService.moderateTeacher(parseId(req.params.id), req.body);
  res.json({ teacher });
});

const listLookup = asyncHandler(async (req, res) => {
  res.json({ items: await adminService.listLookup(req.params.type) });
});

const createLookup = asyncHandler(async (req, res) => {
  const item = await adminService.createLookup(req.params.type, req.body);
  res.status(201).json({ item });
});

const updateLookup = asyncHandler(async (req, res) => {
  const item = await adminService.updateLookup(req.params.type, parseId(req.params.id), req.body);
  res.json({ item });
});

module.exports = {
  listUsers,
  setUserStatus,
  listTeachers,
  moderateTeacher,
  listLookup,
  createLookup,
  updateLookup,
};
