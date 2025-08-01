const express = require("express");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// @route   GET /api/media/images
// @desc    Get generated images (placeholder)
// @access  Private
router.get("/images", protect, (req, res) => {
  res.json({
    success: true,
    message: "Media routes - Coming soon",
    data: [],
  });
});

// @route   POST /api/media/generate-image
// @desc    Generate image (placeholder)
// @access  Private
router.post("/generate-image", protect, (req, res) => {
  res.json({
    success: true,
    message: "Image generation - Coming soon",
  });
});

module.exports = router;
