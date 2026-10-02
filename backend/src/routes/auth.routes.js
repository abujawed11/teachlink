const { Router } = require("express");
const validate = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");
const { registerLimiter, loginLimiter, refreshLimiter } = require("../middleware/rateLimiters");
const { registerSchema, loginSchema } = require("../validators/auth.schema");
const controller = require("../controllers/auth.controller");

const router = Router();

router.post("/register", registerLimiter, validate(registerSchema), controller.register);
router.post(
  "/register-teacher",
  registerLimiter,
  validate(registerSchema),
  controller.registerTeacher
);
router.post("/login", loginLimiter, validate(loginSchema), controller.login);
router.post("/logout", controller.logout);
router.post("/refresh", refreshLimiter, controller.refresh);
router.get("/me", requireAuth, controller.me);

module.exports = router;
