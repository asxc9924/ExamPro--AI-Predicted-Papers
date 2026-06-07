const { PredictedPaper, Purchase } = require("../models/Paper");
const { generateSignedUrl }        = require("../middleware/upload");

// ── GET PAPERS BY EXAM ───────────────────────────────────────
exports.getByExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    let papers = await PredictedPaper.find({ examId, isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    // Strip PDF URLs unless user has purchased
    if (req.user) {
      const purchases = await Purchase.find({
        userId: req.user._id,
        paperId: { $in: papers.map((p) => p._id) },
        isActive: true,
      }).select("paperId").lean();

      const owned = new Set(purchases.map((p) => p.paperId.toString()));
      papers = papers.map((p) => ({
        ...p,
        hasPurchased: owned.has(p._id.toString()),
        pdfUrl:       owned.has(p._id.toString()) ? undefined : undefined, // still hidden; use /download
        pdfPublicId:  undefined,
      }));
    } else {
      papers = papers.map((p) => ({ ...p, pdfUrl: undefined, pdfPublicId: undefined }));
    }

    res.json({ success: true, data: papers });
  } catch (err) { next(err); }
};

// ── GET SINGLE PAPER ─────────────────────────────────────────
exports.getById = async (req, res, next) => {
  try {
    const paper = await PredictedPaper.findOne({ _id: req.params.id, isActive: true })
      .populate("examId", "title slug shortName category")
      .lean();

    if (!paper) return res.status(404).json({ success: false, error: "Paper not found" });

    let hasPurchased = false;
    if (req.user) {
      const purchase = await Purchase.findOne({ userId: req.user._id, paperId: paper._id, isActive: true });
      hasPurchased = !!purchase;
    }

    res.json({
      success: true,
      data: {
        ...paper,
        hasPurchased,
        pdfUrl:      hasPurchased ? undefined : undefined, // served via /download
        pdfPublicId: undefined,
      },
    });
  } catch (err) { next(err); }
};

// ── CHECK ACCESS ─────────────────────────────────────────────
exports.checkAccess = async (req, res, next) => {
  try {
    const purchase = await Purchase.findOne({
      userId:   req.user._id,
      paperId:  req.params.id,
      isActive: true,
    });
    res.json({ success: true, data: { hasAccess: !!purchase } });
  } catch (err) { next(err); }
};

// ── GET DOWNLOAD URL (signed, 1-hour expiry) ─────────────────
exports.getDownloadUrl = async (req, res, next) => {
  try {
    // Verify purchase
    const purchase = await Purchase.findOne({
      userId:   req.user._id,
      paperId:  req.params.id,
      isActive: true,
    });

    if (!purchase) {
      return res.status(403).json({ success: false, error: "You have not purchased this paper" });
    }

    const paper = await PredictedPaper.findById(req.params.id).select("pdfPublicId title").lean();
    if (!paper || !paper.pdfPublicId) {
      return res.status(404).json({ success: false, error: "PDF not available" });
    }

    // Generate signed URL valid for 1 hour
    const signedUrl = generateSignedUrl(paper.pdfPublicId, 3600);

    res.json({
      success: true,
      data: { url: signedUrl, expiresIn: 3600, title: paper.title },
    });
  } catch (err) { next(err); }
};
