const { Router } = require("express");

const validate = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const { uploadPhotoSingle } = require("../middleware/upload");
const {
  updateProfileSchema,
  idListSchema,
  qualificationSchema,
  experienceSchema,
  availabilitySchema,
} = require("../validators/teacher.schema");
const controller = require("../controllers/teacher.controller");

const router = Router();
const teacherOnly = [requireAuth, requireRole("TEACHER")];

router.get("/me", ...teacherOnly, controller.getMe);
router.patch("/me", ...teacherOnly, validate(updateProfileSchema), controller.updateMe);
router.post("/me/photo", ...teacherOnly, uploadPhotoSingle, controller.uploadPhoto);
router.post("/me/publish", ...teacherOnly, controller.publishMe);
router.post("/me/unpublish", ...teacherOnly, controller.unpublishMe);

router.put("/me/subjects", ...teacherOnly, validate(idListSchema), controller.setSubjects);
router.put("/me/grades", ...teacherOnly, validate(idListSchema), controller.setGrades);
router.put("/me/boards", ...teacherOnly, validate(idListSchema), controller.setBoards);
router.put("/me/languages", ...teacherOnly, validate(idListSchema), controller.setLanguages);

router.post(
  "/me/qualifications",
  ...teacherOnly,
  validate(qualificationSchema),
  controller.addQualification
);
router.delete("/me/qualifications/:id", ...teacherOnly, controller.deleteQualification);

router.post(
  "/me/experience",
  ...teacherOnly,
  validate(experienceSchema),
  controller.addExperience
);
router.delete("/me/experience/:id", ...teacherOnly, controller.deleteExperience);

router.post(
  "/me/availability",
  ...teacherOnly,
  validate(availabilitySchema),
  controller.addAvailability
);
router.delete("/me/availability/:id", ...teacherOnly, controller.deleteAvailability);

router.get("/:slug", controller.getBySlug);

module.exports = router;
