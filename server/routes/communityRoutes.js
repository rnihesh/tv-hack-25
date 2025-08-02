const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { body, validationResult } = require('express-validator');
const communityController = require('../controllers/communityController');

// Middleware to check validation results
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Get all community messages
router.get('/messages', protect, communityController.getMessages);

// Post a new community message
router.post('/messages', 
  protect,
  [
    body('content')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Content must be between 1 and 1000 characters'),
    body('topics')
      .optional()
      .isArray()
      .withMessage('Topics must be an array')
  ],
  checkValidation,
  communityController.postMessage
);

// Get messages by topic/tag
router.get('/messages/topic/:topic', protect, communityController.getMessagesByTopic);

// Like/unlike a message
router.post('/messages/:messageId/like', protect, communityController.toggleLike);

// Delete a message (only by author)
router.delete('/messages/:messageId', protect, communityController.deleteMessage);

// Get community stats
router.get('/stats', protect, communityController.getCommunityStats);

module.exports = router;
