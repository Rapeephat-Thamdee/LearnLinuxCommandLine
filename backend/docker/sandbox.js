// คำสั่งที่ "อนุญาต" (อัปเดตให้ครบตามบทเรียน Track 1-3)
const ALLOWED_COMMANDS = [
  // Track 1: Beginner
  "pwd", "ls", "cd", "mkdir", "touch", 
  "cp", "mv", "rm", "clear", "man",
  
  // Track 2: Intermediate
  "cat", "less", "head", "tail", "grep", 
  "find", "echo", "wc", "sort",
  
  // Track 3: Advanced
  "chmod", "chown", "ps", "top", "kill", 
  "tar", "df", "du", "ping", "curl", "wget", "alias",
  
  // อื่นๆ ที่จำเป็น
  "whoami", "date", "history"
];

// คำสั่งที่ "ห้ามเด็ดขาด" (เอาคำสั่งที่ต้องเรียนออกแล้ว)
const BLOCKED_KEYWORDS = [
  "shutdown",
  "reboot",
  "init 0",
  "mkfs",       // ฟอร์แมตดิสก์
  "dd",         // เขียนไฟล์ระดับ low-level (อันตรายถ้าใช้ไม่เป็น)
  ":(){",       // fork bomb (ทำให้เครื่องค้าง)
  ">/dev/sda",  // เขียนทับ harddisk
  "mv /",       // ย้าย root (พังแน่)
  "rm -rf /"    // ลบทั้งจักรวาล (แม้ docker จะกันได้บ้างแต่กันไว้ก่อนดีกว่า)
];

exports.isCommandAllowed = (command) => {
  if (!command) return { ok: false, reason: "Empty command" };

  const cmd = command.trim();

  // 1. เช็ก Keyword อันตรายก่อน
  if (BLOCKED_KEYWORDS.some(k => cmd.includes(k))) {
    return { ok: false, reason: "⚠️ Command not allowed (Dangerous)" };
  }

  // 2. แยกคำสั่งหลัก (ตัวแรก)
  const parts = cmd.split(" ");
  const base = parts[0];

  // 3. รองรับกรณีใช้ Pipe (|) เช่น cat file | grep word
  // ต้องเช็คทุกคำสั่งย่อยที่มี | คั่น
  if (cmd.includes("|")) {
    const subCommands = cmd.split("|");
    for (let sub of subCommands) {
      const subBase = sub.trim().split(" ")[0];
      if (!ALLOWED_COMMANDS.includes(subBase) && subBase !== "") {
         return { 
           ok: false, 
           reason: `❌ คำสั่ง "${subBase}" ยังไม่รองรับในบทเรียนนี้` 
         };
      }
    }
    return { ok: true };
  }

  // 4. เช็คคำสั่งปกติ
  if (!ALLOWED_COMMANDS.includes(base)) {
    return {
      ok: false,
      reason: `❌ คำสั่ง "${base}" ยังไม่รองรับในบทเรียนนี้`
    };
  }

  return { ok: true };
};