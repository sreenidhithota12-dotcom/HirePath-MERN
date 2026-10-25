
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  rollNumber: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  branch: { type: String, required: true },
  cgpa: { type: Number, required: true, min: 0, max: 10 },
  backlogs: { type: Number, required: true, min: 0 },
  skills: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model("Student", studentSchema);
