const db = require("../db");

/* =========================
   GET PROGRESS (user + track)
   ========================= */
exports.getProgress = async (userId, trackId) => {
  const [rows] = await db.query(
    "SELECT * FROM progress WHERE user_id = ? AND track_id = ?",
    [userId, trackId]
  );
  return rows[0];
};


/* =========================
   CREATE PROGRESS
   ========================= */
exports.createProgress = async (userId, trackId = 1) => {
  await db.query(
    "INSERT INTO progress (user_id, track_id, current_lesson) VALUES (?, ?, 0)",
    [userId, trackId]
  );
};

/* =========================
   UPDATE PROGRESS
   ========================= */
exports.updateProgress = async (userId, trackId, lesson) => {
  await db.query(
    "UPDATE progress SET current_lesson = ? WHERE user_id = ? AND track_id = ?",
    [lesson, userId, trackId]
  );
};
