const app = require("./app");

// ใช้ PORT จาก env หรือถ้าไม่มีให้ใช้ 3000
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});