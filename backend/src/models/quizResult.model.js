const db = require("../db");

/**
 * บันทึกผลสอบ
 * ❌ ไม่เก็บ percent ใน DB
 */
exports.createResult = (
  userId,
  trackId,
  difficulty,
  score,
  total
) => {
  return db.execute(
    `
    INSERT INTO quiz_results
    (user_id, track_id, difficulty, score, total)
    VALUES (?, ?, ?, ?, ?)
    `,
    [
      userId,
      trackId,
      difficulty,
      score,
      total
    ]
  );
};

/**
 * ดึงผลสอบล่าสุด
 * ✅ คำนวณ percent ตอนส่งออก
 */
exports.getLatestResult = async (userId, trackId) => {
  const [rows] = await db.execute(
    `
    SELECT user_id, track_id, difficulty, score, total, created_at
    FROM quiz_results
    WHERE user_id = ? AND track_id = ?
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [userId, trackId]
  );

  if (!rows.length) return null;

  const r = rows[0];

  return {
    ...r,
    percent: Math.round((r.score / r.total) * 100)
  };
};
