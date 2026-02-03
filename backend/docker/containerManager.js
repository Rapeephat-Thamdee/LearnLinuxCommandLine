const { exec } = require("child_process");

/**
 * Container Manager
 * ทำหน้าที่จัดการ Lifecycle ของ Docker Container ให้กับ User แต่ละคน
 * เปรียบเสมือนการเตรียม "เครื่องคอมพิวเตอร์จำลอง" ให้พร้อมใช้งานเสมอ
 */


//ฟังก์ชันตรวจสอบและเตรียม Container ให้พร้อมใช้งาน (Ensure Container) Concept: เช็คก่อนว่ามีของไหม -> ถ้ามีแต่ปิดก็เปิด -> ถ้าไม่มีก็สร้างใหม่
exports.ensureContainer = (userId) => {
  // ตั้งชื่อ container linux_user_<id> เพื่อจะได้รู้ว่า container นี้เป็นของใคร
  const name = `linux_user_${userId}`;
  console.log("ensureContainer called for:", name);

  return new Promise((resolve, reject) => {
    // เช็ครายชื่อ Container ทั้งหมดที่มีในระบบไม่ว่าจะที่รันอยู่และปิดไปแล้ว
    // docker ps -a = List all containers
    // --format "{{.Names}}" = เอาเฉพาะชื่อออกมา จะได้เช็คง่ายๆ แบบEz
    exec(`docker ps -a --format "{{.Names}}"`, (err, stdout) => {
      if (err) return reject(err);
      // แปลงผลลัพธ์จาก string ยาวๆ เป็น array ของชื่อ container
      const containers = stdout
        .split("\n")
        .map(s => s.trim())
        .filter(Boolean);

        // CASE 1 เจอชื่อ Container นี้อยู่แล้ว (เคยสร้างไว้)
      if (containers.includes(name)) {
        // เช็คสถานะต่อว่า เปิดอยู่ (Running) หรือ ปิดอยู่ (Stopped)
        exec(
          `docker inspect -f "{{.State.Running}}" ${name}`,
          (err2, running) => {
            if (err2) return reject(err2);

            //1.1 เครื่องเปิดอยู่แล้ว
            if (running.trim() === "true") {
              console.log("container already running:", name);
              return resolve(name); // ส่งชื่อกลับไปให้ใช้ได้เลย
            }

            //1.2 มีเครื่องแต่ปิดอยู่ -> ให้สั่ง Start
            console.log("starting container:", name);
            exec(`docker start ${name}`, (err3) => {
              if (err3) return reject(err3);
              resolve(name); // ส่งชื่อกลับไปให้ใช้ได้เลย
            });
          }
        );
        return;
      }

      
      console.log("creating new container:", name);
      // CASE 2: ยังไม่เคยมี Container นี้มาก่อน (User ใหม่)
      //เทคนิคการสร้าง Container สำหรับ Learning Environment
      // docker run -d -> รันแบบ Background (Detached)
      // --restart unless-stopped -> ถ้า Server เผลอดับ ให้ auto restart container นี้ขึ้นมาใหม่ให้ด้วย
      // tail -f /dev/null -> เทคนิคสำคัญ ปกติ Docker จะดับทันทีที่ทำคำสั่งจบ 
      
      exec(
        `docker run -d --restart unless-stopped --name ${name} linux-learning tail -f /dev/null`,
        (err4) => {
          if (err4) return reject(err4);
          resolve(name);
        }
      );
    });
  });
};


// เป็นฟังก์ชันไว้ Reset เครื่องใช้กรณีเครื่องค้างหรือตอนที่ User ต้องการเริ่มเรียนใหม่
exports.resetContainer = (userId) => {
  const name = `linux_user_${userId}`;
  console.log("resetContainer:", name);

  //ใช้ rm -f ให้ลบเครื่องทันทีถ้าเปิดอยู่ก็ไม่สนลบหมดอ่ะ
  return new Promise((resolve, reject) => {
    exec(`docker rm -f ${name}`, () => {

      // หลังจากลบเสร็จก็สร้างใหม่ด้วยคำสั่งเดิม (เหมือนใน ensureContainer)
      exec(
        `docker run -d --restart unless-stopped --name ${name} linux-learning tail -f /dev/null`,
        (err) => {
          if (err) return reject(err);
          resolve(name);
        }
      );
    });
  });
};
