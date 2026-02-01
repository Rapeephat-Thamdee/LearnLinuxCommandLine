const express = require("express");

// docker อยู่นอก src
const executeDocker = require("../../docker/dockerExecutor");
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

/* =========================
   POST : Execute command
   ========================= */
router.post("/execute", async (req, res) => {
  const { command, userId, trackId = 1 } = req.body;

  // ตัดช่องว่างหน้าหลังออกก่อนนำไปใช้
  const inputCmd = command ? command.trim() : "";

  if (!userId || !inputCmd) {
    return res
      .status(400)
      .json({ error: "userId and command required" });
  }

  try {
    // 1️⃣ หา user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2️⃣ ensure docker container
    // (เช็คว่า User มี Container หรือยัง ถ้ายังให้สร้าง ถ้ามีแล้วให้ Start)
    const containerName = await ensureContainer(userId);

    // อัปเดตชื่อ Container ลง DB ถ้ามีการเปลี่ยนแปลง
    if (user.container_name !== containerName) {
      await User.updateContainer(userId, containerName);
    }

    // 3️⃣ โหลด lessons ตาม track
    // (เรียงตามลำดับ order เพื่อความชัวร์)
    const lessonList = lessons
      .filter(l => l.trackId == trackId)
      .sort((a, b) => a.order - b.order);

    if (lessonList.length === 0) {
      return res.status(404).json({
        error: "No lessons for this track"
      });
    }

    // 4️⃣ โหลด progress จาก DB
    let progress = await getProgress(userId, trackId);

    if (!progress) {
      await createProgress(userId, trackId);
      progress = { current_lesson_index: 0 };
    }

    // แปลง index ให้เป็นตัวเลข (ป้องกันบั๊ก string)
    // หมายเหตุ: เช็คชื่อ Field ใน DB ด้วยว่าเป็น current_lesson หรือ current_lesson_index
    // (ในโค้ดนี้ผมอิงตาม progress.model ที่น่าจะ return current_lesson_index)
    const lessonIndex = Number(progress.current_lesson_index || progress.current_lesson || 0);

    // ✅ เรียนครบแล้ว
    if (lessonIndex >= lessonList.length) {
      // Execute เล่นๆ ได้ แต่ไม่บันทึก Progress เพิ่ม
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

    const currentLesson = lessonList[lessonIndex];

    // 5️⃣ execute command (รันจริงใน Docker เพื่อเอาผลลัพธ์มาโชว์)
    const output = await executeDocker(inputCmd, containerName);

    // 6️⃣ ตรวจคำตอบ (Validation Logic)
    let pass = false;
    
    if (currentLesson && currentLesson.check) {
      try {
        // ✅ แปลง String จาก lessons.js เป็น Regex Object
        // flag 'i' = case insensitive (ไม่สนตัวพิมพ์เล็กใหญ่)
        const regex = new RegExp(currentLesson.check, "i");
        
        // ✅ ตรวจสอบที่ "Input Command" (สิ่งที่ User พิมพ์)
        // เพราะ Regex เราเขียนไว้ดัก input เช่น "^mkdir .+"
        pass = regex.test(inputCmd);

      } catch (e) {
        console.error("Regex Check Error:", e);
        pass = false; // ถ้า Regex พัง ให้ถือว่าไม่ผ่านไว้ก่อน
      }
    } else {
      // ถ้าไม่มี check (เช่น บทเรียนให้อ่านเฉยๆ) ให้ถือว่าผ่านเลยถ้าพิมพ์อะไรมาก็ได้
      pass = true;
    }

    // 7️⃣ ถ้าผ่าน → update progress ลง DB
    if (pass) {
      await updateProgress(
        userId,
        trackId,
        lessonIndex + 1
      );
    }

    // ส่งผลลัพธ์กลับ Frontend
    res.json({
      output, // ผลที่ได้จากการรันใน Docker
      pass,   // ผ่านหรือไม่
      progress: {
        current: pass ? lessonIndex + 1 : lessonIndex,
        total: lessonList.length
      }
    });

  } catch (err) {
    console.error("EXECUTE ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* =========================
   GET : Load progress
   ========================= */
router.get(
  "/progress/:userId/:trackId",
  async (req, res) => {
    try {
      const { userId, trackId } = req.params;

      const lessonList = lessons.filter(
        l => l.trackId == trackId
      );

      const progress = await getProgress(userId, trackId);
      
      // Map field ให้ตรงกับ Frontend
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

/* =========================
   POST : Reset progress + container
   ========================= */
router.post(
  "/reset/:userId/:trackId",
  async (req, res) => {
    try {
      const { userId, trackId } = req.params;

      // รีเซ็ต Progress เป็น 0
      await updateProgress(userId, trackId, 0);
      
      // ลบ/รีเซ็ต Container ด้วยเพื่อให้ไฟล์หายไป เริ่มใหม่หมด
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