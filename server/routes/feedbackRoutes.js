const express = require("express");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// @route   GET /api/feedback
// @desc    Get feedback (placeholder)
// @access  Private
router.get("/", protect, (req, res) => {
  res.json({
    success: true,
    message: "Feedback routes - Coming soon",
    data: [],
  });
});

// @route   POST /api/feedback
// @desc    Submit feedback (placeholder)
// @access  Private
router.post("/", protect, (req, res) => {
  res.json({
    success: true,
    message: "Feedback submission - Coming soon",
  });
});

module.exports = router;
