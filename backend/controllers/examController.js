const Exam = require("../models/Exam");
const { PredictedPaper, Purchase } = require("../models/Paper");

// ── GET ALL EXAMS ────────────────────────────────────────────
exports.getAllExams = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, trending, search } = req.query;
    const query = { isActive: true };

    if (category) query.category = category;
    if (trending === "true") query.isTrending = true;
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Exam.find(query)
        .sort(trending === "true" ? { isTrending: -1, createdAt: -1 } : { createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Exam.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        data,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) { next(err); }
};

// ── GET EXAM BY SLUG ─────────────────────────────────────────
exports.getExamBySlug = async (req, res, next) => {
  try {
    const exam = await Exam.findOne({ slug: req.params.slug, isActive: true }).lean();
    if (!exam) return res.status(404).json({ success: false, error: "Exam not found" });

    // Get associated papers
    let papers = await PredictedPaper.find({ examId: exam._id, isActive: true }).lean();

    // If user is authenticated, inject hasPurchased
    if (req.user) {
      const purchases = await Purchase.find({
        userId: req.user._id,
        paperId: { $in: papers.map((p) => p._id) },
        isActive: true,
      }).select("paperId").lean();

      const purchasedIds = new Set(purchases.map((p) => p.paperId.toString()));
      papers = papers.map((p) => ({
        ...p,
        hasPurchased: purchasedIds.has(p._id.toString()),
        // Hide PDF URL if not purchased
        pdfUrl: purchasedIds.has(p._id.toString()) ? p.pdfUrl : undefined,
      }));
    } else {
      // Not authenticated — hide pdfUrl
      papers = papers.map((p) => ({ ...p, pdfUrl: undefined }));
    }

    res.json({ success: true, data: { exam, papers } });
  } catch (err) { next(err); }
};

// ── GET TRENDING ─────────────────────────────────────────────
exports.getTrendingExams = async (req, res, next) => {
  try {
    const exams = await Exam.find({ isActive: true, isTrending: true }).limit(12).lean();
    res.json({ success: true, data: exams });
  } catch (err) { next(err); }
};

// ── GET BY CATEGORY ──────────────────────────────────────────
exports.getByCategory = async (req, res, next) => {
  try {
    const validCats = ["upsc","ssc","banking","railway","defence","teaching","state","engineering","medical"];
    const { cat } = req.params;
    if (!validCats.includes(cat)) return res.status(400).json({ success: false, error: "Invalid category" });

    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Exam.find({ category: cat, isActive: true }).skip(skip).limit(Number(limit)).lean(),
      Exam.countDocuments({ category: cat, isActive: true }),
    ]);

    res.json({ success: true, data: { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err) { next(err); }
};

// ── SEARCH ───────────────────────────────────────────────────
exports.searchExams = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.status(400).json({ success: false, error: "Query too short" });

    const exams = await Exam.find(
      { $text: { $search: q }, isActive: true },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10)
      .lean();

    res.json({ success: true, data: exams });
  } catch (err) { next(err); }
};
