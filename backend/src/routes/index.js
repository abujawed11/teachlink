const { Router } = require("express");

const authRoutes = require("./auth.routes");
const teacherRoutes = require("./teacher.routes");
const lookupRoutes = require("./lookup.routes");
const contactRoutes = require("./contact.routes");
const adminRoutes = require("./admin.routes");
const userRoutes = require("./user.routes");

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRoutes);
router.use("/teachers", teacherRoutes);
router.use("/lookups", lookupRoutes);
router.use("/contact-requests", contactRoutes);
router.use("/admin", adminRoutes);
router.use("/users", userRoutes);

module.exports = router;
