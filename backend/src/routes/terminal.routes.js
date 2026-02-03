const express = require("express");

// นำเข้าตัวรันคำสั่ง Docker (ที่เขียนไว้ใน dockerExecutor.js)
const executeDocker = require("../../docker/dockerExecutor");
// นำเข้าตัวจัดการ Lifecycle ของ Container (สร้าง/ลบ/รีเซ็ต)
const {
  ensureContainer,
  resetContainer
} = require("../../docker/containerManager");

const lessons = require("../data/lessons");
const User = require("../models/user.model");
const {
  getProgress,
  createProgress,
  updateProgress
} = require("../models/progress.model");

const router = express.Router();

/**
 * Module Terminal Routes
 * จัดการลอจิกทั้งหมดของ Terminal:
 * 1. รับคำสั่งจากหน้าเว็บ
 * 2. ส่งไปรันใน Docker
 * 3. ตรวจสอบว่าคำสั่งถูกต้องตามโจทย์ไหม
 * 4. บันทึกความคืบหน้า (Progress)
 */

/* ==================================================
   API: รันคำสั่ง Linux (Execute Command)
   POST /api/terminal/execute
   ================================================== */
router.post("/execute", async (req, res) => {
  const { command, userId, trackId = 1 } = req.body;

  // ตัดช่องว่างหน้าหลังออกก่อนนำไปใช้ กัน User พิมพ์เว้นวรรคเกิน
  const inputCmd = command ? command.trim() : "";

  if (!userId || !inputCmd) {
    return res
      .status(400)
      .json({ error: "userId and command required" });
  }

  try {
    // 1 User Check มี User นี้จริงไหม
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2 Docker Provisioning "มีเครื่องให้รันไหม?"
    // เรียก ensureContainer เพื่อเช็คว่า User มี Container หรือยัง
    // - ถ้ายัง -> สร้างใหม่
    // - ถ้ามีแต่ Stop อยู่ -> Start ให้
    const containerName = await ensureContainer(userId);

    //ถ้าชื่อ Container เปลี่ยนไป (เช่น ถูกรีเซ็ต) ให้อัปเดตลง DB ให้ตรงกัน
    if (user.container_name !== containerName) {
      await User.updateContainer(userId, containerName);
    }

    // 3 Load Context "ตอนนี้ User อยู่บทเรียนไหน?"
    // 3.1 เตรียมบทเรียนทั้งหมดใน Track นี้ เรียงตามลำดับ 1, 2, 3...
    const lessonList = lessons
      .filter(l => l.trackId == trackId)
      .sort((a, b) => a.order - b.order);

    if (lessonList.length === 0) {
      return res.status(404).json({ error: "No lessons for this track" });
    }

    // 3.2 ดึง Progress ล่าสุดจาก DB
    let progress = await getProgress(userId, trackId);

    // ถ้ายังไม่เคยเรียน Track นี้เลย -> สร้าง Progress เริ่มต้น (บทที่ 0)
    if (!progress) {
      await createProgress(userId, trackId);
      progress = { current_lesson_index: 0 };
    }

    // แปลง index ให้เป็นตัวเลข (กันเหนียว)
    const lessonIndex = Number(progress.current_lesson_index || progress.current_lesson || 0);

    // Case: เรียนจบ Track แล้ว (Complete)
    if (lessonIndex >= lessonList.length) {
      // ให้ User พิมพ์เล่นต่อได้ แต่ไม่ต้องตรวจคำตอบ/ไม่ต้องบันทึกเพิ่ม
      const output = await executeDocker(inputCmd, containerName);
      return res.json({
        output,
        pass: false, // ผ่านหมดแล้ว ไม่ต้อง pass ซ้ำ
        progress: {
          current: lessonList.length,
          total: lessonList.length
        }
      });
    }

    // ดึงโจทย์ของ "บทปัจจุบัน" ออกมา
    const currentLesson = lessonList[lessonIndex];

    // 4 Execution: "รันคำสั่งจริง"
    // ส่งคำสั่งไปรันใน Linux Container ผ่าน Docker API แล้วรอผลลัพธ์ (stdout/stderr)
    const output = await executeDocker(inputCmd, containerName);

    // 5 Grading Logic: "ตรวจคำตอบ" 
    let pass = false;
    
    // ถ้าบทเรียนนี้มีเงื่อนไขการตรวจ (property 'check')
    if (currentLesson && currentLesson.check) {
      try {
        const regex = new RegExp(currentLesson.check, "i");
        
        // ตรวจสอบที่ "Input Command" (สิ่งที่ User พิมพ์)
        // ว่าตรงกับ Pattern ที่โจทย์กำหนดไหม
        pass = regex.test(inputCmd);

      } catch (e) {
        console.error("Regex Check Error:", e);
        pass = false; // ถ้า Regex พัง หรือเขียนผิด ให้ถือว่าไม่ผ่านไว้ก่อน
      }
    } else {
      // ถ้าไม่มีเงื่อนไข check (เช่น บทเรียนให้อ่านเฉยๆ หรือให้ลองเล่นฟรีสไตล์)
      // ให้ถือว่าผ่านทันทีที่กด Enter
      pass = true;
    }

    // 6 "ถ้าผ่าน ให้เลื่อนไปบทต่อไป"
    if (pass) {
      await updateProgress(
        userId,
        trackId,
        lessonIndex + 1 // บวก 1 เพื่อไปบทถัดไป
      );
    }

    // 7 Response: ส่งผลกลับไปให้ Frontend
    res.json({
      output, // ผลที่ได้จากการรันใน Docker (เช่น "Directory created")
      pass,   // ผ่านหรือไม่ (Frontend จะเอาไปโชว์ไฟเขียว/แดง)
      progress: {
        current: pass ? lessonIndex + 1 : lessonIndex, // ถ้าผ่านก็ส่ง index ใหม่กลับไปเลย
        total: lessonList.length
      }
    });

  } catch (err) {
    console.error("EXECUTE ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ==================================================
   API: ดึงสถานะการเรียนล่าสุด (Get Progress)
   GET /api/terminal/progress/:userId/:trackId
   ================================================== */
router.get(
  "/progress/:userId/:trackId",
  async (req, res) => {
    try {
      const { userId, trackId } = req.params;

      const lessonList = lessons.filter(
        l => l.trackId == trackId
      );

      const progress = await getProgress(userId, trackId);
      
      // Map field ให้ตรงกับ Frontend (current, total)
      const currentIndex = progress 
        ? Number(progress.current_lesson_index || progress.current_lesson || 0)
        : 0;

      res.json({
        current: currentIndex,
        total: lessonList.length
      });
    } catch (error) {
      console.error("GET PROGRESS ERROR:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/* ==================================================
   API: เริ่มเรียนใหม่ (Reset Course)
   POST /api/terminal/reset/:userId/:trackId
   Concept: รีเซ็ต DB + ลบไฟล์ใน Docker ทิ้ง
   ================================================== */
router.post(
  "/reset/:userId/:trackId",
  async (req, res) => {
    try {
      const { userId, trackId } = req.params;

      // 1. รีเซ็ต Progress ใน Database กลับเป็น 0
      await updateProgress(userId, trackId, 0);
      
      // 2. Container ทิ้งแล้วสร้างใหม่
      // เพื่อให้ไฟล์ที่ User เคยสร้างไว้หายไปจริงๆ
      await resetContainer(userId);

      console.log(
        "🔄 RESET",
        "user =", userId,
        "track =", trackId
      );

      res.json({ ok: true });
    } catch (err) {
      console.error("RESET ERROR:", err);
      res.status(500).json({ error: "Reset failed" });
    }
  }
);

module.exports = router;