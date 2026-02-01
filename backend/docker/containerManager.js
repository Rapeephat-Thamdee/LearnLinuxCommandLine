const { exec } = require("child_process");

/**
 * Ensure docker container for user
 * - มี → ถ้า stop ให้ start
 * - ไม่มี → create ใหม่ (มี process ค้าง)
 */
exports.ensureContainer = (userId) => {
  const name = `linux_user_${userId}`;
  console.log("🐳 ensureContainer called for:", name);

  return new Promise((resolve, reject) => {
    // 1️⃣ list containers ทั้งหมด
    exec(`docker ps -a --format "{{.Names}}"`, (err, stdout) => {
      if (err) return reject(err);

      const containers = stdout
        .split("\n")
        .map(s => s.trim())
        .filter(Boolean);

      // =========================
      // CASE 1: มี container แล้ว
      // =========================
      if (containers.includes(name)) {
        exec(
          `docker inspect -f "{{.State.Running}}" ${name}`,
          (err2, running) => {
            if (err2) return reject(err2);

            // รันอยู่แล้ว
            if (running.trim() === "true") {
              console.log("🐳 container already running:", name);
              return resolve(name);
            }

            // ยังไม่รัน → start
            console.log("🐳 starting container:", name);
            exec(`docker start ${name}`, (err3) => {
              if (err3) return reject(err3);
              resolve(name);
            });
          }
        );
        return;
      }

      // =========================
      // CASE 2: ยังไม่มี container
      // =========================
      console.log("🐳 creating new container:", name);
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

/**
 * Reset container (ลบแล้วสร้างใหม่)
 */
exports.resetContainer = (userId) => {
  const name = `linux_user_${userId}`;
  console.log("🔄 resetContainer:", name);

  return new Promise((resolve, reject) => {
    exec(`docker rm -f ${name}`, () => {
      // ไม่สนว่ามีหรือไม่ → สร้างใหม่
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
