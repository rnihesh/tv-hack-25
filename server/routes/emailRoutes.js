const express = require("express");
const { body } = require("express-validator");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const {
  generateEmail,
  generateEmailCampaign,
  addEmails,
  getEmails,
  updateEmails,
  sendEmail,
  scheduleEmail,
  enhanceEmail,
  sendVerificationEmail,
  testEmailConfig,
} = require("../controllers/emailController");
const { protect, checkCredits } = require("../middlewares/authMiddleware");
const {
  emailGenerationValidation,
} = require("../middlewares/validator");

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

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

// @route   POST /api/email/enhance
// @desc    Enhance email content with AI
// @access  Private
router.post(
  "/enhance",
  protect,
  [
    body("description").notEmpty().withMessage("Email description is required"),
    body("subject").notEmpty().withMessage("Email subject is required"),
  ],
  enhanceEmail
);

// @route   POST /api/email/emails
// @desc    Add emails to company's email list
// @access  Private
router.post("/emails", protect, upload.single('file'), addEmails);

// @route   GET /api/email/emails
// @desc    Get company's email list
// @access  Private
router.get("/emails", protect, getEmails);

// @route   PUT /api/email/emails
// @desc    Replace company's email list
// @access  Private
router.put("/emails", protect, upload.single('file'), updateEmails);

// @route   POST /api/email/send
// @desc    Send email immediately
// @access  Private
router.post("/send", protect, sendEmail);

// @route   POST /api/email/schedule
// @desc    Schedule email for later
// @access  Private
router.post("/schedule", protect, scheduleEmail);

// @route   POST /api/email/send-verification
// @desc    Send verification email to user
// @access  Private
router.post(
  "/send-verification",
  protect,
  [
    body("userEmail").isEmail().withMessage("Valid email is required"),
    body("userName").optional().isString().withMessage("User name must be a string"),
    body("userId").optional().isString().withMessage("User ID must be a string"),
  ],
  sendVerificationEmail
);

// @route   POST /api/email/test
// @desc    Test email configuration
// @access  Private
router.post("/test", protect, testEmailConfig);

module.exports = router;
