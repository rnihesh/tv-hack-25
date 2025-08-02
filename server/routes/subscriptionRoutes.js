const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  getCreditPackages,
  createOrder,
  verifyPayment,
  handleWebhook,
  getPaymentHistory,
  getSubscriptionAnalytics
} = require('../controllers/subscriptionController');

const { protect } = require('../middlewares/authMiddleware');
const { logger } = require('../utils/logger');

// Validation middleware
const checkValidation = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// @route   GET /api/subscription/packages
// @desc    Get all available credit packages
// @access  Public
router.get('/packages', getCreditPackages);

// @route   POST /api/subscription/create-order
// @desc    Create Razorpay order for credit purchase
// @access  Private
router.post('/create-order', [
  protect,
  body('packageId')
    .notEmpty()
    .withMessage('Package ID is required')
    .isIn(['starter_100', 'professional_500', 'enterprise_1000'])
    .withMessage('Invalid package ID'),
  checkValidation
], createOrder);

// @route   POST /api/subscription/verify-payment
// @desc    Verify Razorpay payment and add credits
// @access  Private
router.post('/verify-payment', [
  protect,
  body('razorpay_order_id')
    .notEmpty()
    .withMessage('Razorpay order ID is required'),
  body('razorpay_payment_id')
    .notEmpty()
    .withMessage('Razorpay payment ID is required'),
  body('razorpay_signature')
    .notEmpty()
    .withMessage('Razorpay signature is required'),
  checkValidation
], verifyPayment);

// @route   POST /api/subscription/webhook
// @desc    Handle Razorpay webhook events
// @access  Public (but secured with signature verification)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// @route   GET /api/subscription/payments
// @desc    Get company's payment history
// @access  Private
router.get('/payments', protect, getPaymentHistory);

// @route   GET /api/subscription/analytics
// @desc    Get subscription analytics
// @access  Private
router.get('/analytics', protect, getSubscriptionAnalytics);

module.exports = router;
