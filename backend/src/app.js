const express = require("express");
const cors = require("cors");
const path = require("path"); 

// นำเข้า Routes ทั้งหมด
const authRoutes = require("./routes/auth.routes");
const trackRoutes = require("./routes/tracks.routes");
const quizRoutes = require("./routes/quiz.routes");
const adminRoutes = require("./routes/admin.routes");
const terminalRoutes = require("./routes/terminal.routes");
const lessonRoutes = require("./routes/lesson.routes");
const userRoutes = require("./routes/user.routes"); 

// นำเข้า Middleware ป้องกัน
const { verifyToken, isAdmin } = require("./middleware/auth"); 

const app = express();

// ตั้งค่า Middleware
app.use(cors());
app.use(express.json());


app.use("/uploads", express.static(path.join(__dirname, "uploads"))); 

// Logger
app.use((req, res, next) => {
  console.log("➡️ REQUEST:", req.method, req.url);
  next();
});

// ประกาศเส้นทาง API

// Routes ทั่วไป
app.use("/api/auth", authRoutes);
app.use("/api/tracks", trackRoutes);
app.use("/api/terminal", terminalRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/users", userRoutes); 

// Routes สำหรับ Admin
app.use("/api/admin", verifyToken, isAdmin, adminRoutes); 

module.exports = app;