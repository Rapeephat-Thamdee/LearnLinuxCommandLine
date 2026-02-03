const express = require("express");
const lessons = require("../data/lessons"); 

const router = express.Router();

/**
 * Module: Lesson Routes
 * ทำหน้าที่เสิร์ฟข้อมูล "รายชื่อบทเรียน" ให้กับ Frontend
 */

/* ==================================================
   API: ดึงบทเรียนตาม Track ID (เช่น Basic, Advanced)
   GET /api/lessons/:trackId
   ตัวอย่างการเรียก: /api/lessons/1
   ================================================== */
router.get("/:trackId", (req, res) => {
  // 1. ดึง parameter จาก URL
  // req.params.trackId จะได้ค่าเป็น "String" เสมอ (เช่น "1")
  const { trackId } = req.params;

  // 2. กรองข้อมูล (Filter Logic)
  // ค้นหา lesson ในไฟล์ data ที่มี trackId ตรงกัน
  const filtered = lessons.filter(
    l => l.trackId == trackId
  );

  // 3. Log (เอาไว้ดูใน Terminal ว่า Server ทำงานถูกไหม)
  console.log(
    "GET LESSONS",
    "trackId =", trackId,
    "count =", filtered.length, // จำนวนบทเรียนที่เจอ
    "lessons =", filtered       // เนื้อหาที่เจอ
  );

  // 4. ส่งข้อมูล JSON กลับไปให้หน้าเว็บแสดงผล
  res.json(filtered);
});

module.exports = router;