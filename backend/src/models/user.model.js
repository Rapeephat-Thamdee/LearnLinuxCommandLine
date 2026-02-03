const db = require("../db");

/**
 *  Model User
 * ทำหน้าที่ติดต่อกับ Database ตาราง 'users' โดยเฉพาะ
 * ใช้หลักการ Prepared Statement (เครื่องหมาย ?) เพื่อป้องกัน SQL Injection
 */

/* =========================
   1. ฟังก์ชันสำหรับ Login (Find by username OR email)
   ========================= */
// ใช้ตอน User กรอกข้อมูลหน้า Login ระบบจะเช็คว่าสิ่งที่กรอกมา
// ตรงกับ username หรือ email ในฐานข้อมูลหรือไม่
exports.findByIdentifier = async (identifier) => {
  // const [rows] -> เป็นการดึงเฉพาะข้อมูลแถวออกมา (destructuring) จาก library mysql2
  const [rows] = await db.query(
    "SELECT * FROM users WHERE username = ? OR email = ?",
    [identifier, identifier]
  );
  return rows[0];
};

/* =========================
   2. ฟังก์ชันดึงข้อมูล User ด้วย ID (Find by ID)
   ========================= */
exports.findById = async (id) => {
  const [rows] = await db.query(
    "SELECT * FROM users WHERE id = ?",
    [id]
  );
  return rows[0];
};

/* =========================
   3. ฟังก์ชันสมัครสมาชิก (Create User)
   ========================= */
// บันทึกข้อมูลสมาชิกใหม่ลง Database
exports.create = async (username, email, password) => {
  await db.query(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    [username, email, password]
  );
};

/* =========================
   4. ฟังก์ชันผูก Container กับ User (Update Container)
   ========================= */
// สำคัญมาก! ใช้หลังจากสั่ง Docker สร้าง container เสร็จแล้ว (ในไฟล์ containerManager.js)
// เราต้องเอาชื่อ container มาแปะไว้ที่ตัว User เพื่อให้รู้ว่า User คนนี้เป็นเจ้าของเครื่องไหน
exports.updateContainer = async (userId, containerName) => {
  await db.query(
    "UPDATE users SET container_name = ? WHERE id = ?",
    [containerName, userId]
  );
};


/* =========================
   5. ฟังก์ชันเช็คอีเมลซ้ำ (Find by Email)
   ========================= */
// ใช้ตอน Register เพื่อตรวจสอบว่าอีเมลนี้มีคนใช้ไปหรือยัง
exports.findByEmail = async (email) => {
  const [rows] = await db.query(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );
  return rows[0];
};
