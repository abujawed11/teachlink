const { Router } = require("express");

const validate = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");
const { passwordLimiter } = require("../middleware/rateLimiters");
const { updateAccountSchema, changePasswordSchema } = require("../validators/user.schema");
const controller = require("../controllers/user.controller");

const router = Router();

// Reading the current user is GET /api/auth/me; these change it.
router.patch("/me", requireAuth, validate(updateAccountSchema), controller.updateMe);
router.post("/me/password", requireAuth, passwordLimiter, validate(changePasswordSchema), controller.changePassword);

module.exports = router;
