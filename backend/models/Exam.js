const mongoose = require("mongoose");
const slugify = require("slugify");

const eligibilitySchema = new mongoose.Schema({
  ageMin:       { type: Number },
  ageMax:       { type: Number },
  education:    { type: String, required: true },
  nationality:  { type: String, default: "Indian Citizen" },
  other:        [{ type: String }],
}, { _id: false });

const examStageSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  type:     { type: String, enum: ["objective", "descriptive", "interview", "skill-test"], required: true },
  duration: { type: Number }, // minutes
  marks:    { type: Number },
  subjects: [{ type: String }],
}, { _id: false });

const syllabusSectionSchema = new mongoose.Schema({
  name:   { type: String, required: true },
  topics: [{ type: String }],
}, { _id: false });

const importantDateSchema = new mongoose.Schema({
  event:         { type: String, required: true },
  date:          { type: String, required: true },
  isApproximate: { type: Boolean, default: false },
}, { _id: false });

const examSchema = new mongoose.Schema({
  title:          { type: String, required: [true, "Exam title is required"], trim: true },
  slug:           { type: String, unique: true, lowercase: true, index: true },
  shortName:      { type: String, trim: true },
  category:       {
    type: String,
    enum: ["upsc", "ssc", "banking", "railway", "defence", "teaching", "state", "engineering", "medical"],
    required: [true, "Category is required"],
    index: true,
  },
  conductingBody: { type: String, required: true },
  description:    { type: String, required: true, maxlength: 2000 },
  eligibility:    { type: eligibilitySchema, required: true },
  examPattern: {
    stages:       [examStageSchema],
    totalMarks:   { type: Number },
    negativeMark: { type: Boolean, default: false },
  },
  syllabus:         [syllabusSectionSchema],
  selectionProcess: [{ type: String }],
  importantDates:   [importantDateSchema],
  vacancies:        { type: Number },
  salary:           { type: String },
  thumbnail:        { type: String },
  isTrending:       { type: Boolean, default: false, index: true },
  isActive:         { type: Boolean, default: true, index: true },
  metaTitle:        { type: String },
  metaDescription:  { type: String },
}, { timestamps: true });

// Auto-generate slug
examSchema.pre("save", function (next) {
  if (!this.slug || this.isModified("title")) {
    this.slug = slugify(this.title, { lower: true, strict: true, trim: true });
  }
  if (!this.shortName) this.shortName = this.title;
  next();
});

// Text search index
examSchema.index({ title: "text", description: "text", shortName: "text" });

module.exports = mongoose.model("Exam", examSchema);
