const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs"); // ✅ 1. เพิ่ม module สำหรับจัดการไฟล์ (ลบไฟล์)
const db = require("../db");
const { verifyToken } = require("../middleware/auth");

// ⚙️ ตั้งค่า Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // เก็บไว้ใน src/uploads (ตามโครงสร้างไฟล์คุณ)
    cb(null, path.join(__dirname, "../uploads/"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + Math.round(Math.random() * 1e9);
    cb(null, "avatar-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// ✅ API: อัปโหลดรูปโปรไฟล์ (พร้อมลบรูปเก่า)
router.post(
  "/upload-avatar",
  verifyToken,
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "กรุณาเลือกไฟล์รูปภาพ" });
      }

      const userId = req.user.id;

      // 🔍 1. หาข้อมูลรูปเก่าก่อน
      const [rows] = await db.execute("SELECT avatar_url FROM users WHERE id = ?", [userId]);
      const oldUrl = rows[0]?.avatar_url;

      // 🗑️ 2. ถ้ารูปเก่าเป็นไฟล์ใน Server (ไม่ใช่รูป Default หรือรูปจากเว็บอื่น) ให้ลบทิ้ง
      if (oldUrl && oldUrl.includes("/uploads/")) {
        // ดึงชื่อไฟล์จาก URL (เช่น http://.../uploads/avatar-123.jpg => avatar-123.jpg)
        const oldFilename = oldUrl.split("/uploads/")[1];
        
        if (oldFilename) {
          // ระบุที่อยู่ไฟล์เก่าให้ถูกต้อง
          const oldFilePath = path.join(__dirname, "../uploads/", oldFilename);
          
          // เช็คว่ามีไฟล์จริงไหม ถ้ามีก็ลบเลย
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log("🗑️ Deleted old avatar:", oldFilename);
          }
        }
      }

      // 🆕 3. สร้าง URL รูปใหม่
      const avatarUrl = `http://localhost:3000/uploads/${req.file.filename}`;

      // 💾 4. อัปเดตลง Database
      await db.execute(
        "UPDATE users SET avatar_url = ? WHERE id = ?",
        [avatarUrl, userId]
      );

      res.json({
        message: "อัปโหลดสำเร็จ (ลบรูปเก่าแล้ว)",
        avatar_url: avatarUrl
      });

    } catch (err) {
      console.error("Upload Error:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

module.exports = router;