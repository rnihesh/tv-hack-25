const mongoose = require("mongoose");

// Demo middleware for testing image generation without full auth setup
const demoAuth = (req, res, next) => {
  // Use a consistent demo company ID for testing (actual company ID from database)
  const demoObjectId = new mongoose.Types.ObjectId("688cd50afd0cbf4e61570dab");

  req.company = {
    id: demoObjectId,
    _id: demoObjectId,
    email: "ritheeshreddyandem@gmail.com",
    companyName: "Ritheesh Company",
    credits: {
      currentCredits: 100,
      totalCreditsUsed: 0,
      dailyCreditsUsed: 0,
      lastCreditReset: new Date(),
      creditHistory: [],
    },
    subscription: {
      plan: "basic",
      isActive: true,
    },
    isDemo: false, // Set to false to test real functionality
  };

  // Also set companyData for consistency
  req.companyData = req.company;

  next();
};

module.exports = demoAuth;
