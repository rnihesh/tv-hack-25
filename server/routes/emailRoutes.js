const express = require("express");
const { body } = require("express-validator");
const {
  generateEmail,
  generateEmailCampaign,
} = require("../controllers/emailController");
const { protect, checkCredits } = require("../middlewares/authMiddleware");
const {
  emailGenerationValidation,
} = require("../middlewares/validator");

const router = express.Router();

// @route   POST /api/email/generate
// @desc    Generate marketing email with AI and context
// @access  Private
router.post(
  "/generate",
  protect,
  checkCredits(3), // 3 credits required for email generation
  emailGenerationValidation,
  generateEmail
);

// @route   POST /api/email/campaign
// @desc    Generate email campaign sequence with AI and context
// @access  Private
router.post(
  "/campaign",
  protect,
  checkCredits(5), // 5 credits required for email campaign
  emailGenerationValidation,
  generateEmailCampaign
);

module.exports = router;
