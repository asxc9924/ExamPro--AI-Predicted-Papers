const jwt  = require("jsonwebtoken");
const User = require("../models/User");

// ── PROTECT (JWT required) ───────────────────────────────────
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ success: false, error: "Authentication required. Please log in." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-refreshToken");

    if (!user) {
      return res.status(401).json({ success: false, error: "User not found. Please log in again." });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, error: "Token expired", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
};

// ── OPTIONAL AUTH (attaches user if token present, doesn't fail) ─
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-refreshToken -password");
      if (user) req.user = user;
    }
  } catch {
    // Silently ignore auth errors for optional auth
  }
  next();
};

// ── ADMIN ONLY ───────────────────────────────────────────────
exports.adminOnly = (req, res, next) => {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "super_admin")) {
    return res.status(403).json({ success: false, error: "Admin access required" });
  }
  next();
};

// ── SUPER ADMIN ONLY ─────────────────────────────────────────
exports.superAdminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "super_admin") {
    return res.status(403).json({ success: false, error: "Super admin access required" });
  }
  next();
};

// ── VERIFIED EMAIL ───────────────────────────────────────────
exports.requireVerifiedEmail = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return res.status(403).json({ success: false, error: "Please verify your email to continue", code: "EMAIL_NOT_VERIFIED" });
  }
  next();
};
