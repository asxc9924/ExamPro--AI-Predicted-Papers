const router  = require("express").Router();
const passport = require("passport");
const authCtrl = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { validateRegister, validateLogin, validateOTP } = require("../middleware/validate");
const rateLimit = require("express-rate-limit");

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { success: false, error: "Too many OTP requests. Wait 10 minutes." },
  keyGenerator: (req) => req.body.email || req.ip,
});

// ── Email / Password Auth ────────────────────────────────────
router.post("/register",       validateRegister, authCtrl.register);
router.post("/login",          validateLogin,    authCtrl.login);
router.post("/logout",         protect,          authCtrl.logout);
router.post("/refresh",                          authCtrl.refreshToken);

// ── OTP Auth ─────────────────────────────────────────────────
router.post("/send-otp",    otpLimiter, authCtrl.sendOTP);
router.post("/verify-otp",              authCtrl.verifyOTP);

// ── Password Reset ───────────────────────────────────────────
router.post("/forgot-password",         authCtrl.forgotPassword);
router.post("/reset-password",          authCtrl.resetPassword);

// ── Google OAuth ─────────────────────────────────────────────
router.get("/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${process.env.CLIENT_URL}/auth?error=google_failed` }),
  authCtrl.googleCallback
);

// ── Authenticated User ───────────────────────────────────────
router.get("/me", protect, authCtrl.getMe);

module.exports = router;
