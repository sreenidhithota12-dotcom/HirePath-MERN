
const express = require("express");
const Company = require("../models/Company");
const Assessment = require("../models/Assessment");

const router = express.Router();

const TOPICS = ["DSA", "OOP", "DBMS", "OS", "CN"];

router.get("/", async (req, res) => {
  try {
    // Only analyze the authenticated student's data.
    const student = req.student;

    // Fetch the student's most recent assessment.
    const latestAssessment = await Assessment.findOne({
      student: student._id
    }).sort({ createdAt: -1 });

    if (!latestAssessment) {
      return res.json({
        hasAssessment: false,
        message: "Complete a technical assessment to view your skill gaps.",
        companies: []
      });
    }

    const companies = await Company.find()
      .sort({ createdAt: -1 });

    const results = companies.map(company => {
      const requirements = company.technicalRequirements || [];

      // Match each required topic to the student's score.
      const gaps = requirements
        .filter(r => TOPICS.includes(r.topic))
        .map(requirement => {
          const performance = latestAssessment.topicScores.find(
            score => score.topic === requirement.topic
          );

          const score = performance?.percentage ?? null;
          const target = requirement.minScore;

          return {
            topic: requirement.topic,
            studentScore: score,
            requiredScore: target,
            gap: score === null
              ? null
              : Math.max(0, target - score),
            meetsTarget: score === null
              ? null
              : score >= target
          };
        });

      const measured = gaps.filter(g => g.studentScore !== null);
      const totalGap = measured.reduce((sum, g) => sum + g.gap, 0);
      const averageGap = measured.length
        ? Math.round(totalGap / measured.length)
        : null;

      const sortedGaps = [...gaps].sort(
        (a, b) => (b.gap ?? Infinity) - (a.gap ?? Infinity)
      );

      return {
        companyId: company._id,
        companyName: company.name,
        role: company.role,
        requirementsConfigured: requirements.length > 0,
        gaps: sortedGaps,
        averageGap,
        meetsAllTargets:
          gaps.length > 0 &&
          gaps.every(g => g.meetsTarget === true)
      };
    });

    res.json({
      hasAssessment: true,
      assessmentId: latestAssessment._id,
      assessedAt: latestAssessment.createdAt,
      overallScore: latestAssessment.overallScore,
      companies: results
    });
  } catch (error) {
    console.error("Skill analysis error:", error.message);
    res.status(500).json({
      message: "Unable to calculate skill gaps."
    });
  }
});

module.exports = router;
