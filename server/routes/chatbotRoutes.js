const express = require("express");
const { body, param } = require("express-validator");
const { protect } = require("../middlewares/authMiddleware");
const {
  processMessage,
  getConversationHistory,
  clearConversationHistory,
  processFeedbackQuery,
} = require("../controllers/chatbotController");

const router = express.Router();

/**
 * @route POST /api/chatbot/message
 * @desc Process chatbot message with company context
 * @access Private
 */
router.post(
  "/message",
  [
    body("message")
      .trim()
      .notEmpty()
      .withMessage("Message is required")
      .isLength({ min: 1, max: 1000 })
      .withMessage("Message must be between 1 and 1000 characters"),
    body("sessionId")
      .optional()
      .isString()
      .withMessage("Session ID must be a string")
      .isLength({ max: 100 })
      .withMessage("Session ID too long"),
  ],
  protect,
  processMessage
);

/**
 * @route GET /api/chatbot/history/:sessionId
 * @desc Get conversation history for a session
 * @access Private
 */
router.get(
  "/history/:sessionId",
  [
    param("sessionId")
      .isString()
      .withMessage("Session ID must be a string")
      .isLength({ min: 1, max: 100 })
      .withMessage("Invalid session ID"),
  ],
  protect,
  getConversationHistory
);

/**
 * @route DELETE /api/chatbot/history/:sessionId
 * @desc Clear conversation history for a session
 * @access Private
 */
router.delete(
  "/history/:sessionId",
  [
    param("sessionId")
      .isString()
      .withMessage("Session ID must be a string")
      .isLength({ min: 1, max: 100 })
      .withMessage("Invalid session ID"),
  ],
  protect,
  clearConversationHistory
);

/**
 * @route POST /api/chatbot/feedback
 * @desc Process feedback-related queries using the feedback analyzer
 * @access Private
 */
router.post(
  "/feedback",
  [
    body("message")
      .trim()
      .notEmpty()
      .withMessage("Message is required")
      .isLength({ min: 1, max: 1000 })
      .withMessage("Message must be between 1 and 1000 characters"),
    body("sessionId")
      .optional()
      .isString()
      .withMessage("Session ID must be a string")
      .isLength({ max: 100 })
      .withMessage("Session ID too long"),
  ],
  protect,
  processFeedbackQuery
);

module.exports = router;
