const express = require("express");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// @route   GET /api/marketing/campaigns
// @desc    Get marketing campaigns (placeholder)
// @access  Private
router.get("/campaigns", protect, (req, res) => {
  res.json({
    success: true,
    message: "Marketing routes - Coming soon",
    data: [],
  });
});

// @route   POST /api/marketing/email
// @desc    Send email campaign (placeholder)
// @access  Private
router.post("/email", protect, (req, res) => {
  res.json({
    success: true,
    message: "Email marketing - Coming soon",
  });
});

module.exports = router;
