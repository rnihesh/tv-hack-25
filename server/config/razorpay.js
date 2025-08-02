const Razorpay = require('razorpay');
const config = require('./env-config');
const { logger } = require('../utils/logger');

let razorpayInstance = null;

try {
  if (config.razorpayKeyId && config.razorpayKeySecret) {
    razorpayInstance = new Razorpay({
      key_id: config.razorpayKeyId,
      key_secret: config.razorpayKeySecret,
    });
    logger.info('Razorpay initialized successfully');
  } else {
    logger.warn('Razorpay credentials not found. Razorpay features will be disabled.');
  }
} catch (error) {
  logger.error('Failed to initialize Razorpay:', error);
}

module.exports = razorpayInstance;
