const express = require("express");
const db = require("../db");
// นำเข้าฟังก์ชันสำหรับลบ Container
const { removeContainer } = require("../../docker/containerManager"); 

const router = express.Router();

/**
 * Admin Routes
 * จัดการข้อมูล User สำหรับผู้ดูแลระบบ (Admin Dashboard)
 * - ดูรายชื่อ, ค้นหา, ดูรายละเอียด, และลบ User
 */

/* ==================================================
   1. API ดึงรายชื่อผู้ใช้ทั้งหมด (รองรับการค้นหา)
   GET /api/admin/users?search=abc
   ================================================== */
router.get("/users", async (req, res) => {
  const { search } = req.query;

  try {
    // เตรียม SQL พื้นฐาน ดึงข้อมูลที่จำเป็นแสดงในตาราง (ไม่เอา password)
    let sql = "SELECT id, username, email, role, container_name FROM users";
    let params = [];

    // Search Logic ถ้ามี search param ส่งมา ให้ต่อ SQL ด้วย WHERE LIKE ใช้ OR เพื่อให้ค้นหาได้ทั้งจาก username หรือ email
    if (search) {
      sql += " WHERE username LIKE ? OR email LIKE ?";
      params.push(`%${search}%`, `%${search}%`); // ใส่ % หน้าหลังเพื่อค้นหาบางส่วนของคำ
    }

    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("GET USERS ERROR:", err);
    res.status(500).json({ error: "Load users failed" });
  }
});

/* ==================================================
   2. API ดูรายละเอียดเจาะลึกรายบุคคล (User Detail)
   GET /api/admin/users/:id
   ================================================== */
router.get("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Step 1 ดึงข้อมูลส่วนตัว (User Profile)
    // ใช้ destructuring [[user]] เพราะ db.execute คืนค่าเป็น [[row1, row2], fields]
    // เราต้องการแค่ row แรกสุด
    const [[user]] = await db.execute(
      "SELECT id, username, email, role, container_name FROM users WHERE id = ?",
      [id]
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Step 2 ดึงประวัติการเรียน/คะแนนสอบ ใช้ MAX(score) และ GROUP BY เพื่อหาคะแนนที่ดีที่สุดในแต่ละ Track/Difficulty
    const [results] = await db.execute(
      `SELECT track_id, difficulty, MAX(score) AS bestScore
       FROM quiz_results
       WHERE user_id = ?
       GROUP BY track_id, difficulty`,
      [id]
    );

    // ส่งคืนทั้งข้อมูล user และ results กลับไปใน object เดียว
    res.json({ user, results });
  } catch (err) {
    console.error("GET USER DETAIL ERROR:", err);
    res.status(500).json({ error: "Load user failed" });
  }
});

/* ==================================================
   3. API ลบผู้ใช้ถาวร
   DELETE /api/admin/users/:id
   Concept: ลบ Docker Container -> ลบข้อมูลประกอบ -> ลบ User
   ================================================== */
router.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // 1 ค้นหา User ก่อนเพื่อเอาชื่อ Container
    const [[user]] = await db.execute("SELECT container_name FROM users WHERE id = ?", [id]);

    // ถ้า User มี Container รันค้างอยู่
    if (user && user.container_name) {
        // 2 สั่งลบ Container
        try {
            // ตรวจสอบว่าฟังก์ชัน removeContainer มีอยู่จริงและเรียกใช้งานได้
             if (typeof removeContainer === 'function') {
                 await removeContainer(user.container_name);
             }
        } catch (dockerErr) {
            console.error("Docker remove failed:", dockerErr); 
        }
    }

    // 3 ลบข้อมูลตามลำดับ Foreign Key
    // ต้องลบตารางลูก (quiz_results, progress) ก่อนลบตารางแม่ (users)
    await db.execute("DELETE FROM quiz_results WHERE user_id = ?", [id]);
    await db.execute("DELETE FROM progress WHERE user_id = ?", [id]);
    await db.execute("DELETE FROM users WHERE id = ?", [id]);// สุดท้ายค่อยลบ User ออกจากระบบ

    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;