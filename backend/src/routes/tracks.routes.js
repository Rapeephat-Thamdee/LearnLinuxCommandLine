const express = require("express");
const tracks = require("../data/tracks");

const router = express.Router();

/**
 * Tracks Routes
 * จัดการเกี่ยวกับ "แผนการเรียน" หรือ "หลักสูตร" ทั้งหมดในระบบ
 */

/* ==================================================
   API: ดึงรายชื่อหลักสูตรทั้งหมด (Menu)
   GET /api/tracks
   ================================================== */
router.get("/", (req, res) => {
  // ส่งข้อมูล tracks ทั้งหมดกลับไปให้ Frontend วาดเป็น Card ให้ User เลือก
  res.json(tracks);
});

module.exports = router;