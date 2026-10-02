const asyncHandler = require("../middleware/asyncHandler");
const userService = require("../services/user.service");

const updateMe = asyncHandler(async (req, res) => {
  const user = await userService.updateAccount(req.user.sub, req.body);
  res.json({ user });
});

const changePassword = asyncHandler(async (req, res) => {
  await userService.changePassword(req.user.sub, req.body);
  res.json({ success: true });
});

module.exports = { updateMe, changePassword };
