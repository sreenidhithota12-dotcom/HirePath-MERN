
const mongoose = require("mongoose");

const roadmapProgressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },
  completedTasks: {
    type: [String],
    default: []
  }
}, { timestamps: true });

roadmapProgressSchema.index(
  { student: 1, company: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "RoadmapProgress",
  roadmapProgressSchema
);
