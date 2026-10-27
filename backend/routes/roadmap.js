
const express = require("express");
const mongoose = require("mongoose");
const Company = require("../models/Company");
const Assessment = require("../models/Assessment");
const RoadmapProgress = require("../models/RoadmapProgress");

const router = express.Router();

const TASKS = {
  DSA: [
    "Revise arrays, strings and linked lists",
    "Practice sorting and binary search",
    "Solve stack, queue and tree problems",
    "Complete DSA practice questions"
  ],
  OOP: [
    "Revise the four pillars of OOP",
    "Practice inheritance and polymorphism",
    "Review abstraction and encapsulation",
    "Solve OOP interview questions"
  ],
  DBMS: [
    "Revise SQL joins and subqueries",
    "Practice normalization",
    "Study transactions and ACID properties",
    "Solve DBMS interview questions"
  ],
  OS: [
    "Revise process scheduling",
    "Practice deadlocks and synchronization",
    "Study paging and virtual memory",
    "Solve OS interview questions"
  ],
  CN: [
    "Revise the OSI and TCP/IP models",
    "Study TCP, UDP and HTTP",
    "Practice subnetting",
    "Solve networking interview questions"
  ]
};

async function generateRoadmap(studentId, companyId) {
  if (!mongoose.isValidObjectId(companyId)) {
    return { status: 400, message: "Invalid company ID" };
  }

  const company = await Company.findById(companyId);
  if (!company) {
    return { status: 404, message: "Company not found" };
  }

  const assessment = await Assessment.findOne({
    student: studentId
  }).sort({ createdAt: -1 });

  const requirements = company.technicalRequirements || [];

  if (!assessment) {
    return {
      status: 200,
      data: {
        companyName: company.name,
        hasAssessment: false,
        topics: [],
        message: "Complete an assessment first."
      }
    };
  }

  const progress = await RoadmapProgress.findOne({
    student: studentId,
    company: companyId
  });

  const completed = progress?.completedTasks || [];

  const topics = requirements.map(requirement => {
    const result = assessment.topicScores.find(
      s => s.topic === requirement.topic
    );

    const score = result?.percentage ?? null;
    const gap = score === null
      ? null
      : Math.max(0, requirement.minScore - score);

    return {
      topic: requirement.topic,
      score,
      target: requirement.minScore,
      gap,
      priority: gap === null
        ? "Assessment needed"
        : gap >= 25 ? "High"
        : gap > 0 ? "Medium"
        : "Achieved",
      tasks: (TASKS[requirement.topic] || []).map(
        (description, index) => {
          const id = `${requirement.topic}-${index}`;

          return {
            id,
            description,
            completed: completed.includes(id)
          };
        }
      )
    };
  }).sort((a, b) => {
    if (a.gap === null) return 1;
    if (b.gap === null) return -1;
    return b.gap - a.gap;
  });

  return {
    status: 200,
    data: {
      companyId: company._id,
      companyName: company.name,
      role: company.role,
      hasAssessment: true,
      overallScore: assessment.overallScore,
      topics
    }
  };
}

// GET: Generate roadmap for selected company
router.get("/:companyId", async (req, res) => {
  try {
    const result = await generateRoadmap(
      req.student._id,
      req.params.companyId
    );

    res.status(result.status).json(
      result.data || { message: result.message }
    );
  } catch (error) {
    console.error("Roadmap error:", error.message);
    res.status(500).json({
      message: "Unable to generate roadmap"
    });
  }
});

// PATCH: Save task completion
router.patch("/:companyId/progress", async (req, res) => {
  try {
    const { companyId } = req.params;
    const { taskId, completed } = req.body;

    if (!mongoose.isValidObjectId(companyId)) {
      return res.status(400).json({
        message: "Invalid company ID"
      });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        message: "Company not found"
      });
    }

    const validTaskIds = (
      company.technicalRequirements || []
    ).flatMap(r =>
      (TASKS[r.topic] || []).map((_, i) => `${r.topic}-${i}`)
    );

    if (
      typeof taskId !== "string" ||
      !validTaskIds.includes(taskId) ||
      typeof completed !== "boolean"
    ) {
      return res.status(400).json({
        message: "Invalid progress update"
      });
    }

    const filter = {
      student: req.student._id,
      company: companyId
    };

    const update = completed
      ? { $addToSet: { completedTasks: taskId } }
      : { $pull: { completedTasks: taskId } };

    if (completed) {
      await RoadmapProgress.updateOne(
        filter,
        {
          $setOnInsert: filter,
          ...update
        },
        { upsert: true }
      );
    } else {
      await RoadmapProgress.updateOne(filter, update);
    }

    res.json({
      message: "Progress saved successfully"
    });
  } catch (error) {
    console.error("Progress error:", error.message);
    res.status(500).json({
      message: "Unable to update progress"
    });
  }
});

module.exports = router;
