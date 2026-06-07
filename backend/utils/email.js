const nodemailer = require("nodemailer");

// ── Transporter ───────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST || "smtp.gmail.com",
  port:   Number(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

transporter.verify((err) => {
  if (err) console.error("Email transporter error:", err.message);
  else     console.log("✅ Email transporter ready");
});

// ── Base HTML template ────────────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ExamEdge</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0F0E17; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #1A1928; border-radius: 16px; overflow: hidden; border: 1px solid #2D2B45; }
    .header { background: linear-gradient(135deg, #1E1B4B, #4338CA); padding: 32px 40px; text-align: center; }
    .logo { font-size: 24px; font-weight: 800; color: white; letter-spacing: -0.5px; }
    .logo span { color: #818CF8; }
    .body { padding: 40px; color: #F8F7FF; }
    h1 { font-size: 22px; font-weight: 700; color: white; margin: 0 0 12px; }
    p { font-size: 15px; color: #A09CC0; line-height: 1.7; margin: 0 0 16px; }
    .otp-box { background: #0F0E17; border: 1px solid #2D2B45; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp { font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #818CF8; font-family: 'Courier New', monospace; }
    .btn { display: inline-block; background: linear-gradient(135deg, #4F46E5, #6366F1); color: white !important; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; }
    .divider { border: none; border-top: 1px solid #2D2B45; margin: 24px 0; }
    .footer { padding: 20px 40px; background: #0F0E17; text-align: center; }
    .footer p { font-size: 12px; color: #6B6891; margin: 0; }
    .highlight { color: #818CF8; font-weight: 600; }
    .success-icon { font-size: 40px; text-align: center; display: block; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">Exam<span>Edge</span></div>
      <p style="color:#C7D2FE;font-size:13px;margin:4px 0 0;">AI-Powered Exam Prediction Platform</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ExamEdge. All rights reserved.</p>
      <p style="margin-top:4px;">If you didn't request this, please ignore this email.</p>
    </div>
  </div>
</body>
</html>
`;

// ── SEND OTP EMAIL ────────────────────────────────────────────
exports.sendOTPEmail = async (email, otp, purpose) => {
  const purposes = {
    register:        { title: "Verify Your Email",      action: "complete your registration" },
    login:           { title: "Login OTP",              action: "sign in to your account" },
    "forgot-password": { title: "Password Reset OTP",  action: "reset your password" },
  };
  const { title, action } = purposes[purpose] || purposes.register;

  const content = `
    <h1>${title}</h1>
    <p>Use the OTP below to ${action}. This code is valid for <span class="highlight">10 minutes</span>.</p>
    <div class="otp-box">
      <div class="otp">${otp}</div>
    </div>
    <p style="font-size:13px;color:#6B6891;">⚠️ Never share this OTP with anyone — ExamEdge will never ask for it.</p>
  `;

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM || "ExamEdge <noreply@examedge.in>",
    to:      email,
    subject: `${otp} is your ExamEdge OTP`,
    html:    baseTemplate(content),
  });
};

// ── WELCOME EMAIL ─────────────────────────────────────────────
exports.sendWelcomeEmail = async (email, name) => {
  const content = `
    <span class="success-icon">🎉</span>
    <h1>Welcome to ExamEdge, ${name.split(" ")[0]}!</h1>
    <p>Your account has been verified. You now have access to AI-predicted question papers for 100+ Government, Engineering, and Medical exams.</p>
    <p>Start exploring papers that will help you crack your exam:</p>
    <p style="text-align:center;margin-top:24px;">
      <a href="${process.env.CLIENT_URL}/exams" class="btn">Browse Predicted Papers</a>
    </p>
    <hr class="divider" />
    <p style="font-size:13px;">Have questions? Reply to this email — we're here to help.</p>
  `;

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM || "ExamEdge <noreply@examedge.in>",
    to:      email,
    subject: `Welcome to ExamEdge, ${name.split(" ")[0]}! 🎉`,
    html:    baseTemplate(content),
  });
};

// ── PURCHASE CONFIRMATION ─────────────────────────────────────
exports.sendPurchaseConfirmationEmail = async (email, name, purchase) => {
  const paper    = purchase.paperId;
  const amount   = `₹${(purchase.amount / 100).toFixed(0)}`;
  const examTitle = typeof paper?.examId === "object" ? paper.examId?.title : "Exam";

  const content = `
    <span class="success-icon">✅</span>
    <h1>Payment Successful!</h1>
    <p>Hey ${name.split(" ")[0]}, your purchase is confirmed. Your paper is now unlocked.</p>
    <div class="otp-box">
      <p style="color:#A09CC0;font-size:13px;margin:0 0 8px;">PURCHASED PAPER</p>
      <p style="color:white;font-weight:600;font-size:16px;margin:0 0 8px;">${paper?.title || "Predicted Paper"}</p>
      <p style="color:#A09CC0;font-size:13px;margin:0 0 4px;">${examTitle}</p>
      <p style="color:#818CF8;font-weight:700;font-size:20px;margin:8px 0 0;">${amount}</p>
    </div>
    <p style="text-align:center;">
      <a href="${process.env.CLIENT_URL}/dashboard" class="btn">Access My Papers →</a>
    </p>
    <hr class="divider" />
    <p style="font-size:13px;color:#6B6891;">
      Payment ID: <span class="highlight">${purchase.paymentId}</span><br/>
      If you have any issues, contact us at support@examedge.in
    </p>
  `;

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      email,
    subject: `Purchase Confirmed — ${paper?.title || "Paper"} | ExamEdge`,
    html:    baseTemplate(content),
  });
};

// ── PASSWORD RESET ────────────────────────────────────────────
exports.sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password?token=${token}`;

  const content = `
    <h1>Reset Your Password</h1>
    <p>You requested a password reset. Click the button below to set a new password. This link expires in <span class="highlight">15 minutes</span>.</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </p>
    <p style="font-size:13px;color:#6B6891;">
      If the button doesn't work, copy this link:<br/>
      <span class="highlight">${resetUrl}</span>
    </p>
    <hr class="divider" />
    <p style="font-size:13px;color:#6B6891;">If you didn't request this, your account is safe. Ignore this email.</p>
  `;

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      email,
    subject: "Reset Your ExamEdge Password",
    html:    baseTemplate(content),
  });
};
