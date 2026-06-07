const User              = require("../models/User");
const Exam              = require("../models/Exam");
const { PredictedPaper, Order, Purchase } = require("../models/Paper");
const { deleteFromCloudinary } = require("../middleware/upload");
const slugify           = require("slugify");

// ── DASHBOARD ANALYTICS ──────────────────────────────────────
exports.getDashboard = async (req, res, next) => {
  try {
    const now    = new Date();
    const sixAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Parallel queries for performance
    const [
      totalUsers,
      totalExams,
      totalPapers,
      revenueAgg,
      recentOrders,
      usersByMonth,
      revenueByMonth,
      popularExams,
    ] = await Promise.all([
      User.countDocuments(),
      Exam.countDocuments({ isActive: true }),
      PredictedPaper.countDocuments({ isActive: true }),

      // Total revenue from paid orders
      Order.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),

      // Recent orders with populated data
      Order.find({ status: "paid" })
        .populate("userId", "name email")
        .populate("paperId", "title price")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      // Users registered per month (last 6 months)
      User.aggregate([
        { $match: { createdAt: { $gte: sixAgo } } },
        {
          $group: {
            _id:   { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // Revenue per month (last 6 months)
      Order.aggregate([
        { $match: { status: "paid", createdAt: { $gte: sixAgo } } },
        {
          $group: {
            _id:     { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
            revenue: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // Most purchased papers → group by examId
      Purchase.aggregate([
        { $group: { _id: "$paperId", count: { $sum: 1 } } },
        { $sort:  { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: "predictedpapers", localField: "_id", foreignField: "_id", as: "paper" } },
        { $unwind: "$paper" },
        { $lookup: { from: "exams", localField: "paper.examId", foreignField: "_id", as: "exam" } },
        { $unwind: "$exam" },
      ]),
    ]);

    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    const formatMonthly = (arr, field = "count") =>
      arr.map((r) => ({
        month: `${MONTHS[r._id.month - 1]} ${r._id.year}`,
        [field]: r[field],
      }));

    res.json({
      success: true,
      data: {
        totalUsers,
        totalExams,
        totalPapers,
        totalRevenue: revenueAgg[0]?.total  || 0,
        totalOrders:  revenueAgg[0]?.count  || 0,
        recentOrders,
        usersByMonth:    formatMonthly(usersByMonth, "count"),
        revenueByMonth:  formatMonthly(revenueByMonth, "revenue"),
        popularExams:    popularExams.map((p) => ({ exam: p.exam, paper: p.paper, purchaseCount: p.count })),
      },
    });
  } catch (err) { next(err); }
};

// ── EXAM MANAGEMENT ───────────────────────────────────────────
exports.getExams = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, category } = req.query;
    const query = {};
    if (search) query.$text = { $search: search };
    if (category) query.category = category;

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Exam.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Exam.countDocuments(query),
    ]);

    res.json({ success: true, data: { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err) { next(err); }
};

exports.createExam = async (req, res, next) => {
  try {
    const body = { ...req.body };

    // Generate slug
    if (!body.slug) {
      body.slug = slugify(body.title || "", { lower: true, strict: true });
    }

    // Parse JSON fields if sent as strings (multipart)
    ["eligibility", "examPattern", "syllabus", "selectionProcess", "importantDates"].forEach((f) => {
      if (typeof body[f] === "string") {
        try { body[f] = JSON.parse(body[f]); } catch { /* keep as-is */ }
      }
    });

    // Attach thumbnail URL if uploaded
    if (req.file) {
      body.thumbnail    = req.file.path;
      body.thumbnailPublicId = req.file.filename;
    }

    const exam = await Exam.create(body);
    res.status(201).json({ success: true, data: exam });
  } catch (err) { next(err); }
};

exports.updateExam = async (req, res, next) => {
  try {
    const body = { ...req.body };

    ["eligibility", "examPattern", "syllabus", "selectionProcess", "importantDates"].forEach((f) => {
      if (typeof body[f] === "string") {
        try { body[f] = JSON.parse(body[f]); } catch { }
      }
    });

    if (req.file) {
      const old = await Exam.findById(req.params.id).select("thumbnailPublicId");
      if (old?.thumbnailPublicId) deleteFromCloudinary(old.thumbnailPublicId).catch(() => {});
      body.thumbnail         = req.file.path;
      body.thumbnailPublicId = req.file.filename;
    }

    const exam = await Exam.findByIdAndUpdate(req.params.id, { $set: body }, { new: true, runValidators: true });
    if (!exam) return res.status(404).json({ success: false, error: "Exam not found" });

    res.json({ success: true, data: exam });
  } catch (err) { next(err); }
};

exports.deleteExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, error: "Exam not found" });

    // Soft delete
    exam.isActive = false;
    await exam.save();

    // Also deactivate associated papers
    await PredictedPaper.updateMany({ examId: exam._id }, { isActive: false });

    res.json({ success: true, message: "Exam deleted successfully" });
  } catch (err) { next(err); }
};

// ── PAPER MANAGEMENT ──────────────────────────────────────────
exports.getPapers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, examId } = req.query;
    const query = {};
    if (examId) query.examId = examId;

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      PredictedPaper.find(query)
        .populate("examId", "title shortName slug category")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      PredictedPaper.countDocuments(query),
    ]);

    res.json({ success: true, data: { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err) { next(err); }
};

exports.createPaper = async (req, res, next) => {
  try {
    const body = { ...req.body };

    // Convert price from rupees to paise if needed
    if (body.price && body.price < 1000) {
      body.price = Math.round(Number(body.price) * 100);
    }

    const files = req.files || {};

    if (files.pdf?.[0]) {
      body.pdfUrl       = files.pdf[0].path;
      body.pdfPublicId  = files.pdf[0].filename;
    }

    if (files.thumbnail?.[0]) {
      body.thumbnail          = files.thumbnail[0].path;
      body.thumbnailPublicId  = files.thumbnail[0].filename;
    }

    const paper = await PredictedPaper.create(body);
    const populated = await paper.populate("examId", "title shortName slug category");

    res.status(201).json({ success: true, data: populated });
  } catch (err) { next(err); }
};

exports.updatePaper = async (req, res, next) => {
  try {
    const body  = { ...req.body };
    const files = req.files || {};

    if (body.price && body.price < 1000) body.price = Math.round(Number(body.price) * 100);

    const old = await PredictedPaper.findById(req.params.id).lean();
    if (!old) return res.status(404).json({ success: false, error: "Paper not found" });

    if (files.pdf?.[0]) {
      if (old.pdfPublicId) deleteFromCloudinary(old.pdfPublicId, "raw").catch(() => {});
      body.pdfUrl      = files.pdf[0].path;
      body.pdfPublicId = files.pdf[0].filename;
    }

    if (files.thumbnail?.[0]) {
      if (old.thumbnailPublicId) deleteFromCloudinary(old.thumbnailPublicId).catch(() => {});
      body.thumbnail         = files.thumbnail[0].path;
      body.thumbnailPublicId = files.thumbnail[0].filename;
    }

    const paper = await PredictedPaper.findByIdAndUpdate(req.params.id, { $set: body }, { new: true })
      .populate("examId", "title shortName slug category");

    res.json({ success: true, data: paper });
  } catch (err) { next(err); }
};

exports.deletePaper = async (req, res, next) => {
  try {
    const paper = await PredictedPaper.findById(req.params.id);
    if (!paper) return res.status(404).json({ success: false, error: "Paper not found" });

    // Delete files from Cloudinary
    if (paper.pdfPublicId)       deleteFromCloudinary(paper.pdfPublicId, "raw").catch(() => {});
    if (paper.thumbnailPublicId) deleteFromCloudinary(paper.thumbnailPublicId).catch(() => {});

    // Soft delete
    paper.isActive = false;
    await paper.save();

    res.json({ success: true, message: "Paper deleted" });
  } catch (err) { next(err); }
};

// ── USER MANAGEMENT ───────────────────────────────────────────
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, role } = req.query;
    const query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
    if (role)   query.role = role;

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      User.find(query).select("-password -refreshToken").sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      User.countDocuments(query),
    ]);

    res.json({ success: true, data: { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err) { next(err); }
};

exports.updateUser = async (req, res, next) => {
  try {
    // Super admin only can change roles
    const allowed = req.user.role === "super_admin" ? ["role", "isEmailVerified"] : ["isEmailVerified"];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true }).select("-password -refreshToken");
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// ── ORDER MANAGEMENT ──────────────────────────────────────────
exports.getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Order.find(query)
        .populate("userId", "name email")
        .populate("paperId", "title price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments(query),
    ]);

    res.json({ success: true, data: { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err) { next(err); }
};

exports.updateOrder = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "paid", "failed", "refunded"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    ).populate("userId", "name email").populate("paperId", "title");

    if (!order) return res.status(404).json({ success: false, error: "Order not found" });

    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};
