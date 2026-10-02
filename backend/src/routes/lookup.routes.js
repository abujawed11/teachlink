const { Router } = require("express");

const controller = require("../controllers/lookup.controller");

const router = Router();

router.get("/subjects", controller.getSubjects);
router.get("/grades", controller.getGrades);
router.get("/boards", controller.getBoards);
router.get("/languages", controller.getLanguages);

module.exports = router;
