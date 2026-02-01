const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { getProgress, createProgress } = require("../models/progress.model");
// ตรวจสอบ path ของ docker manager ให้ถูกต้องตามโปรเจกต์คุณ
const { ensureContainer } = require("../../docker/containerManager"); 

const router = express.Router();

console.log("✅ Auth routes loaded");

/* =========================
   POST : Register
   ========================= */
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  try {
    // 🔎 1. เช็คข้อมูลซ้ำ
    const existUsername = await User.findByIdentifier(username);
    if (existUsername) return res.status(400).json({ error: "Username นี้ถูกใช้แล้ว" });

    const existEmail = await User.findByEmail(email);
    if (existEmail) return res.status(400).json({ error: "Email นี้ถูกใช้แล้ว" });

    // 🔐 2. Hash Password & Create User
    const hashed = await bcrypt.hash(password, 10);
    await User.create(username, email, hashed);

    // 👉 3. ดึง User ที่เพิ่งสร้างมาเพื่อเอา ID
    const user = await User.findByIdentifier(username);

    // 📘 4. สร้าง Progress เริ่มต้น (Beginner)
    // ใส่ try-catch ย่อย เพื่อไม่ให้ error เล็กน้อยทำลาย process การสมัคร
    try {
      await createProgress(user.id, 1);
    } catch (progErr) {
      console.error("⚠️ Init Progress Error:", progErr);
    }

    // 🐳 5. สร้าง Docker Container
    try {
      const containerName = await ensureContainer(user.id);
      await User.updateContainer(user.id, containerName);
    } catch (dockerErr) {
      console.error("⚠️ Init Docker Error:", dockerErr);
      // ไม่ return error เพราะเราอยากให้สมัครสมาชิกสำเร็จไปก่อน
      // เดี๋ยว User กด Login เข้ามาใหม่ ระบบจะพยายาม start docker ให้อีกที
    }

    res.status(201).json({ message: "สมัครสมาชิกสำเร็จ" });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
});

/* =========================
   POST : Login
   ========================= */
router.post("/login", async (req, res) => {
  const { identifier, password } = req.body;

  try {
    // 1️⃣ หา User
    const user = await User.findByIdentifier(identifier);
    if (!user) {
      return res.status(401).json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    // 2️⃣ ตรวจ Password
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    // 3️⃣ Ensure Docker Container (สำคัญมาก!)
    // แก้ไข: เรียก ensureContainer เสมอ เพื่อ Start container ที่อาจจะ Stop ไปแล้ว
    let containerName = user.container_name;
    try {
        // ส่ง user.id ไปเช็ค/สร้าง/สตาร์ท container
        const activeContainer = await ensureContainer(user.id);
        
        // ถ้าชื่อเปลี่ยนไป หรือเดิมไม่มีชื่อ ให้มัปเดต DB
        if (activeContainer !== containerName) {
            await User.updateContainer(user.id, activeContainer);
            containerName = activeContainer;
        }
    } catch (dockerErr) {
        console.error("⚠️ Login Docker Error:", dockerErr);
        // Login ได้ แต่เข้า Terminal ไม่ได้ (Frontend อาจต้องแจ้งเตือน)
    }

    // 4️⃣ Ensure Progress
    try {
        const trackId = 1;
        const progress = await getProgress(user.id, trackId);
        if (!progress) {
            await createProgress(user.id, trackId);
        }
    } catch (progErr) {
        console.error("⚠️ Login Progress Error:", progErr);
    }

    // 5️⃣ สร้าง JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role // ✅ Role สำหรับ Middleware
      },
      process.env.JWT_SECRET || "secret_key_ja", // Fallback กันเหนียว
      { expiresIn: "1d" }
    );

    // 6️⃣ ส่ง Response
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url, // ✅ ส่งรูปโปรไฟล์กลับไปด้วย
        container_name: containerName
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;