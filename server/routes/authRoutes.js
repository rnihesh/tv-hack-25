const express = require("express");
const {
  registerCompany,
  loginCompany,
  getProfile,
  updateProfile,
  changePassword,
  getCredits,
  refreshToken,
} = require("../controllers/authController");

const { protect } = require("../middlewares/authMiddleware");
const {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
} = require("../middlewares/validator");

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new company
// @access  Public
router.post("/register", registerValidation, registerCompany);

// @route   POST /api/auth/login
// @desc    Login company
// @access  Public
router.post("/login", loginValidation, loginCompany);

// @route   GET /api/auth/profile
// @desc    Get current company profile
// @access  Private
router.get("/profile", protect, getProfile);

// @route   PUT /api/auth/profile
// @desc    Update company profile
// @access  Private
router.put("/profile", protect, updateProfileValidation, updateProfile);

// @route   PUT /api/auth/change-password
// @desc    Change password
// @access  Private
router.put(
  "/change-password",
  protect,
  changePasswordValidation,
  changePassword
);

// @route   GET /api/auth/credits
// @desc    Get company credits and usage
// @access  Private
router.get("/credits", protect, getCredits);

// @route   POST /api/auth/refresh
// @desc    Refresh token
// @access  Private
router.post("/refresh", protect, refreshToken);

module.exports = router;
