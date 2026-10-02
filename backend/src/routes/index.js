const { Router } = require("express");

const authRoutes = require("./auth.routes");
const teacherRoutes = require("./teacher.routes");

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRoutes);
router.use("/teachers", teacherRoutes);

module.exports = router;
