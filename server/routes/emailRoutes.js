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

// Email generation validation rules
const emailGenerationValidation = [
  body("emailType")
    .isIn([
      "promotional",
      "welcome",
      "newsletter",
      "follow-up",
      "announcement",
      "product-launch",
    ])
    .withMessage("Invalid email type"),
  body("targetAudience")
    .notEmpty()
    .isLength({ min: 3, max: 200 })
    .withMessage("Target audience must be between 3 and 200 characters"),
  body("campaignGoal")
    .notEmpty()
    .isLength({ min: 5, max: 300 })
    .withMessage("Campaign goal must be between 5 and 300 characters"),
  body("productService")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Product/service description too long"),
  body("tone")
    .optional()
    .isIn([
      "professional",
      "friendly",
      "casual",
      "formal",
      "persuasive",
      "informative",
    ])
    .withMessage("Invalid tone"),
  body("callToAction")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Call to action too long"),
];

// Email campaign validation rules
const emailCampaignValidation = [
  body("campaignType")
    .isIn([
      "onboarding",
      "nurture",
      "sales",
      "retention",
      "reactivation",
      "product-education",
    ])
    .withMessage("Invalid campaign type"),
  body("sequenceLength")
    .optional()
    .isInt({ min: 2, max: 10 })
    .withMessage("Sequence length must be between 2 and 10"),
  body("targetAudience")
    .notEmpty()
    .isLength({ min: 3, max: 200 })
    .withMessage("Target audience must be between 3 and 200 characters"),
  body("campaignGoal")
    .notEmpty()
    .isLength({ min: 5, max: 300 })
    .withMessage("Campaign goal must be between 5 and 300 characters"),
  body("productService")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Product/service description too long"),
  body("tone")
    .optional()
    .isIn([
      "professional",
      "friendly",
      "casual",
      "formal",
      "persuasive",
      "informative",
    ])
    .withMessage("Invalid tone"),
];

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
