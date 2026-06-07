const User                       = require("../models/User");
const { Purchase, PredictedPaper } = require("../models/Paper");

// ── GET PROFILE ───────────────────────────────────────────────
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password -refreshToken -__v")
      .lean();
    res.json({ success: true, data: { user } });
  } catch (err) { next(err); }
};

// ── UPDATE PROFILE ────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ["name", "phone", "avatar"];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Phone validation
    if (updates.phone && !/^(\+91)?[6-9]\d{9}$/.test(updates.phone)) {
      return res.status(400).json({ success: false, error: "Invalid phone number" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true, select: "-password -refreshToken -__v" }
    ).lean();

    res.json({ success: true, data: { user }, message: "Profile updated successfully" });
  } catch (err) { next(err); }
};

// ── GET PURCHASES ─────────────────────────────────────────────
exports.getPurchases = async (req, res, next) => {
  try {
    const purchases = await Purchase.find({ userId: req.user._id, isActive: true })
      .populate({
        path:     "paperId",
        populate: { path: "examId", select: "title slug shortName category" },
      })
      .populate("orderId", "razorpayOrderId razorpayPaymentId amount status createdAt")
      .sort({ purchasedAt: -1 })
      .lean();

    res.json({ success: true, data: purchases });
  } catch (err) { next(err); }
};

// ── GET WISHLIST ──────────────────────────────────────────────
exports.getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path:    "wishlist",
        match:   { isActive: true },
        populate: { path: "examId", select: "title slug shortName" },
      })
      .lean();

    res.json({ success: true, data: user.wishlist || [] });
  } catch (err) { next(err); }
};

// ── ADD TO WISHLIST ───────────────────────────────────────────
exports.addToWishlist = async (req, res, next) => {
  try {
    const { paperId } = req.params;

    const paper = await PredictedPaper.findOne({ _id: paperId, isActive: true });
    if (!paper) return res.status(404).json({ success: false, error: "Paper not found" });

    const user = await User.findById(req.user._id);
    if (user.wishlist.includes(paperId)) {
      return res.status(400).json({ success: false, error: "Already in wishlist" });
    }

    user.wishlist.push(paperId);
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: "Added to wishlist" });
  } catch (err) { next(err); }
};

// ── REMOVE FROM WISHLIST ──────────────────────────────────────
exports.removeFromWishlist = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { wishlist: req.params.paperId },
    });
    res.json({ success: true, message: "Removed from wishlist" });
  } catch (err) { next(err); }
};
