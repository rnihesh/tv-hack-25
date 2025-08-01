const express = require("express");
const {
  generateWebsite,
  getMyWebsites,
  getWebsite,
  updateWebsite,
  deleteWebsite,
} = require("../controllers/websiteController");

const {
  protect,
  checkCredits,
  checkUsageLimit,
} = require("../middlewares/authMiddleware");
const {
  websiteGenerationValidation,
  mongoIdValidation,
  paginationValidation,
} = require("../middlewares/validator");

const router = express.Router();

// @route   POST /api/website/generate
// @desc    Generate website content using AI
// @access  Private
router.post(
  "/generate",
  protect,
  checkCredits(5), // 5 credits required for website generation
  checkUsageLimit("website"),
  websiteGenerationValidation,
  generateWebsite
);

// @route   GET /api/website/my-websites
// @desc    Get user's generated websites
// @access  Private
router.get("/my-websites", protect, paginationValidation, getMyWebsites);

// @route   GET /api/website/:id
// @desc    Get specific website
// @access  Private
router.get("/:id", protect, mongoIdValidation, getWebsite);

// @route   PUT /api/website/:id
// @desc    Update website
// @access  Private
router.put("/:id", protect, mongoIdValidation, updateWebsite);

// @route   DELETE /api/website/:id
// @desc    Delete website
// @access  Private
router.delete("/:id", protect, mongoIdValidation, deleteWebsite);

module.exports = router;
