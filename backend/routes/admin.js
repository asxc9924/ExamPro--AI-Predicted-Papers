const router     = require("express").Router();
const adminCtrl  = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/auth");
const { uploadPDF, uploadImage } = require("../middleware/upload");

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// Dashboard analytics
router.get("/dashboard", adminCtrl.getDashboard);

// ── Exam Management ────────────────────────────────────────────
router.get("/exams",                                        adminCtrl.getExams);
router.post("/exams",   ...uploadImage.single("thumbnail"), adminCtrl.createExam);
router.put("/exams/:id",...uploadImage.single("thumbnail"), adminCtrl.updateExam);
router.delete("/exams/:id",                                 adminCtrl.deleteExam);

// ── Paper Management ───────────────────────────────────────────
router.get("/papers",                                 adminCtrl.getPapers);
router.post("/papers",
  ...uploadPDF.fields([
    { name: "pdf",       maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  adminCtrl.createPaper
);
router.put("/papers/:id",
  ...uploadPDF.fields([
    { name: "pdf",       maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  adminCtrl.updatePaper
);
router.delete("/papers/:id", adminCtrl.deletePaper);

// ── User Management ────────────────────────────────────────────
router.get("/users",       adminCtrl.getUsers);
router.put("/users/:id",   adminCtrl.updateUser);

// ── Order Management ───────────────────────────────────────────
router.get("/orders",      adminCtrl.getOrders);
router.put("/orders/:id",  adminCtrl.updateOrder);

module.exports = router;
