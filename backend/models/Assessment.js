
const mongoose = require("mongoose");

const topicScoreSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  correct: { type: Number, required: true },
  total: { type: Number, required: true },
  percentage: { type: Number, required: true }
}, { _id: false });

const assessmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
    index: true
  },
  topicScores: [topicScoreSchema],
  correctAnswers: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  overallScore: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Assessment", assessmentSchema);
