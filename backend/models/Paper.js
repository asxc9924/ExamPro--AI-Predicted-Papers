const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

// ============================================================
// PREDICTED PAPER
// ============================================================
const predictedPaperSchema = new mongoose.Schema({
  examId:          { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true, index: true },
  title:           { type: String, required: [true, "Paper title is required"], trim: true },
  description:     { type: String, maxlength: 1000 },
  pdfUrl:          { type: String },
  pdfPublicId:     { type: String },   // Cloudinary public_id for deletion
  thumbnail:       { type: String },
  thumbnailPublicId: { type: String },
  price:           { type: Number, required: [true, "Price is required"], min: 0 }, // in paise
  difficultyLevel: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  predictionScore: { type: Number, min: 0, max: 100, default: 85 },
  totalQuestions:  { type: Number, required: true, min: 1 },
  paperType:       { type: String, enum: ["predicted", "model", "pyq", "practice"], default: "predicted" },
  year:            { type: Number },
  isActive:        { type: Boolean, default: true, index: true },
  downloadCount:   { type: Number, default: 0 },
}, { timestamps: true });

predictedPaperSchema.index({ examId: 1, isActive: 1 });

const PredictedPaper = mongoose.model("PredictedPaper", predictedPaperSchema);

// ============================================================
// ORDER
// ============================================================
const orderSchema = new mongoose.Schema({
  userId:             { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  paperId:            { type: mongoose.Schema.Types.ObjectId, ref: "PredictedPaper", required: true },
  amount:             { type: Number, required: true },  // in paise
  currency:           { type: String, default: "INR" },
  razorpayOrderId:    { type: String, unique: true, sparse: true },
  razorpayPaymentId:  { type: String, sparse: true },
  razorpaySignature:  { type: String },
  status:             { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending", index: true },
  receipt:            { type: String },
  notes:              { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ razorpayOrderId: 1 });

const Order = mongoose.model("Order", orderSchema);

// ============================================================
// PURCHASE (post-payment entitlement)
// ============================================================
const purchaseSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  paperId:    { type: mongoose.Schema.Types.ObjectId, ref: "PredictedPaper", required: true },
  orderId:    { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  paymentId:  { type: String, required: true },  // Razorpay payment ID
  amount:     { type: Number, required: true },
  isActive:   { type: Boolean, default: true },
  purchasedAt:{ type: Date, default: Date.now },
  expiresAt:  { type: Date },  // null = lifetime
}, { timestamps: true });

// Prevent duplicate purchases
purchaseSchema.index({ userId: 1, paperId: 1 }, { unique: true });

const Purchase = mongoose.model("Purchase", purchaseSchema);

// ============================================================
// OTP VERIFICATION
// ============================================================
const otpSchema = new mongoose.Schema({
  email:     { type: String, required: true, lowercase: true, index: true },
  otp:       { type: String, required: true },   // hashed
  purpose:   { type: String, enum: ["register", "login", "forgot-password"], required: true },
  isUsed:    { type: Boolean, default: false },
  attempts:  { type: Number, default: 0 },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 10 * 60 * 1000) }, // 10 min
}, { timestamps: true });

// TTL index - auto delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ email: 1, purpose: 1 });

otpSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

otpSchema.methods.verifyOTP = async function (candidateOTP) {
  return bcrypt.compare(candidateOTP, this.otp);
};

const OTPVerification = mongoose.model("OTPVerification", otpSchema);

module.exports = { PredictedPaper, Order, Purchase, OTPVerification };
