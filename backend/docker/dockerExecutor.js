const { exec } = require("child_process");
const { isCommandAllowed } = require("./sandbox");

/**
 * เป็นฟังก์ชันหลักสำหรับรันคำสั่ง Linux (Execute Command)
 * ทำหน้าที่: รับคำสั่ง -> ตรวจสอบความปลอดภัย -> ส่งไปรันใน Docker -> ส่งผลลัพธ์กลับ
 */
module.exports = function executeDockerCommand(command, containerName) {
  // ใช้ Promise เพื่อรอให้คำสั่งทำงานจนเสร็จ (หรือ Error) แล้วค่อยส่งค่าคืน
  return new Promise((resolve) => {
    
    // 1 Check ด่านตรวจคนเข้าเมือง
    // ก่อนจะรัน ต้องเช็คกับไฟล์ sandbox.js ก่อนว่าคำสั่งนี้ อนุญาต หรือไม่
    // ป้องกัน User ที่เป็นจอมยุทรนักแฮกสั่งลบไฟล์ระบบหรือทำอะไรแปลก แต่กันไม่หมดหรอกอิอิ
    const check = isCommandAllowed(command);
    
    // ถ้าไม่ผ่านด่าน -> ส่งข้อความเตือนกลับไปเลย ไม่ต้องรันจริง
    if (!check.ok) return resolve(check.reason);

    // 2 Prepare Command ห่อคำสั่งเตรียมส่งเข้า Docker
    // docker exec ... = สั่งให้ทำใน container นั้นๆ
    // bash -lc ...    = รันด้วย bash แบบ login shell (เพื่อให้โหลด environment variable ครบเหมือนใช้งานจริง)
    const cmd = `docker exec ${containerName} bash -lc "${command}"`;

    // 3 Execution ลงมือรันจริง!
    // timeout: 3000 = ตั้งเวลาตายไว้ 3 วินาที ถ้าเกินนี้ (เช่น user สั่ง while loop ไม่รู้จบ) ให้ตัดจบเลย กัน Server ค้าง
    exec(cmd, { timeout: 3000 }, (err, stdout, stderr) => {
      
      // กรณีเกิด Error (เช่น พิมพ์คำสั่งผิด, timeout)
      // ส่งค่า stderr (ข้อความ error จาก linux) หรือ err.message กลับไปให้ User อ่าน
      if (err) return resolve(stderr || err.message);
      
      // กรณีสำเร็จ
      // ส่งผลลัพธ์ (stdout) กลับไปแสดงบนหน้าจอ Terminal
      resolve(stdout || stderr);
    });
  });
};