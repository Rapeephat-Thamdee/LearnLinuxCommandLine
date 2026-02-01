const express = require("express");
const db = require("../db");
// นำเข้าฟังก์ชันสำหรับลบ Container (สมมติว่าคุณมีฟังก์ชันนี้ใน containerManager)
const { removeContainer } = require("../../docker/containerManager"); 

const router = express.Router();

/* =========================
   GET : ผู้ใช้ทั้งหมด + ค้นหา
   GET /api/admin/users?search=abc
   ========================= */
router.get("/users", async (req, res) => {
  const { search } = req.query;

  try {
    // ⚠️ แก้ไข: เปลี่ยน name -> username และเพิ่ม role
    let sql = "SELECT id, username, email, role, container_name FROM users";
    let params = [];

    // เพิ่มเงื่อนไขการค้นหา
    if (search) {
      sql += " WHERE username LIKE ? OR email LIKE ?";
      params.push(`%${search}%`, `%${search}%`);
    }

    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("GET USERS ERROR:", err);
    res.status(500).json({ error: "Load users failed" });
  }
});

/* =========================
   GET : ข้อมูลผู้ใช้รายคน + ประวัติคะแนน
   GET /api/admin/users/:id
   ========================= */
router.get("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // ⚠️ แก้ไข: เปลี่ยน name -> username
    const [[user]] = await db.execute(
      "SELECT id, username, email, role, container_name FROM users WHERE id = ?",
      [id]
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ดึงคะแนน (Quiz Results)
    const [results] = await db.execute(
      `SELECT track_id, difficulty, MAX(score) AS bestScore
       FROM quiz_results
       WHERE user_id = ?
       GROUP BY track_id, difficulty`,
      [id]
    );

    res.json({ user, results });
  } catch (err) {
    console.error("GET USER DETAIL ERROR:", err);
    res.status(500).json({ error: "Load user failed" });
  }
});

/* =========================
   DELETE : ลบผู้ใช้ (ลบ Docker + DB)
   DELETE /api/admin/users/:id
   ========================= */
router.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // 1. ค้นหา User ก่อนเพื่อเอาชื่อ Container
    const [[user]] = await db.execute("SELECT container_name FROM users WHERE id = ?", [id]);
    
    if (user && user.container_name) {
        // 🐳 2. ลบ Container ของ User คนนั้นทิ้ง (ถ้ามี)
        try {
            // ต้องแน่ใจว่า import ฟังก์ชัน removeContainer มาแล้ว
            // หรือถ้าไม่มีฟังก์ชันนี้ ให้ข้ามไปก่อน
             if (typeof removeContainer === 'function') {
                 await removeContainer(user.container_name);
             }
        } catch (dockerErr) {
            console.error("Docker remove failed:", dockerErr);
            // ไม่ return error เพราะเรายังอยากลบข้อมูลใน DB ต่อ
        }
    }

    // 3. ลบข้อมูลใน Database (เรียงลำดับ Foreign Key)
    await db.execute("DELETE FROM quiz_results WHERE user_id = ?", [id]);
    await db.execute("DELETE FROM progress WHERE user_id = ?", [id]);
    await db.execute("DELETE FROM users WHERE id = ?", [id]);

    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;