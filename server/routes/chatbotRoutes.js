const express = require('express');
const { body, param } = require('express-validator');
const authMiddleware = require('../middlewares/authMiddleware');
const {
  processMessage,
  getConversationHistory,
  clearConversationHistory
} = require('../controllers/chatbotController');

const router = express.Router();

// Apply auth middleware to all routes
const demoAuth = require("../middlewares/demoAuth");

/**
 * @route POST /api/chatbot/message
 * @desc Process chatbot message with company context
 * @access Private
 */
router.post('/message', [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('sessionId')
    .optional()
    .isString()
    .withMessage('Session ID must be a string')
    .isLength({ max: 100 })
    .withMessage('Session ID too long')
], demoAuth, processMessage);

/**
 * @route GET /api/chatbot/history/:sessionId
 * @desc Get conversation history for a session
 * @access Private
 */
router.get('/history/:sessionId', [
  param('sessionId')
    .isString()
    .withMessage('Session ID must be a string')
    .isLength({ min: 1, max: 100 })
    .withMessage('Invalid session ID')
], demoAuth, getConversationHistory);

/**
 * @route DELETE /api/chatbot/history/:sessionId
 * @desc Clear conversation history for a session
 * @access Private
 */
router.delete('/history/:sessionId', [
  param('sessionId')
    .isString()
    .withMessage('Session ID must be a string')
    .isLength({ min: 1, max: 100 })
    .withMessage('Invalid session ID')
], demoAuth, clearConversationHistory);

module.exports = router;
