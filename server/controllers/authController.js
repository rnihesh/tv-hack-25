const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const Company = require("../models/Company");
const { VectorStore } = require("../models/VectorStore");
const config = require("../config/env-config");
const logger = require("../utils/logger");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiration,
  });
};

// @desc    Register a new company
// @route   POST /api/auth/register
// @access  Public
const registerCompany = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const {
      companyName,
      email,
      password,
      businessType,
      targetAudience,
      businessDescription,
      preferences,
    } = req.body;

    // Check if company already exists
    const existingCompany = await Company.findOne({
      email: email.toLowerCase(),
    });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: "Company with this email already exists",
      });
    }

    // Create new company
    const company = new Company({
      companyName,
      email: email.toLowerCase(),
      password,
      businessType,
      targetAudience,
      businessDescription,
      preferences: {
        colorScheme: preferences?.colorScheme || "blue",
        brandStyle: preferences?.brandStyle || "modern",
        communicationTone: preferences?.communicationTone || "professional",
        marketingGoals: preferences?.marketingGoals || [],
        contentStyle: preferences?.contentStyle || "informative",
      },
    });

    // Add initial free credits
    await company.addCredits(10, "daily_bonus", "Welcome bonus credits");

    await company.save();

    // Create vector store for the company
    try {
      await VectorStore.createForCompany(company._id, company.businessType);
    } catch (vectorError) {
      logger.error("Failed to create vector store for company:", vectorError);
      // Don't fail registration if vector store creation fails
    }

    // Generate token
    const token = generateToken(company._id);

    // Remove password from response
    const companyResponse = company.toObject();
    delete companyResponse.password;

    res.status(201).json({
      success: true,
      message: "Company registered successfully",
      data: {
        company: companyResponse,
        token,
      },
    });

    logger.info(`New company registered: ${company.email}`);
  } catch (error) {
    logger.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Login company
// @route   POST /api/auth/login
// @access  Public
const loginCompany = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find company and include password for verification
    const company = await Company.findOne({
      email: email.toLowerCase(),
    }).select("+password");

    if (!company) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if company is active
    if (!company.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Please contact support.",
      });
    }

    // Verify password
    const isPasswordValid = await company.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Reset daily credits if it's a new day
    company.resetDailyCredits();

    // Add daily credits based on subscription plan
    const plans = Company.getSubscriptionPlans();
    const planCredits = plans[company.subscription.plan]?.dailyCredits || 10;

    // Check if credits were already added today
    const today = new Date().toDateString();
    const lastReset = new Date(company.credits.lastCreditReset).toDateString();

    if (today !== lastReset) {
      await company.addCredits(
        planCredits,
        "daily_bonus",
        `Daily credits for ${company.subscription.plan} plan`
      );
    }

    // Update last login
    company.lastLogin = new Date();
    await company.save();

    // Generate token
    const token = generateToken(company._id);

    // Remove password from response
    const companyResponse = company.toObject();
    delete companyResponse.password;

    res.json({
      success: true,
      message: "Login successful",
      data: {
        company: companyResponse,
        token,
      },
    });

    logger.info(`Company logged in: ${company.email}`);
  } catch (error) {
    logger.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Get current company profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const company = await Company.findById(req.company.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.json({
      success: true,
      data: { company },
    });
  } catch (error) {
    logger.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Update company profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const updateFields = {};
    const allowedFields = [
      "companyName",
      "businessType",
      "targetAudience",
      "businessDescription",
      "preferences",
      "aiContextProfile",
    ];

    // Only include allowed fields
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    });

    const company = await Company.findByIdAndUpdate(
      req.company.id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { company },
    });

    logger.info(`Company profile updated: ${company.email}`);
  } catch (error) {
    logger.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { currentPassword, newPassword } = req.body;

    const company = await Company.findById(req.company.id).select("+password");

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid =
      await company.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    company.password = newPassword;
    await company.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });

    logger.info(`Password changed for company: ${company.email}`);
  } catch (error) {
    logger.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Get company credits and usage
// @route   GET /api/auth/credits
// @access  Private
const getCredits = async (req, res) => {
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
    await company.save();

    const creditInfo = {
      currentCredits: company.credits.currentCredits,
      dailyCreditsUsed: company.credits.dailyCreditsUsed,
      totalCreditsUsed: company.credits.totalCreditsUsed,
      subscriptionPlan: company.subscription.plan,
      usage: company.usage,
      creditHistory: company.credits.creditHistory.slice(-10), // Last 10 transactions
    };

    res.json({
      success: true,
      data: creditInfo,
    });
  } catch (error) {
    logger.error("Get credits error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Private
const refreshToken = async (req, res) => {
  try {
    const company = await Company.findById(req.company.id);

    if (!company || !company.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    const token = generateToken(company._id);

    res.json({
      success: true,
      data: { token },
    });
  } catch (error) {
    logger.error("Refresh token error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

module.exports = {
  registerCompany,
  loginCompany,
  getProfile,
  updateProfile,
  changePassword,
  getCredits,
  refreshToken,
};
