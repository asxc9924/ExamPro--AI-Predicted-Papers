require("dotenv").config();
const express       = require("express");
const mongoose      = require("mongoose");
const cors          = require("cors");
const helmet        = require("helmet");
const rateLimit     = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const compression   = require("compression");
const morgan        = require("morgan");
const passport      = require("passport");
const session       = require("express-session");
const MongoStore    = require("connect-mongo");

const authRoutes    = require("./routes/auth");
const examRoutes    = require("./routes/exams");
const paperRoutes   = require("./routes/papers");
const paymentRoutes = require("./routes/payment");
const userRoutes    = require("./routes/user");
const adminRoutes   = require("./routes/admin");

require("./config/passport");

const app = express();

// ── Trust proxy (Render / Vercel / Railway all sit behind one) ─
app.set("trust proxy", 1);

// ── MongoDB — re-use connection across serverless invocations ──
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = conn.connections[0].readyState === 1;
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB:", err.message);
    throw err;
  }
};

// Connect immediately (for long-lived servers like Render)
connectDB().catch(console.error);

// For Vercel serverless: ensure connection before every request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(503).json({ success: false, error: "Database unavailable" });
  }
});

// ── Security middleware ────────────────────────────────────────
app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  // Vercel preview URLs
  /\.vercel\.app$/,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // server-to-server / curl
    const allowed = allowedOrigins.some(o =>
      o instanceof RegExp ? o.test(origin) : origin.startsWith(o)
    );
    if (allowed) return cb(null, true);
    cb(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","PATCH","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests. Try again later." },
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: "Too many auth attempts. Wait 15 minutes." },
});

app.use(mongoSanitize());
app.use(compression());

// ── Body parsers ───────────────────────────────────────────────
// Raw body ONLY for Razorpay webhook (must come before express.json)
app.use("/api/payment/webhook", express.raw({ type: "*/*" }));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Inline XSS sanitizer (replaces unmaintained xss-clean)
app.use((req, _res, next) => {
  const clean = (v) => {
    if (typeof v === "string")
      return v.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
    if (v && typeof v === "object") Object.keys(v).forEach(k => { v[k] = clean(v[k]); });
    return v;
  };
  if (req.body && !(req.body instanceof Buffer)) req.body = clean(req.body);
  next();
});

if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

// ── Session (OAuth — stateless-safe with MongoDB store) ────────
app.use(session({
  secret: process.env.JWT_SECRET || "dev-secret-change-me",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600, // lazy session update
  }),
  cookie: {
    secure:   process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge:   24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  },
}));

app.use(passport.initialize());
app.use(passport.session());

// ── Routes ─────────────────────────────────────────────────────
app.use("/api/auth",    authLimiter, authRoutes);
app.use("/api/exams",               examRoutes);
app.use("/api/papers",              paperRoutes);
app.use("/api/payment",             paymentRoutes);
app.use("/api/user",                userRoutes);
app.use("/api/admin",               adminRoutes);

app.get("/health", (_req, res) =>
  res.json({
    status:    "ok",
    timestamp: new Date().toISOString(),
    uptime:    Math.floor(process.uptime()),
    db:        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    env:       process.env.NODE_ENV,
  })
);

app.get("/", (_req, res) =>
  res.json({ name: "ExamEdge API", version: "1.0.0", status: "running" })
);

// ── 404 ────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ success: false, error: `${req.method} ${req.originalUrl} not found` })
);

// ── Global error handler ───────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(`[ERROR] ${err.message}`);

  if (err.name === "ValidationError") {
    return res.status(400).json({ success: false, error: Object.values(err.errors).map(e => e.message).join(", ") });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "Field";
    return res.status(400).json({ success: false, error: `${field} already exists` });
  }
  if (err.name === "JsonWebTokenError")  return res.status(401).json({ success: false, error: "Invalid token" });
  if (err.name === "TokenExpiredError")  return res.status(401).json({ success: false, error: "Token expired", code: "TOKEN_EXPIRED" });
  if (err.message?.includes("CORS"))     return res.status(403).json({ success: false, error: err.message });
  if (err.message?.match(/Only PDF|Only image/)) return res.status(400).json({ success: false, error: err.message });

  res.status(err.statusCode || 500).json({
    success: false,
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});

// ── Start (traditional server — Render / Railway / local) ──────
// Vercel ignores app.listen() and uses module.exports instead
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 ExamEdge API  →  http://localhost:${PORT}`);
    console.log(`   Health check  →  http://localhost:${PORT}/health`);
  });
}

// ── Export for Vercel serverless ───────────────────────────────
module.exports = app;
