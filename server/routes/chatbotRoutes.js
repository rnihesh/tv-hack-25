const express = require("express");
const { body } = require("express-validator");
const {
  protect,
  checkCredits,
  checkUsageLimit,
} = require("../middlewares/authMiddleware");

const {
  generateResponse,
  trainChatbot,
  analyzeConversations,
} = require("../controllers/chatbotController");

const router = express.Router();

// Chatbot response validation rules
const chatbotResponseValidation = [
  body("userMessage")
    .notEmpty()
    .isLength({ min: 1, max: 1000 })
    .withMessage("User message must be between 1 and 1000 characters"),
  body("conversationId")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Conversation ID too long"),
  body("customerInfo")
    .optional()
    .isObject()
    .withMessage("Customer info must be an object"),
  body("intent")
    .optional()
    .isIn([
      "inquiry",
      "support",
      "complaint",
      "purchase",
      "information",
      "booking",
      "general",
    ])
    .withMessage("Invalid intent"),
];

// Chatbot training validation rules
const chatbotTrainingValidation = [
  body("trainingData")
    .optional()
    .isArray()
    .withMessage("Training data must be an array"),
  body("businessInfo")
    .optional()
    .isObject()
    .withMessage("Business info must be an object"),
  body("faqData").optional().isArray().withMessage("FAQ data must be an array"),
  body("productInfo")
    .optional()
    .isArray()
    .withMessage("Product info must be an array"),
];

// Conversation analysis validation rules
const conversationAnalysisValidation = [
  body("timeRange")
    .optional()
    .isObject()
    .withMessage("Time range must be an object"),
  body("conversationIds")
    .optional()
    .isArray()
    .withMessage("Conversation IDs must be an array"),
  body("analysisType")
    .optional()
    .isIn([
      "comprehensive",
      "sentiment",
      "intent",
      "performance",
      "satisfaction",
    ])
    .withMessage("Invalid analysis type"),
];

// @route   POST /api/chatbot/respond
// @desc    Generate contextual chatbot response
// @access  Private
router.post(
  "/respond",
  protect, // Use protect instead of authMiddleware
  checkCredits(1), // Assuming 1 credit required for response
  chatbotResponseValidation,
  generateResponse
);

// @route   POST /api/chatbot/train
// @desc    Train chatbot with business-specific context
// @access  Private
router.post(
  "/train",
  protect, // Use protect instead of authMiddleware
  checkCredits(5), // Assuming 5 credits required for training
  chatbotTrainingValidation,
  trainChatbot
);

// @route   POST /api/chatbot/analyze
// @desc    Analyze conversation patterns and insights
// @access  Private
router.post(
  "/analyze",
  protect, // Use protect instead of authMiddleware
  checkCredits(2), // Assuming 2 credits required for analysis
  conversationAnalysisValidation,
  analyzeConversations
);

module.exports = router;
