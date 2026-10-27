
const mongoose = require("mongoose");

const technicalRequirementSchema = new mongoose.Schema({
  topic: {
    type: String,
    enum: ["DSA", "OOP", "DBMS", "OS", "CN"],
    required: true
  },
  minScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  }
}, { _id: false });

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  description: { type: String, default: "" },

  eligibleBranches: {
    type: [String],
    required: true,
    validate: v => v.length > 0
  },

  minCGPA: { type: Number, required: true, min: 0, max: 10 },
  maxBacklogs: { type: Number, required: true, min: 0 },
  deadline: { type: String, required: true },
  applicationLink: { type: String, default: "" },

  // NEW: Company-specific technical requirements
  technicalRequirements: {
    type: [technicalRequirementSchema],
    default: []
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Faculty",
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Company", companySchema);
