const express = require("express");
const { body } = require("express-validator");
const {
  generateEmail,
  generateEmailCampaign,
  enhanceEmail,
  sendEmail,
  scheduleEmail,
} = require("../controllers/emailController");
const { protect } = require("../middlewares/authMiddleware");
const {
  emailGenerationValidation,
} = require("../middlewares/validator");

const router = express.Router();

<<<<<<< Updated upstream
=======
// Test route (no auth required for testing)
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Email routes are working!",
    timestamp: new Date().toISOString(),
  });
});

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

// Email enhancement validation rules
const emailEnhanceValidation = [
  body("description")
    .notEmpty()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  body("subject")
    .notEmpty()
    .isLength({ min: 3, max: 200 })
    .withMessage("Subject must be between 3 and 200 characters"),
];

// Email sending validation rules
const emailSendValidation = [
  body("subject")
    .notEmpty()
    .isLength({ min: 3, max: 200 })
    .withMessage("Subject must be between 3 and 200 characters"),
  body("message")
    .notEmpty()
    .isLength({ min: 10, max: 5000 })
    .withMessage("Message must be between 10 and 5000 characters"),
  body("recipients")
    .isArray({ min: 1 })
    .withMessage("Recipients must be an array with at least 1 recipient"),
  body("recipients.*")
    .isInt()
    .withMessage("Each recipient must be a valid customer ID"),
];

// Email scheduling validation rules
const emailScheduleValidation = [
  body("subject")
    .notEmpty()
    .isLength({ min: 3, max: 200 })
    .withMessage("Subject must be between 3 and 200 characters"),
  body("message")
    .notEmpty()
    .isLength({ min: 10, max: 5000 })
    .withMessage("Message must be between 10 and 5000 characters"),
  body("recipients")
    .isArray({ min: 1 })
    .withMessage("Recipients must be an array with at least 1 recipient"),
  body("recipients.*")
    .isInt()
    .withMessage("Each recipient must be a valid customer ID"),
  body("scheduledFor")
    .isISO8601()
    .withMessage("Scheduled time must be a valid ISO date"),
];

// @route   POST /api/email/enhance
// @desc    Enhance email content with AI
// @access  Private
router.post(
  "/enhance",
  authMiddleware,
  emailEnhanceValidation,
  enhanceEmail
);

// @route   POST /api/email/send
// @desc    Send email immediately
// @access  Private
router.post(
  "/send",
  authMiddleware,
  emailSendValidation,
  sendEmail
);

// @route   POST /api/email/schedule
// @desc    Schedule email for later
// @access  Private
router.post(
  "/schedule",
  authMiddleware,
  emailScheduleValidation,
  scheduleEmail
);

>>>>>>> Stashed changes
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
