const { Router } = require("express");
const rateLimit = require("express-rate-limit");

const validate = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");
const { registerSchema, loginSchema } = require("../validators/auth.schema");
const controller = require("../controllers/auth.controller");

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", authLimiter, validate(registerSchema), controller.register);
router.post(
  "/register-teacher",
  authLimiter,
  validate(registerSchema),
  controller.registerTeacher
);
router.post("/login", authLimiter, validate(loginSchema), controller.login);
router.post("/logout", controller.logout);
router.post("/refresh", controller.refresh);
router.get("/me", requireAuth, controller.me);

module.exports = router;
