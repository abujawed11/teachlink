const { Router } = require("express");

const { requireAuth, requireRole } = require("../middleware/auth");
const controller = require("../controllers/contact.controller");

const router = Router();

// Any logged-in user: the requests they have sent.
router.get("/sent", requireAuth, controller.sent);

// Teachers only: requests other people sent to them.
const teacherOnly = [requireAuth, requireRole("TEACHER")];
router.get("/received", ...teacherOnly, controller.received);
router.get("/received/unread-count", ...teacherOnly, controller.unreadCount);
router.patch("/:id/read", ...teacherOnly, controller.markRead);

module.exports = router;
