const razorpay = require('../config/razorpay');
const Company = require('../models/Company');
const { CreditPackage, Payment, CreditTransaction } = require('../models/Subscription');
const { logger } = require('../utils/logger');
const crypto = require('crypto');
const config = require('../config/env-config');

// Define credit packages (3 plans)
const CREDIT_PACKAGES = [
  {
    id: 'starter_100',
    name: 'Starter Pack',
    displayName: 'Starter Pack - 100 Credits',
    description: 'Perfect for small businesses getting started with AI tools',
    credits: 100,
    bonusCredits: 20,
    price: 999, // ₹9.99 in paise
    currency: 'INR',
    isPopular: false,
    features: [
      '100 AI Credits',
      '20 Bonus Credits',
      'Website Generation',
      'Email Marketing',
      'Image Generation',
      'Chatbot Queries',
      'Valid for 6 months'
    ]
  },
  {
    id: 'professional_500',
    name: 'Professional Pack',
    displayName: 'Professional Pack - 500 Credits',
    description: 'Ideal for growing businesses with regular AI needs',
    credits: 500,
    bonusCredits: 150,
    price: 4999, // ₹49.99 in paise
    currency: 'INR',
    isPopular: true,
    features: [
      '500 AI Credits',
      '150 Bonus Credits',
      'All Starter features',
      'Priority Support',
      'Advanced Analytics',
      'Valid for 12 months'
    ]
  },
  {
    id: 'enterprise_1000',
    name: 'Enterprise Pack',
    displayName: 'Enterprise Pack - 1000 Credits',
    description: 'Best value for agencies and large businesses',
    credits: 1000,
    bonusCredits: 400,
    price: 8999, // ₹89.99 in paise
    currency: 'INR',
    isPopular: false,
    features: [
      '1000 AI Credits',
      '400 Bonus Credits',
      'All Professional features',
      'Custom Branding',
      'API Access',
      'Dedicated Support',
      'Valid for 12 months'
    ]
  }
];

// @desc    Get all available credit packages
// @route   GET /api/subscription/packages
// @access  Public
const getCreditPackages = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Credit packages retrieved successfully',
      data: CREDIT_PACKAGES
    });
  } catch (error) {
    logger.error('Error getting credit packages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get credit packages',
      error: error.message
    });
  }
};

// @desc    Create Razorpay order for credit purchase
// @route   POST /api/subscription/create-order
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { packageId } = req.body;
    const company = req.companyData;

    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment service unavailable. Razorpay not configured.'
      });
    }

    // Find the selected package
    const selectedPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
    if (!selectedPackage) {
      return res.status(404).json({
        success: false,
        message: 'Credit package not found'
      });
    }

    // Create Razorpay order
    const orderOptions = {
      amount: selectedPackage.price, // Amount in paise
      currency: selectedPackage.currency,
      receipt: `receipt_${company._id}_${Date.now()}`,
      notes: {
        companyId: company._id.toString(),
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        credits: selectedPackage.credits,
        bonusCredits: selectedPackage.bonusCredits
      }
    };

    const order = await razorpay.orders.create(orderOptions);

    // Save payment record
    const payment = new Payment({
      companyId: company._id,
      paymentIntentId: order.id,
      amount: selectedPackage.price / 100, // Convert paise to rupees for storage
      currency: selectedPackage.currency,
      status: 'pending',
      paymentMethod: 'razorpay',
      description: `Purchase of ${selectedPackage.displayName}`,
      metadata: {
        packageId: selectedPackage.id,
        creditsAdded: selectedPackage.credits + selectedPackage.bonusCredits,
        itemType: 'credits'
      }
    });

    await payment.save();

    logger.info(`Razorpay order created: ${order.id} for company: ${company._id}`);

    res.json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order.id,
        amount: selectedPackage.price,
        currency: selectedPackage.currency,
        package: selectedPackage,
        razorpayKeyId: config.razorpayKeyId
      }
    });
  } catch (error) {
    logger.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// @desc    Verify Razorpay payment and add credits
// @route   POST /api/subscription/verify-payment
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const company = req.companyData;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification parameters'
      });
    }

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      logger.warn(`Payment signature verification failed for company: ${company._id}`);
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Find the payment record
    const payment = await Payment.findOne({ paymentIntentId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Get package details
    const packageDetails = CREDIT_PACKAGES.find(pkg => pkg.id === payment.metadata.packageId);
    if (!packageDetails) {
      return res.status(404).json({
        success: false,
        message: 'Package details not found'
      });
    }

    // Update payment status
    payment.status = 'succeeded';
    payment.metadata.razorpayPaymentId = razorpay_payment_id;
    await payment.save();

    // Add credits to company
    const totalCredits = packageDetails.credits + packageDetails.bonusCredits;
    await company.addCredits(
      totalCredits,
      'purchase',
      `Purchased ${packageDetails.displayName}`
    );

    // Create credit transaction record
    const creditTransaction = new CreditTransaction({
      companyId: company._id,
      transactionType: 'purchased',
      service: 'purchase',
      creditsAmount: totalCredits,
      remainingCredits: company.credits.currentCredits,
      description: `Credits purchased via ${packageDetails.displayName}`,
      metadata: {
        paymentId: payment._id,
        packageId: packageDetails.id,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id
      }
    });

    await creditTransaction.save();

    logger.info(`Payment verified and credits added for company: ${company._id}, Credits: ${totalCredits}`);

    res.json({
      success: true,
      message: 'Payment verified and credits added successfully',
      data: {
        creditsAdded: totalCredits,
        currentCredits: company.credits.currentCredits,
        package: packageDetails,
        transactionId: creditTransaction._id
      }
    });
  } catch (error) {
    logger.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
};

// @desc    Handle Razorpay webhook
// @route   POST /api/subscription/webhook
// @access  Public
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpayWebhookSecret)
      .update(JSON.stringify(body))
      .digest('hex');

    if (signature !== expectedSignature) {
      logger.warn('Webhook signature verification failed');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const event = body.event;
    const paymentEntity = body.payload.payment.entity;

    logger.info(`Webhook received: ${event} for payment: ${paymentEntity.id}`);

    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(paymentEntity);
        break;
      case 'payment.failed':
        await handlePaymentFailed(paymentEntity);
        break;
      default:
        logger.info(`Unhandled webhook event: ${event}`);
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};

// Helper function to handle successful payment
const handlePaymentCaptured = async (paymentEntity) => {
  try {
    const payment = await Payment.findOne({ 
      paymentIntentId: paymentEntity.order_id 
    });

    if (payment && payment.status !== 'succeeded') {
      payment.status = 'succeeded';
      payment.metadata.razorpayPaymentId = paymentEntity.id;
      await payment.save();

      logger.info(`Payment captured via webhook: ${paymentEntity.id}`);
    }
  } catch (error) {
    logger.error('Error handling payment captured:', error);
  }
};

// Helper function to handle failed payment
const handlePaymentFailed = async (paymentEntity) => {
  try {
    const payment = await Payment.findOne({ 
      paymentIntentId: paymentEntity.order_id 
    });

    if (payment) {
      payment.status = 'failed';
      payment.description = paymentEntity.error_description || 'Payment failed';
      await payment.save();

      logger.info(`Payment failed via webhook: ${paymentEntity.id}`);
    }
  } catch (error) {
    logger.error('Error handling payment failed:', error);
  }
};

// @desc    Get company's payment history
// @route   GET /api/subscription/payments
// @access  Private
const getPaymentHistory = async (req, res) => {
  try {
    const company = req.companyData;
    const { page = 1, limit = 10 } = req.query;

    const payments = await Payment.find({ companyId: company._id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Payment.countDocuments({ companyId: company._id });

    res.json({
      success: true,
      message: 'Payment history retrieved successfully',
      data: {
        payments,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    logger.error('Error getting payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment history',
      error: error.message
    });
  }
};

// @desc    Get subscription analytics
// @route   GET /api/subscription/analytics
// @access  Private
const getSubscriptionAnalytics = async (req, res) => {
  try {
    const company = req.companyData;

    // Get total spent
    const totalSpent = await Payment.aggregate([
      { $match: { companyId: company._id, status: 'succeeded' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get credit transaction summary
    const creditStats = await CreditTransaction.aggregate([
      { $match: { companyId: company._id } },
      {
        $group: {
          _id: '$transactionType',
          total: { $sum: '$creditsAmount' }
        }
      }
    ]);

    // Get monthly spending
    const monthlySpending = await Payment.aggregate([
      { 
        $match: { 
          companyId: company._id, 
          status: 'succeeded',
          createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      message: 'Subscription analytics retrieved successfully',
      data: {
        totalSpent: totalSpent[0]?.total || 0,
        creditStats,
        monthlySpending,
        currentCredits: company.credits.currentCredits,
        totalCreditsUsed: company.credits.totalCreditsUsed
      }
    });
  } catch (error) {
    logger.error('Error getting subscription analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription analytics',
      error: error.message
    });
  }
};

module.exports = {
  getCreditPackages,
  createOrder,
  verifyPayment,
  handleWebhook,
  getPaymentHistory,
  getSubscriptionAnalytics
};
