const crypto     = require("crypto");
const bcrypt     = require("bcryptjs");
const User           = require("../models/User");
const { OTPVerification } = require("../models/Paper");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const { sendOTPEmail, sendPasswordResetEmail, sendWelcomeEmail } = require("../utils/email");

// ── HELPER: Send tokens ─────────────────────────────────────
const sendTokens = async (user, res, statusCode = 200) => {
  const accessToken  = signAccessToken(user._id, user.role);
  const refreshToken = signRefreshToken(user._id);

  // Store hashed refresh token
  user.refreshToken = await bcrypt.hash(refreshToken, 8);
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Set refresh token as httpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(statusCode).json({
    success: true,
    data: { accessToken, user: user.toJSON() },
  });
};

// ── REGISTER ────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, error: "Email already registered. Please login." });
    }

    const user = await User.create({ name, email, phone, password, isEmailVerified: false });

    // Send OTP automatically
    await generateAndSendOTP(email, "register");

    res.status(201).json({
      success: true,
      message: "Account created. Please verify your email with the OTP sent.",
      data: { email },
    });
  } catch (err) { next(err); }
};

// ── LOGIN ────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password +refreshToken");
    if (!user) return res.status(401).json({ success: false, error: "Invalid email or password" });
    if (!user.password) return res.status(401).json({ success: false, error: "Please sign in with Google" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, error: "Invalid email or password" });

    await sendTokens(user, res);
  } catch (err) { next(err); }
};

// ── SEND OTP ─────────────────────────────────────────────────
exports.sendOTP = async (req, res, next) => {
  try {
    const { email, purpose } = req.body;
    if (!email || !purpose) return res.status(400).json({ success: false, error: "Email and purpose required" });

    await generateAndSendOTP(email, purpose);
    res.json({ success: true, message: "OTP sent to your email. Valid for 10 minutes." });
  } catch (err) { next(err); }
};

// ── VERIFY OTP ───────────────────────────────────────────────
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp, purpose } = req.body;
    if (!email || !otp || !purpose) return res.status(400).json({ success: false, error: "Email, OTP, and purpose required" });

    // Find latest unused, unexpired OTP
    const record = await OTPVerification.findOne({ email, purpose, isUsed: false })
      .sort({ createdAt: -1 });

    if (!record) return res.status(400).json({ success: false, error: "OTP not found or already used" });
    if (record.isExpired()) return res.status(400).json({ success: false, error: "OTP has expired. Request a new one." });

    // Increment attempts
    record.attempts += 1;
    if (record.attempts > 5) {
      await record.save();
      return res.status(429).json({ success: false, error: "Too many incorrect attempts. Request a new OTP." });
    }

    const isValid = await record.verifyOTP(otp);
    if (!isValid) {
      await record.save();
      return res.status(400).json({ success: false, error: `Invalid OTP. ${5 - record.attempts} attempts left.` });
    }

    // Mark as used
    record.isUsed = true;
    await record.save();

    // Get or create user
    let user = await User.findOne({ email }).select("+refreshToken");
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found. Please register first." });
    }

    // Mark email verified
    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      await sendWelcomeEmail(user.email, user.name);
    }

    await sendTokens(user, res);
  } catch (err) { next(err); }
};

// ── REFRESH TOKEN ────────────────────────────────────────────
exports.refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ success: false, error: "No refresh token" });

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || !user.refreshToken) return res.status(401).json({ success: false, error: "Invalid refresh token" });

    const isValid = await bcrypt.compare(token, user.refreshToken);
    if (!isValid) return res.status(401).json({ success: false, error: "Invalid refresh token" });

    const newAccessToken = signAccessToken(user._id, user.role);
    res.json({ success: true, data: { accessToken: newAccessToken } });
  } catch (err) {
    res.status(401).json({ success: false, error: "Refresh token expired or invalid" });
  }
};

// ── LOGOUT ───────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.clearCookie("refreshToken");
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) { next(err); }
};

// ── GET ME ───────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};

// ── FORGOT PASSWORD ──────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    // Don't reveal if user exists
    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
      user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 min
      await user.save({ validateBeforeSave: false });
      await sendPasswordResetEmail(email, resetToken);
    }
    res.json({ success: true, message: "If that email exists, a reset link has been sent." });
  } catch (err) { next(err); }
};

// ── RESET PASSWORD ───────────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+password");

    if (!user) return res.status(400).json({ success: false, error: "Token is invalid or has expired" });

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    await sendTokens(user, res);
  } catch (err) { next(err); }
};

// ── GOOGLE CALLBACK ──────────────────────────────────────────
exports.googleCallback = async (req, res) => {
  try {
    const user = req.user;
    const accessToken  = signAccessToken(user._id, user.role);
    const refreshToken = signRefreshToken(user._id);

    user.refreshToken = await bcrypt.hash(refreshToken, 8);
    await user.save({ validateBeforeSave: false });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${accessToken}`);
  } catch (err) {
    res.redirect(`${process.env.CLIENT_URL}/auth?error=google_failed`);
  }
};

// ── HELPER: Generate & send OTP ──────────────────────────────
async function generateAndSendOTP(email, purpose) {
  // Invalidate previous OTPs
  await OTPVerification.updateMany({ email, purpose, isUsed: false }, { isUsed: true });

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOTP = await bcrypt.hash(otp, 10);

  await OTPVerification.create({ email, otp: hashedOTP, purpose });
  await sendOTPEmail(email, otp, purpose);
}
