const db = require("../db");

/* =========================
   Find by username OR email
   ========================= */
exports.findByIdentifier = async (identifier) => {
  const [rows] = await db.query(
    "SELECT * FROM users WHERE username = ? OR email = ?",
    [identifier, identifier]
  );
  return rows[0];
};

/* =========================
   Find by id (ใช้ตอน execute)
   ========================= */
exports.findById = async (id) => {
  const [rows] = await db.query(
    "SELECT * FROM users WHERE id = ?",
    [id]
  );
  return rows[0];
};

/* =========================
   Create user
   ========================= */
exports.create = async (username, email, password) => {
  await db.query(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    [username, email, password]
  );
};

/* =========================
   Update container name
   ========================= */
exports.updateContainer = async (userId, containerName) => {
  await db.query(
    "UPDATE users SET container_name = ? WHERE id = ?",
    [containerName, userId]
  );
};

exports.findByEmail = async (email) => {
  const [rows] = await db.query(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );
  return rows[0];
};
