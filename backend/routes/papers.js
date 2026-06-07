// ── routes/papers.js ─────────────────────────────────────────
const router     = require("express").Router();
const paperCtrl  = require("../controllers/paperController");
const { protect, optionalAuth } = require("../middleware/auth");

router.get("/exam/:examId",  optionalAuth,  paperCtrl.getByExam);
router.get("/:id",           optionalAuth,  paperCtrl.getById);
router.get("/:id/access",    protect,       paperCtrl.checkAccess);
router.get("/:id/download",  protect,       paperCtrl.getDownloadUrl);

module.exports = router;
