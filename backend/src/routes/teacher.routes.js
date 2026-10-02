const { Router } = require("express");

const validate = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const { uploadPhotoSingle } = require("../middleware/upload");
const { updateProfileSchema } = require("../validators/teacher.schema");
const controller = require("../controllers/teacher.controller");

const router = Router();

router.get("/me", requireAuth, requireRole("TEACHER"), controller.getMe);
router.patch(
  "/me",
  requireAuth,
  requireRole("TEACHER"),
  validate(updateProfileSchema),
  controller.updateMe
);
router.post(
  "/me/photo",
  requireAuth,
  requireRole("TEACHER"),
  uploadPhotoSingle,
  controller.uploadPhoto
);
router.post("/me/publish", requireAuth, requireRole("TEACHER"), controller.publishMe);
router.post("/me/unpublish", requireAuth, requireRole("TEACHER"), controller.unpublishMe);

router.get("/:slug", controller.getBySlug);

module.exports = router;
