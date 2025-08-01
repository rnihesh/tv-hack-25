const mongoose = require('mongoose');

// Demo middleware for testing image generation without full auth setup
const demoAuth = (req, res, next) => {
  // Use a consistent demo company ID for testing
  const demoObjectId = new mongoose.Types.ObjectId('60a7c1234567890123456789');
  
  req.company = {
    id: demoObjectId,
    _id: demoObjectId,
    email: 'demo@example.com',
    companyName: 'Demo Company',
    credits: 100,
    subscription: {
      plan: 'basic',
      isActive: true,
    },
    isDemo: false, // Set to false to test real functionality
  };
  
  // Also set companyData for consistency
  req.companyData = req.company;
  
  next();
};

module.exports = demoAuth;
