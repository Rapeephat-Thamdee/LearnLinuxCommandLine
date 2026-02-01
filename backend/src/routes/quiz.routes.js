const express = require("express");
const quizzes = require("../data/quizzes");
const { createResult } = require("../models/quizResult.model");
// 👇 1. นำเข้า verifyToken เพื่อเช็คว่า Login จริง
const { verifyToken } = require("../middleware/auth"); 

const router = express.Router();

/* =========================
   GET : โหลดคำถาม (ไม่ส่งเฉลย)
   GET /api/quiz/:trackId?difficulty=easy
   ========================= */
router.get("/:trackId", (req, res) => {
  const { trackId } = req.params;
  const { difficulty } = req.query;

  let filtered = quizzes.filter(
    q => q.trackId == trackId
  );

  if (difficulty) {
    filtered = filtered.filter(
      q => q.difficulty === difficulty
    );
  }

  // ❌ ไม่ส่ง answer ไป frontend
  const safe = filtered.map(
    ({ answer, ...rest }) => rest
  );

  res.json(safe);
});

/* =========================
   POST : ตรวจคำตอบ + คิดคะแนน + บันทึก
   POST /api/quiz/submit
   ========================= */
// 👇 2. ใส่ verifyToken ตรงนี้ เพื่อป้องกันคนนอกยิง API
router.post("/submit", verifyToken, async (req, res) => {
  try {
    const {
      // ❌ เอา userId ออกจากตรงนี้ (ไม่รับจาก User โดยตรง)
      trackId,
      difficulty,
      answers
    } = req.body;

    // ✅ 3. เอา userId มาจาก Token แทน (ปลอดภัย 100%)
    const userId = req.user.id; 

    if (
      !trackId ||
      !difficulty ||
      !Array.isArray(answers)
    ) {
      return res.status(400).json({
        error: "Missing data"
      });
    }

    // ดึงคำถามตาม track + difficulty
    const questions = quizzes.filter(
      q =>
        q.trackId == trackId &&
        q.difficulty === difficulty
    );

    if (questions.length === 0) {
      return res.status(400).json({
        error: "No questions found"
      });
    }

    let score = 0;

    questions.forEach(q => {
      const userAnswer = answers.find(
        a => a.id === q.id
      );
      if (
        userAnswer &&
        userAnswer.choice === q.answer
      ) {
        score++;
      }
    });

    const total = questions.length;
    const percent = Math.round(
      (score / total) * 100
    );

    // 💾 บันทึกคะแนน (ใช้ userId ที่ได้จาก Token)
    await createResult(
      userId,
      trackId,
      difficulty,
      score,
      total
    );

    res.json({
      score,
      total,
      percent
    });
  } catch (err) {
    console.error("QUIZ SUBMIT ERROR:", err);
    res.status(500).json({
      error: "Internal server error"
    });
  }
});

module.exports = router;