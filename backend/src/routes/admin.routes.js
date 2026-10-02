const { Router } = require("express");

const validate = require("../middleware/validate");
const { requireAuth, requireActiveAdmin } = require("../middleware/auth");
const {
  userListSchema,
  teacherListSchema,
  userStatusSchema,
  teacherModerationSchema,
  lookupCreateSchema,
  lookupUpdateSchema,
} = require("../validators/admin.schema");
const controller = require("../controllers/admin.controller");

const router = Router();

// Every admin route requires a valid session AND a live ADMIN/ACTIVE account in the database.
router.use(requireAuth, requireActiveAdmin);

router.get("/users", validate(userListSchema, "query"), controller.listUsers);
router.patch("/users/:id/status", validate(userStatusSchema), controller.setUserStatus);

router.get("/teachers", validate(teacherListSchema, "query"), controller.listTeachers);
router.patch("/teachers/:id", validate(teacherModerationSchema), controller.moderateTeacher);

router.get("/lookups/:type", controller.listLookup);
router.post("/lookups/:type", validate(lookupCreateSchema), controller.createLookup);
router.patch("/lookups/:type/:id", validate(lookupUpdateSchema), controller.updateLookup);

module.exports = router;
