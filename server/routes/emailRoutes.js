const express = require("express");
const { body } = require("express-validator");
const {
  generateEmail,
  generateEmailCampaign,
} = require("../controllers/emailController");
const { protect } = require("../middlewares/authMiddleware");
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
  emailGenerationValidation,
  generateEmail
);

// @route   POST /api/email/campaign
// @desc    Generate email campaign sequence with AI and context
// @access  Private
router.post(
  "/campaign",
  protect,
  emailGenerationValidation,
  generateEmailCampaign
);

module.exports = router;
