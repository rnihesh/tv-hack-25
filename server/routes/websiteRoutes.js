const express = require("express");
const {
  generateWebsite,
  getMyWebsites,
  getWebsite,
  getGenerationStatus,
  getCompanyProfile,
  updateWebsite,
  deleteWebsite,
  deployWebsite,
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

// @route   GET /api/websites/status
// @desc    Get usage and credits status
// @access  Private
router.get("/status", protect, getGenerationStatus);

// @route   GET /api/websites/profile
// @desc    Get company profile
// @access  Private
router.get("/profile", protect, getCompanyProfile);

// @route   GET /api/websites/my-websites
// @desc    Get user's generated websites
// @access  Private
router.get("/my-websites", protect, paginationValidation, getMyWebsites);

// @route   POST /api/websites/generate
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

// @route   GET /api/websites/:id
// @desc    Get specific website
// @access  Private
router.get("/:id", protect, mongoIdValidation, getWebsite);

// @route   PUT /api/websites/:id
// @desc    Update website
// @access  Private
router.put("/:id", protect, mongoIdValidation, updateWebsite);

// @route   DELETE /api/websites/:id
// @desc    Delete website
// @access  Private
router.delete("/:id", protect, mongoIdValidation, deleteWebsite);

// @route   POST /api/websites/:id/deploy
// @desc    Deploy website
// @access  Private
router.post("/:id/deploy", protect, mongoIdValidation, deployWebsite);

module.exports = router;
