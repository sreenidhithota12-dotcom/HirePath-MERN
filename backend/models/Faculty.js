
const mongoose = require("mongoose");

const facultySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { type: String, required: true, select: false },
  department: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Faculty", facultySchema);
