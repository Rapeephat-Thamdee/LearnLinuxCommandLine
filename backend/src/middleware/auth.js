const jwt = require("jsonwebtoken");

// Middleware ตรวจสอบว่า Login หรือยัง
exports.verifyToken = (req, res, next) => {
  // 1. ดึง Token จาก Header
  // รองรับทั้งแบบส่งมาแค่ token หรือส่งแบบ "Bearer <token>"
  const authHeader = req.headers["authorization"];
  
  if (!authHeader) {
    return res.status(403).json({ error: "No token provided" });
  }

  // ตัดคำว่า "Bearer " ออกถ้ามี
  const token = authHeader.startsWith("Bearer ") 
    ? authHeader.slice(7, authHeader.length) 
    : authHeader;

  if (!token) {
    return res.status(403).json({ error: "A token is required for authentication" });
  }

  try {
    // 2. ตรวจสอบความถูกต้องของ Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. ถ้าผ่าน ให้ยัดข้อมูล user ใส่ req.user เพื่อส่งไปใช้ต่อ
    req.user = decoded;
    
    next(); // ไปทำงานฟังก์ชันถัดไป (เช่น api/submit)
  } catch (err) {
    return res.status(401).json({ error: "Invalid Token" });
  }
};

// Middleware ตรวจสอบว่าเป็น Admin ไหม (ใช้คู่กับ verifyToken)
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
};