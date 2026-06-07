// ── routes/exams.js ──────────────────────────────────────────
const router   = require("express").Router();
const examCtrl = require("../controllers/examController");
const { protect } = require("../middleware/auth");

router.get("/",                  examCtrl.getAllExams);
router.get("/trending",          examCtrl.getTrendingExams);
router.get("/search",            examCtrl.searchExams);
router.get("/category/:cat",     examCtrl.getByCategory);
router.get("/:slug",             examCtrl.getExamBySlug);

module.exports = router;
