const express = require("express");
const quizzes = require("../data/quizzes"); // ข้อมูลโจทย์และเฉลย (ห้ามหลุดไป Frontend เด็ดขาด!)
const { createResult } = require("../models/quizResult.model");
// นำเข้า Middleware ตรวจสอบสิทธิ์ (Security)
// ต้องใช้เพื่อให้แน่ใจว่าคนที่จะส่งคำตอบ เป็นสมาชิกของเราจริงๆ
const { verifyToken } = require("../middleware/auth"); 

const router = express.Router();

/**
 * 📝 Module: Quiz Routes
 * จัดการเรื่องการสอบ: โหลดโจทย์ และ ตรวจคะแนน
 */

/* ==================================================
   1. API: โหลดโจทย์ (Get Questions)
   GET /api/quiz/:trackId?difficulty=easy
   Concept: ส่งคำถามไปให้ User แต่ **ห้าม** ส่งเฉลยไปด้วย
   ================================================== */
router.get("/:trackId", (req, res) => {
  const { trackId } = req.params;
  const { difficulty } = req.query; // รับ query param เช่น ?difficulty=hard

  // 1. กรองโจทย์ตามบทเรียน (Track)
  let filtered = quizzes.filter(
    q => q.trackId == trackId
  );

  // 2. ถ้าระบุระดับความยากมา ก็กรองเพิ่ม
  if (difficulty) {
    filtered = filtered.filter(
      q => q.difficulty === difficulty
    );
  }

  // 🛡️ Anti-Cheat Logic: เทคนิคสำคัญ!
  // เราใช้ .map เพื่อสร้าง object ใหม่ที่ "ตัด" property 'answer' ทิ้งไป
  // ก่อนส่งไปให้ Frontend เพื่อป้องกันคนกด Inspect ดู Network แล้วเห็นคำตอบ
  const safe = filtered.map(
    ({ answer, ...rest }) => rest // Destructuring เอา answer ออก, เก็บส่วนที่เหลือไว้ใน rest
  );

  res.json(safe);
});

/* ==================================================
   2. API: ส่งคำตอบ & ประมวลผล (Submit & Score)
   POST /api/quiz/submit
   Concept: รับคำตอบ -> ตรวจสอบ -> คิดคะแนน -> บันทึก DB
   ================================================== */
// 🔒 ใส่ verifyToken ตรงนี้ เพื่อป้องกันคนนอก (Anonymous) ยิง API รัวๆ
router.post("/submit", verifyToken, async (req, res) => {
  try {
    const {
      // ⚠️ Note: เราไม่รับ userId จาก req.body เด็ดขาด! (ป้องกันการแอบอ้างเป็นคนอื่น)
      trackId,
      difficulty,
      answers // Array คำตอบที่ User ส่งมา
    } = req.body;

    // ✅ Security: ดึง User ID จาก Token ที่ผ่านการ verify แล้วเท่านั้น
    // เชื่อถือได้ 100% ว่าเป็นของคนนี้จริง
    const userId = req.user.id; 

    // Validation กัน Error
    if (!trackId || !difficulty || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Missing data" });
    }

    // 1️⃣ Fetch Master Data: ดึงเฉลยที่ถูกต้องจากไฟล์ Server มาเตรียมตรวจ
    const questions = quizzes.filter(
      q => q.trackId == trackId && q.difficulty === difficulty
    );

    if (questions.length === 0) {
      return res.status(400).json({ error: "No questions found" });
    }

    // 2️⃣ Scoring Logic: เริ่มตรวจข้อสอบ
    let score = 0;

    questions.forEach(q => {
      // หาคำตอบที่ User ตอบมาในข้อนั้นๆ
      const userAnswer = answers.find(a => a.id === q.id);
      
      // ถ้ามีคำตอบ และ คำตอบตรงกับเฉลย (q.answer)
      if (userAnswer && userAnswer.choice === q.answer) {
        score++; // บวกคะแนน
      }
    });

    // คำนวณเปอร์เซ็นต์ (เผื่อเอาไปโชว์หรือทำเกรด)
    const total = questions.length;
    const percent = Math.round((score / total) * 100);

    // 3️⃣ Save Result: บันทึกลง Database
    // ใช้ userId ที่ได้จาก Token เพื่อบันทึกเข้า Account ตัวเอง
    await createResult(
      userId,
      trackId,
      difficulty,
      score,
      total
    );

    // ส่งผลสอบกลับไปให้ User ดูทันที
    res.json({
      score,
      total,
      percent
    });

  } catch (err) {
    console.error("QUIZ SUBMIT ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;