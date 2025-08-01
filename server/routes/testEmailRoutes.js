const express = require("express");
const { body } = require("express-validator");
const {
  enhanceEmail,
  sendEmail,
  scheduleEmail,
} = require("../testEmailController");

const router = express.Router();

// Mock auth middleware for testing
const mockAuth = (req, res, next) => {
  req.companyData = {
    _id: "test-company-id",
    email: "test@company.com",
    businessInfo: {
      businessName: "Test Company",
      businessType: "Technology",
      description: "Test company for development"
    },
    preferences: {
      communicationTone: "professional"
    }
  };
  next();
};

// Test route (no auth required for testing)
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Email routes are working!",
    timestamp: new Date().toISOString(),
  });
});

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
  mockAuth,
  emailEnhanceValidation,
  enhanceEmail
);

// @route   POST /api/email/send
// @desc    Send email immediately
// @access  Private
router.post(
  "/send",
  mockAuth,
  emailSendValidation,
  sendEmail
);

// @route   POST /api/email/schedule
// @desc    Schedule email for later
// @access  Private
router.post(
  "/schedule",
  mockAuth,
  emailScheduleValidation,
  scheduleEmail
);

module.exports = router;
