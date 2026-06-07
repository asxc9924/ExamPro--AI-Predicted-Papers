// ============================================================
// models/User.js
// ============================================================
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name:            { type: String, required: [true, "Name is required"], trim: true, maxlength: [80, "Name too long"] },
  email:           { type: String, required: [true, "Email is required"], unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, "Invalid email"] },
  phone:           { type: String, trim: true, match: [/^(\+91)?[6-9]\d{9}$/, "Invalid phone number"] },
  password:        { type: String, minlength: 8, select: false },
  googleId:        { type: String, sparse: true },
  avatar:          { type: String },
  role:            { type: String, enum: ["user", "admin", "super_admin"], default: "user" },
  isEmailVerified: { type: Boolean, default: false },
  refreshToken:    { type: String, select: false },
  wishlist:        [{ type: mongoose.Schema.Types.ObjectId, ref: "PredictedPaper" }],
  lastLogin:       { type: Date },
}, { timestamps: true });

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
