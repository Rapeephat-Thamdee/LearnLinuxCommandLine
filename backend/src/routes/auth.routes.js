const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { getProgress, createProgress } = require("../models/progress.model");
// นำเข้าฟังก์ชันสำหรับจัดการ Docker
const { ensureContainer } = require("../../docker/containerManager"); 

const router = express.Router();

console.log(" Auth routes loaded");

/* ==================================================
   1. API สมัครสมาชิกใหม่ (Register)
   POST /api/auth/register
   Concept: สร้าง User -> สร้าง Progress เริ่มต้น -> จอง Docker Container
   ================================================== */
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  // Basic Validation กันข้อมูลว่างเปล่า
  if (!username || !email || !password) {
    return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  try {
    // Step 1 เช็คข้อมูลซ้ำ
    // ต้องเช็คทั้ง username และ email เพื่อไม่ให้ข้อมูลชนกันใน DB
    const existUsername = await User.findByIdentifier(username);
    if (existUsername) return res.status(400).json({ error: "Username นี้ถูกใช้แล้ว" });

    const existEmail = await User.findByEmail(email);
    if (existEmail) return res.status(400).json({ error: "Email นี้ถูกใช้แล้ว" });

    // Step 2 เข้ารหัสรหัสผ่าน (Hash Password)
    //จอมยุทธไม่เก็บpassword เป็น plain text จอมยุทธใช้ bcrypt hash 10 รอบ แบบเซียนระดับวงแหวนวิญญาณหมื่นปี
    const hashed = await bcrypt.hash(password, 10);
    await User.create(username, email, hashed);

    //Step 3 ดึง ID ของ User ที่เพิ่งสร้าง
    //เพื่อเอาไปใช้เชื่อมโยงกับตารางอื่นๆ (Progress, Docker)
    const user = await User.findByIdentifier(username);

    //Step 4 สร้าง Progress เริ่มต้น 
    // สร้าง record ในตาราง progress เพื่อให้ user เริ่มเรียนบทที่ 1 ได้เลย
    try {
      await createProgress(user.id, 1);
    } catch (progErr) {
      console.error("⚠️ Init Progress Error:", progErr);
    }

    // Step 5 สร้าง Docker Container
    // สั่ง Docker ให้สร้าง container ประจำตัว User คนนี้
    try {
      const containerName = await ensureContainer(user.id);
      // บันทึกชื่อ container กลับลง DB เพื่อให้รู้ว่า User คนนี้คู่กับเครื่องไหน
      await User.updateContainer(user.id, containerName);
    } catch (dockerErr) {
      console.error("Init Docker Error:", dockerErr);
      // ไม่ return error เพราะเราอยากให้สมัครสมาชิกสำเร็จไปก่อน
      // เดี๋ยว User กด Login เข้ามาใหม่ ระบบจะพยายาม start docker ให้อีกที
    }

    res.status(201).json({ message: "สมัครสมาชิกสำเร็จ" });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
});

/* ==================================================
   2. API เข้าสู่ระบบ (Login)
   POST /api/auth/login
   Concept: ตรวจสอบ User -> ปลุก Docker ตื่น -> แจก Token
   ================================================== */
router.post("/login", async (req, res) => {
  const { identifier, password } = req.body;

  try {
    // 1 หา User จาก username หรือ email
    const user = await User.findByIdentifier(identifier);
    if (!user) {
      return res.status(401).json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    // 2 ตรวจรหัสผ่าน
    // เอารหัสที่กรอก (password) ไปเทียบกับ hash ใน DB (user.password)
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

// 3 Docker Wake-up Call
    // User อาจจะไม่ได้ล็อกอินนาน container อาจจะ stop ไปแล้ว
    // เราต้องเรียก ensureContainer เพื่อ "Start" เครื่องให้พร้อมใช้งานทันทีที่ Login ผ่าน
    let containerName = user.container_name;
    try {
        // ส่ง user.id ไปเช็ค/สร้าง/สตาร์ท container
        const activeContainer = await ensureContainer(user.id);
        
        //ถ้าชื่อ container ใน Docker ไม่ตรงกับใน DB ให้ update DB ให้ตรงกันทันที
        if (activeContainer !== containerName) {
            await User.updateContainer(user.id, activeContainer);
            containerName = activeContainer;
        }
    } catch (dockerErr) {
        console.error("Login Docker Error:", dockerErr);
        // Login ได้ แต่เข้า Terminal ไม่ได้
    }

    // 4 Data Consistency: เช็ค Progress
    // กันเหนียว: เผื่อตอนสมัครสมาชิก (Step 4 ด้านบน) มัน error แล้วสร้าง progress ไม่สำเร็จ
    // มาสร้างใหม่ตรงนี้แทน
    try {
        const trackId = 1;
        const progress = await getProgress(user.id, trackId);
        if (!progress) {
            await createProgress(user.id, trackId);
        }
    } catch (progErr) {
        console.error("Login Progress Error:", progErr);
    }

    // 5 Generate Token (Passport)
    // สร้าง JWT สำหรับแนบไปกับทุก Request หลังจากนี้
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role //ใส่ Role ไปด้วย เพื่อใช้เช็คสิทธิ์แอดมิน
      },
      process.env.JWT_SECRET || "secret_key_ja", // Fallback กันเหนียว
      { expiresIn: "1d" } // Token มีอายุ 1 วัน
    );

    // 6 Response
    // ส่งข้อมูล User กลับไปเพื่อให้ Frontend เอาไปแสดงผล
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        container_name: containerName
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;