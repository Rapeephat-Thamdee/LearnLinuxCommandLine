const express = require("express");
const tracks = require("../data/tracks");

const router = express.Router();

router.get("/", (req, res) => {
  res.json(tracks);
});

module.exports = router;
