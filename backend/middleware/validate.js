const Joi = require("joi");

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, allowUnknown: false });
  if (error) {
    const errors = error.details.map((d) => d.message.replace(/"/g, ""));
    return res.status(400).json({ success: false, error: errors.join(", ") });
  }
  req.body = value;
  next();
};

// ── Auth Validators ───────────────────────────────────────────
exports.validateRegister = validate(Joi.object({
  name:     Joi.string().min(2).max(80).required().messages({ "string.min": "Name must be at least 2 characters" }),
  email:    Joi.string().email().required().lowercase(),
  phone:    Joi.string().pattern(/^(\+91)?[6-9]\d{9}$/).required().messages({ "string.pattern.base": "Enter a valid Indian mobile number" }),
  password: Joi.string().min(8).required().messages({ "string.min": "Password must be at least 8 characters" }),
}));

exports.validateLogin = validate(Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
}));

exports.validateOTP = validate(Joi.object({
  email:   Joi.string().email().required(),
  otp:     Joi.string().length(6).pattern(/^\d{6}$/).required(),
  purpose: Joi.string().valid("register", "login", "forgot-password").required(),
}));

// ── Exam Validator ────────────────────────────────────────────
exports.validateExam = validate(Joi.object({
  title:          Joi.string().min(3).max(200).required(),
  slug:           Joi.string().lowercase().pattern(/^[a-z0-9-]+$/).optional(),
  shortName:      Joi.string().max(30).optional(),
  category:       Joi.string().valid("upsc","ssc","banking","railway","defence","teaching","state","engineering","medical").required(),
  conductingBody: Joi.string().required(),
  description:    Joi.string().min(20).max(2000).required(),
  isTrending:     Joi.boolean().default(false),
  isActive:       Joi.boolean().default(true),
}));

// ── Paper Validator ───────────────────────────────────────────
exports.validatePaper = validate(Joi.object({
  examId:          Joi.string().hex().length(24).required(),
  title:           Joi.string().min(3).max(200).required(),
  description:     Joi.string().max(1000).optional().allow(""),
  price:           Joi.number().integer().min(0).required(),
  difficultyLevel: Joi.string().valid("easy", "medium", "hard").default("medium"),
  predictionScore: Joi.number().min(0).max(100).default(85),
  totalQuestions:  Joi.number().integer().min(1).required(),
  paperType:       Joi.string().valid("predicted","model","pyq","practice").default("predicted"),
  year:            Joi.number().integer().min(2000).max(2030).optional(),
}));
