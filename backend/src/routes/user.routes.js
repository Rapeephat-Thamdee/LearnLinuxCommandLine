const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs"); // Module สำหรับจัดการไฟล์ (ใช้เช็คและลบไฟล์)
const db = require("../db");
const { verifyToken } = require("../middleware/auth");

/**
 * ตั้งค่าการเก็บไฟล์
 * เราใช้ diskStorage เพื่อกำหนดชื่อไฟล์และโฟลเดอร์ปลายทางเอง
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // กำหนดโฟลเดอร์ปลายทาง: src/uploads
    // ใช้ path.join เพื่อความชัวร์เรื่องเครื่องหมาย / หรือ \ บน OS ต่างๆ
    cb(null, path.join(__dirname, "../uploads/"));
  },
  filename: (req, file, cb) => {
    // ตั้งชื่อไฟล์ใหม่โดยใช้ "timestamp + random number"
    // เพื่อป้องกันชื่อไฟล์ซ้ำกัน (เช่น user1 อัปรูป me.jpg, user2 ก็อัป me.jpg จะได้ไม่ทับกัน)
    const uniqueSuffix = Date.now() + Math.round(Math.random() * 1e9);
    cb(null, "avatar-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

/* ==================================================
   API: อัปโหลดรูปโปรไฟล์ (Upload Avatar)
   POST /api/user/upload-avatar
   Concept: อัปรูปใหม่ -> ลบรูปเก่าทิ้ง (Housekeeping) -> อัปเดต DB
   ================================================== */
router.post(
  "/upload-avatar",
  verifyToken,             // 1. เช็คสิทธิ์ (ต้อง Login ก่อน)
  upload.single("avatar"), // 2. รับไฟล์จาก form-data ชื่อ field 'avatar'
  async (req, res) => {
    try {
      // Validation ถ้า User ไม่ได้เลือกไฟล์มา ให้แจ้งเตือนกลับไป
      if (!req.file) {
        return res.status(400).json({ error: "กรุณาเลือกไฟล์รูปภาพ" });
      }

      const userId = req.user.id;

      // Step 1 จัดการไฟล์ขยะ
      // ก่อนจะจบการทำงาน เราควรลบรูปเก่าของ User ทิ้ง เพื่อประหยัดพื้นที่ Server
      
      // 1.1 ดึงข้อมูลรูปเก่าจาก DB มาเช็คก่อน
      const [rows] = await db.execute("SELECT avatar_url FROM users WHERE id = ?", [userId]);
      const oldUrl = rows[0]?.avatar_url;

      // 1.2 เช็คเงื่อนไขก่อนลบ:
      // - ต้องมี oldUrl
      // - ต้องเป็นรูปที่อยู่ใน Server เราเท่านั้น (เช็คว่ามีคำว่า "/uploads/")
      if (oldUrl && oldUrl.includes("/uploads/")) {
        
        // ตัด string เพื่อเอาแค่ชื่อไฟล์ (เช่น http://.../uploads/avatar-123.jpg => avatar-123.jpg)
        const oldFilename = oldUrl.split("/uploads/")[1];
        
        if (oldFilename) {
          // ระบุ Path เต็มของไฟล์เก่าที่จะลบ
          const oldFilePath = path.join(__dirname, "../uploads/", oldFilename);
          
          // เช็คว่าไฟล์นั้นยังมีอยู่จริงไหม? (กัน Error กรณีไฟล์หายไปแล้ว)
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath); // สั่งลบไฟล์ทันที
            console.log(" Deleted old avatar:", oldFilename);
          }
        }
      }

      // Step 2 สร้าง URL สำหรับรูปใหม่
      // req.file.filename คือชื่อไฟล์ที่ Multer ตั้งให้ใหม่ตะกี้
      const avatarUrl = `http://localhost:3000/uploads/${req.file.filename}`;

      // Step 3 บันทึก URL ใหม่ลง Database
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