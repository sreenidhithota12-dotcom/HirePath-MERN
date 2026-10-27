
const express = require("express");
const Assessment = require("../models/Assessment");

const router = express.Router();

// Initial demonstration question bank
// Answers stay on the server.
const questions = [
  {
    id: 1,
    topic: "DSA",
    question: "Which data structure follows FIFO?",
    options: ["Stack", "Queue", "Tree", "Graph"],
    correctAnswer: 1
  },
  {
    id: 2,
    topic: "DSA",
    question: "What is binary search's time complexity?",
    options: ["O(n)", "O(n²)", "O(log n)", "O(1)"],
    correctAnswer: 2
  },
  {
    id: 3,
    topic: "OOP",
    question: "Which concept allows one interface to have multiple forms?",
    options: [
      "Encapsulation",
      "Polymorphism",
      "Inheritance",
      "Composition"
    ],
    correctAnswer: 1
  },
  {
    id: 4,
    topic: "OOP",
    question: "Which concept hides implementation details?",
    options: [
      "Abstraction",
      "Inheritance",
      "Overloading",
      "Aggregation"
    ],
    correctAnswer: 0
  },
  {
    id: 5,
    topic: "DBMS",
    question: "Which SQL command removes all rows but retains the table?",
    options: ["DROP", "ALTER", "TRUNCATE", "CREATE"],
    correctAnswer: 2
  },
  {
    id: 6,
    topic: "DBMS",
    question: "Which ACID property ensures all-or-nothing execution?",
    options: ["Atomicity", "Durability", "Isolation", "Consistency"],
    correctAnswer: 0
  },
  {
    id: 7,
    topic: "OS",
    question: "Which CPU scheduling algorithm uses a time quantum?",
    options: ["FCFS", "SJF", "Round Robin", "Priority"],
    correctAnswer: 2
  },
  {
    id: 8,
    topic: "OS",
    question: "Which is a necessary condition for deadlock?",
    options: [
      "Preemption",
      "Circular wait",
      "Unlimited resources",
      "No mutual exclusion"
    ],
    correctAnswer: 1
  },
  {
    id: 9,
    topic: "CN",
    question: "Which OSI layer handles routing?",
    options: ["Transport", "Data Link", "Network", "Session"],
    correctAnswer: 2
  },
  {
    id: 10,
    topic: "CN",
    question: "Which protocol provides reliable, ordered delivery?",
    options: ["UDP", "TCP", "IP", "ARP"],
    correctAnswer: 1
  }
];

// Retrieve questions without exposing answers
router.get("/questions", (req, res) => {
  const publicQuestions = questions.map(
    ({ correctAnswer, ...question }) => question
  );

  res.json(publicQuestions);
});

// Submit answers and calculate results securely
router.post("/submit", async (req, res) => {
  try {
    const { answers } = req.body;

    if (!Array.isArray(answers) ||
        answers.length !== questions.length) {
      return res.status(400).json({
        message: "Please answer every question."
      });
    }

    const answerMap = new Map();

    for (const item of answers) {
      if (!item ||
          !Number.isInteger(item.id) ||
          !Number.isInteger(item.answer) ||
          answerMap.has(item.id)) {
        return res.status(400).json({
          message: "Invalid or duplicate answers."
        });
      }

      answerMap.set(item.id, item.answer);
    }

    const valid = questions.every(q =>
      answerMap.has(q.id) &&
      answerMap.get(q.id) >= 0 &&
      answerMap.get(q.id) < q.options.length
    );

    if (!valid) {
      return res.status(400).json({
        message: "Invalid assessment submission."
      });
    }

    const topics = [...new Set(questions.map(q => q.topic))];

    const topicScores = topics.map(topic => {
      const selected = questions.filter(q => q.topic === topic);

      const correct = selected.filter(
        q => answerMap.get(q.id) === q.correctAnswer
      ).length;

      return {
        topic,
        correct,
        total: selected.length,
        percentage: Math.round(
          correct * 100 / selected.length
        )
      };
    });

    const correctAnswers = topicScores.reduce(
      (sum, topic) => sum + topic.correct, 0
    );

    const assessment = await Assessment.create({
      student: req.student._id,
      topicScores,
      correctAnswers,
      totalQuestions: questions.length,
      overallScore: Math.round(
        correctAnswers * 100 / questions.length
      )
    });

    res.status(201).json(assessment);
  } catch (error) {
    console.error("Assessment error:", error.message);

    res.status(500).json({
      message: "Unable to submit assessment."
    });
  }
});

// Retrieve only the logged-in student's history
router.get("/history", async (req, res) => {
  try {
    const history = await Assessment.find({
      student: req.student._id
    })
      .sort({ createdAt: -1 })
      .limit(30);

    res.json(history);
  } catch (error) {
    res.status(500).json({
      message: "Unable to retrieve assessment history."
    });
  }
});

module.exports = router;
