const dns = require("node:dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Student = require("./models/Student");
const Faculty = require("./models/Faculty");
const Company = require("./models/Company");

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const companies = [
    { name: "Company A", minCGPA: 8, maxBacklogs: 0 },
    { name: "Company B", minCGPA: 9, maxBacklogs: 0 },
    { name: "Company C", minCGPA: 7, maxBacklogs: 0 }
];

const publicStudent = (student) => ({
    _id: student._id,
    name: student.name,
    rollNumber: student.rollNumber,
    email: student.email,
    branch: student.branch,
    cgpa: student.cgpa,
    backlogs: student.backlogs,
    skills: student.skills
});

const createToken = (id, role = "student") =>
    jwt.sign(
        { id: String(id), role },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
    );

async function auth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: "Please login first" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "student") {
            return res.status(403).json({ message: "Student access only" });
        }
        const student = await Student.findById(decoded.id);

        if (!student) {
            return res.status(401).json({ message: "Account not found" });
        }

        req.student = student;
        next();
    } catch {
        res.status(401).json({ message: "Invalid or expired session" });
    }
}

async function facultyAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: "Faculty login required" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== "faculty") {
            return res.status(403).json({ message: "Faculty access only" });
        }

        const faculty = await Faculty.findById(decoded.id);

        if (!faculty) {
            return res.status(401).json({ message: "Faculty account not found" });
        }

        req.faculty = faculty;
        next();
    } catch {
        res.status(401).json({ message: "Invalid or expired faculty session" });
    }
}


app.get("/", (req, res) => {
    res.send("PlaceReady Secure API Running");
});

app.post("/api/auth/register", async (req, res) => {
    try {
        const {
            name, rollNumber, email, password,
            branch, cgpa, backlogs, skills
        } = req.body;

        if (
            typeof name !== "string" || !name.trim() ||
            typeof rollNumber !== "string" || !rollNumber.trim() ||
            typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
            typeof password !== "string" || password.length < 8 ||
            !["CSE", "CSM", "CSD", "IT", "ECE", "EEE", "MECH", "CIVIL"].includes(branch) ||
            cgpa === "" || cgpa === null || !Number.isFinite(Number(cgpa)) ||
            Number(cgpa) < 0 || Number(cgpa) > 10 ||
            !Number.isInteger(Number(backlogs)) || Number(backlogs) < 0 ||
            !Array.isArray(skills)
        ) {
            return res.status(400).json({
                message: "Enter valid registration details. Password must have at least 8 characters."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const student = await Student.create({
            name: name.trim(),
            rollNumber: rollNumber.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            branch,
            cgpa: Number(cgpa),
            backlogs: Number(backlogs),
            skills: skills.filter(s => typeof s === "string").map(s => s.trim()).filter(Boolean)
        });

        res.status(201).json({
            token: createToken(student._id),
            student: publicStudent(student)
        });

    } catch (error) {
        res.status(error.code === 11000 ? 409 : 500).json({
            message: error.code === 11000
                ? "Email or roll number already registered"
                : "Registration failed"
        });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (typeof email !== "string" || typeof password !== "string") {
            return res.status(400).json({ message: "Enter email and password" });
        }

        const student = await Student.findOne({
            email: email.trim().toLowerCase()
        }).select("+password");

        if (!student || !student.password ||
            !(await bcrypt.compare(password, student.password))) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        res.json({
            token: createToken(student._id),
            student: publicStudent(student)
        });
    } catch {
        res.status(500).json({ message: "Login failed" });
    }
});

app.get("/api/me", auth, (req, res) => {
    res.json(publicStudent(req.student));
});

app.put("/api/me", auth, async (req, res) => {
    try {
        const { name, branch, cgpa, backlogs, skills } = req.body;

        if (
            typeof name !== "string" || !name.trim() ||
            !["CSE", "CSM", "CSD", "IT", "ECE", "EEE", "MECH", "CIVIL"].includes(branch) ||
            cgpa === "" || cgpa === null || !Number.isFinite(Number(cgpa)) ||
            Number(cgpa) < 0 || Number(cgpa) > 10 ||
            !Number.isInteger(Number(backlogs)) || Number(backlogs) < 0 ||
            !Array.isArray(skills)
        ) {
            return res.status(400).json({ message: "Invalid profile details" });
        }

        const student = await Student.findByIdAndUpdate(
            req.student._id,
            {
                name: name.trim(),
                branch,
                cgpa: Number(cgpa),
                backlogs: Number(backlogs),
                skills: skills.filter(s => typeof s === "string").map(s => s.trim()).filter(Boolean)
            },
            { new: true, runValidators: true }
        );

        res.json(publicStudent(student));
    } catch {
        res.status(400).json({ message: "Unable to update profile" });
    }
});

app.delete("/api/me", auth, async (req, res) => {
    await Student.findByIdAndDelete(req.student._id);
    res.json({ message: "Account deleted" });
});

app.get("/api/me/eligibility", auth, (req, res) => {
    const student = req.student;

    const results = companies.map(company => ({
        ...company,
        eligible:
            student.cgpa >= company.minCGPA &&
            student.backlogs <= company.maxBacklogs
    }));

    res.json(results);
});

app.post("/api/faculty/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Enter valid credentials" });
    }

    const faculty = await Faculty.findOne({
      email: email.trim().toLowerCase()
    }).select("+password");

    if (!faculty || !(await bcrypt.compare(password, faculty.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = createToken(faculty._id, "faculty");

    res.json({
      token,
      faculty: {
        id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        department: faculty.department
      }
    });
  } catch {
    res.status(500).json({ message: "Faculty login failed" });
  }
});

app.get("/api/faculty/me", facultyAuth, (req, res) => {
  res.json({
    id: req.faculty._id,
    name: req.faculty.name,
    email: req.faculty.email,
    department: req.faculty.department
  });
});

const branches = [
  "CSE", "CSM", "CSD", "IT", "ECE", "EEE", "MECH", "CIVIL"
];

function validateCompany(body) {
  if (
    typeof body.name !== "string" || !body.name.trim() ||
    typeof body.role !== "string" || !body.role.trim() ||
    !Array.isArray(body.eligibleBranches) ||
    body.eligibleBranches.length === 0 ||
    !body.eligibleBranches.every(b => branches.includes(b)) ||
    body.minCGPA === "" ||
    body.minCGPA === null ||
    !Number.isFinite(Number(body.minCGPA)) ||
    Number(body.minCGPA) < 0 ||
    Number(body.minCGPA) > 10 ||
    !Number.isInteger(Number(body.maxBacklogs)) ||
    Number(body.maxBacklogs) < 0 ||
    typeof body.deadline !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(body.deadline) ||
    !Number.isFinite(Date.parse(body.deadline)) ||
    (body.applicationLink &&
      !/^https?:\/\/\S+$/i.test(body.applicationLink))
  ) {
    return false;
  }
  return true;
}

function companyData(body) {
  return {
    name: body.name.trim(),
    role: body.role.trim(),
    description: typeof body.description === "string"
      ? body.description.trim() : "",
    eligibleBranches: body.eligibleBranches,
    minCGPA: Number(body.minCGPA),
    maxBacklogs: Number(body.maxBacklogs),
    deadline: body.deadline,
    applicationLink: body.applicationLink || ""
  };
}

// Faculty: list all companies
app.get("/api/faculty/companies", facultyAuth, async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    res.json(companies);
  } catch {
    res.status(500).json({ message: "Unable to fetch companies" });
  }
});

// Faculty: publish a placement drive
app.post("/api/faculty/companies", facultyAuth, async (req, res) => {
  try {
    if (!validateCompany(req.body)) {
      return res.status(400).json({ message: "Invalid company details" });
    }

    const company = await Company.create({
      ...companyData(req.body),
      createdBy: req.faculty._id
    });

    res.status(201).json(company);
  } catch {
    res.status(500).json({ message: "Unable to create company" });
  }
});

// Faculty: update own published drive
app.put("/api/faculty/companies/:id", facultyAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid company ID" });
    }
    if (!validateCompany(req.body)) {
      return res.status(400).json({ message: "Invalid company details" });
    }

    const company = await Company.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.faculty._id },
      companyData(req.body),
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({ message: "Company not found or not owned by you" });
    }

    res.json(company);
  } catch {
    res.status(400).json({ message: "Unable to update company" });
  }
});

// Faculty: delete own published drive
app.delete("/api/faculty/companies/:id", facultyAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid company ID" });
    }

    const company = await Company.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.faculty._id
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found or not owned by you" });
    }

    res.json({ message: "Company deleted successfully" });
  } catch {
    res.status(500).json({ message: "Unable to delete company" });
  }
});

// Student: view published drives and eligibility
app.get("/api/me/drives", auth, async (req, res) => {
  try {
    const student = req.student;
    const companies = await Company.find().sort({ createdAt: -1 });

    const results = companies.map(company => {
      const reasons = [];

      if (!company.eligibleBranches.includes(student.branch)) {
        reasons.push("Branch not eligible");
      }
      if (student.cgpa < company.minCGPA) {
        reasons.push(`Minimum CGPA required: ${company.minCGPA}`);
      }
      if (student.backlogs > company.maxBacklogs) {
        reasons.push(`Maximum backlogs allowed: ${company.maxBacklogs}`);
      }
      if (company.deadline < new Date().toISOString().slice(0, 10)) {
        reasons.push("Application deadline passed");
      }

      return {
        ...company.toObject(),
        eligible: reasons.length === 0,
        reasons
      };
    });

    res.json(results);
  } catch {
    res.status(500).json({ message: "Unable to fetch placement drives" });
  }
});


if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET missing from .env");
}

const connectDB = mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch(error => {
    console.error("MongoDB Error:", error.message);
    throw error;
  });

if (!process.env.VERCEL) {
  connectDB
    .then(() => {
      app.listen(process.env.PORT || 5000, () => {
        console.log("Backend running on port 5000");
      });
    })
    .catch(() => process.exit(1));
}

module.exports = app;
