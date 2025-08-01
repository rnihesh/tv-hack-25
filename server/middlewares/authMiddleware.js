const jwt = require("jsonwebtoken");
const Company = require("../models/Company");
const config = require("../config/env-config");
const logger = require("../utils/logger");

// Middleware to protect routes
const protect = async (req, res, next) => {
  let token;

  try {
    // Check for token in header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Require token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Find company and attach to request
    const company = await Company.findById(decoded.id);

    if (!company) {
      return res.status(401).json({
        success: false,
        message: "Token is not valid - company not found",
      });
    }

    if (!company.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    req.company = {
      id: company._id,
      email: company.email,
      companyName: company.companyName,
      subscription: company.subscription,
    };

    next();
  } catch (error) {
    logger.error("Auth middleware error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error in authentication",
    });
  }
};

// Middleware to check subscription plan
const checkSubscription = (requiredPlans = []) => {
  return async (req, res, next) => {
    try {
      const company = await Company.findById(req.company.id);

      if (!company) {
        return res.status(404).json({
          success: false,
          message: "Company not found",
        });
      }

      // If no specific plans required, allow all active subscriptions
      if (requiredPlans.length === 0) {
        return next();
      }

      // Check if company has required subscription
      if (!requiredPlans.includes(company.subscription.plan)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required subscription plan: ${requiredPlans.join(" or ")}`,
          currentPlan: company.subscription.plan,
        });
      }

      // Check if subscription is active
      if (company.subscription.status !== "active") {
        return res.status(403).json({
          success: false,
          message: "Subscription is not active",
          subscriptionStatus: company.subscription.status,
        });
      }

      next();
    } catch (error) {
      logger.error("Subscription check error:", error);
      res.status(500).json({
        success: false,
        message: "Server error checking subscription",
      });
    }
  };
};

// Middleware to check credits
const checkCredits = (requiredCredits) => {
  return async (req, res, next) => {
    try {
      const company = await Company.findById(req.company.id);

      if (!company) {
        return res.status(404).json({
          success: false,
          message: "Company not found",
        });
      }

      // Reset daily credits if needed
      company.resetDailyCredits();

      if (!company.hasCredits(requiredCredits)) {
        return res.status(403).json({
          success: false,
          message: "Insufficient credits",
          requiredCredits,
          currentCredits: company.credits.currentCredits,
        });
      }

      // Store company object for use in controllers
      req.companyData = company;

      next();
    } catch (error) {
      logger.error("Credits check error:", error);
      res.status(500).json({
        success: false,
        message: "Server error checking credits",
      });
    }
  };
};

// Middleware to check usage limits
const checkUsageLimit = (serviceType, dailyLimit = null) => {
  return async (req, res, next) => {
    try {
      const company = await Company.findById(req.company.id);

      if (!company) {
        return res.status(404).json({
          success: false,
          message: "Company not found",
        });
      }

      // Get subscription plan limits
      const plans = Company.getSubscriptionPlans();
      const planLimits = plans[company.subscription.plan];

      if (!planLimits) {
        return res.status(403).json({
          success: false,
          message: "Invalid subscription plan",
        });
      }

      // Check specific service limits
      let currentUsage = 0;
      let limit = dailyLimit;

      switch (serviceType) {
        case "website":
          currentUsage = company.usage.websitesGenerated;
          limit = limit || planLimits.features.websiteTemplates;
          break;
        case "email":
          currentUsage = company.usage.emailsSent;
          limit = limit || planLimits.features.emailCampaigns;
          break;
        case "image":
          currentUsage = company.usage.imagesGenerated;
          limit = limit || planLimits.features.imageGenerations;
          break;
        case "chatbot":
          currentUsage = company.usage.chatbotQueries;
          limit = limit || planLimits.features.chatbotQueries;
          break;
        case "vector_search":
          currentUsage = company.usage.vectorSearches;
          limit = limit || planLimits.features.vectorSearchLimit;
          break;
        default:
          return next(); // No limit checking for unknown services
      }

      // -1 means unlimited
      if (limit !== -1 && currentUsage >= limit) {
        return res.status(403).json({
          success: false,
          message: `${serviceType} usage limit exceeded`,
          currentUsage,
          limit,
          subscriptionPlan: company.subscription.plan,
        });
      }

      req.companyData = company;
      next();
    } catch (error) {
      logger.error("Usage limit check error:", error);
      res.status(500).json({
        success: false,
        message: "Server error checking usage limits",
      });
    }
  };
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  let token;

  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const company = await Company.findById(decoded.id);

    if (company && company.isActive) {
      req.company = {
        id: company._id,
        email: company.email,
        companyName: company.companyName,
        subscription: company.subscription,
      };
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without authentication
    next();
  }
};

module.exports = {
  protect,
  checkSubscription,
  checkCredits,
  checkUsageLimit,
  optionalAuth,
};
