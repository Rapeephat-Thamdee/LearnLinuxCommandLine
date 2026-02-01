const express = require("express");
const lessons = require("../data/lessons");

const router = express.Router();

/**
 * GET /api/lessons/:trackId
 */
router.get("/:trackId", (req, res) => {
  const { trackId } = req.params;

  const filtered = lessons.filter(
    l => l.trackId == trackId
  );

  // 🔥 LOG ตรงนี้
  console.log(
    "📘 GET LESSONS",
    "trackId =", trackId,
    "count =", filtered.length,
    "lessons =", filtered
  );

  res.json(filtered);
});

module.exports = router;
