const exp = require("express");
const userApp = exp.Router();

const expressAsyncHandler = require("express-async-handler");
const createUser = require("./createUser.js");

const User = require("../models/user.prod.model.js");
require("dotenv").config();

// Import the email utilities
const {
  sendVerificationEmail,
  generateVerifyCode,
  setVerifyCodeExpiry,
  setNextResendTime,
  canResendOTP,
} = require("../utils/sendMail.js");


//creating user
userApp.post("/user", expressAsyncHandler(createUser));

//verify user check
userApp.get(
  "/verify",
  expressAsyncHandler(async (req, res) => {
    const { email } = req.query;

    // Check if email is provided
    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }

    const result = await User.findOne({ email: email });

    // Check if user exists
    if (!result) {
      return res.status(404).send({ message: "User not found" });
    }

    if (result.isVerified === true) {
      return res.status(200).send({
        message: true,
        payload: result,
      });
    } else {
      return res.status(200).send({
        message: false,
        payload: result,
      });
    }
  })
);

//to verify
userApp.post(
  "/verifyuser",
  expressAsyncHandler(async (req, res) => {
    const email = req.body.email || req.query.email;
    const code = req.body.code || req.query.code;

    if (!email || !code) {
      return res
        .status(400)
        .send({ message: "Email and verification code are required" });
    }

    const user = await User.findOne({ email: email });

    // Check if user exists
    if (!user) {
      return res
        .status(404)
        .send({ message: "User not found", payload: false });
    }

    // Check if verification code has expired
    const currentTime = new Date();
    if (!user.verifyCodeExpiry || currentTime > user.verifyCodeExpiry) {
      // Determine if user can request a new OTP right now
      const canRequestNewOtp =
        !user.resendCode || currentTime > user.resendCode;

      return res.status(410).send({
        message: "Verification code has expired. Please request a new one.",
        payload: false,
        expired: true,
        canResend: canRequestNewOtp,
        // If they can't resend now, tell them when they can
        nextResendTime: canRequestNewOtp ? null : user.resendCode,
      });
    }

    // Verify the code
    if (parseInt(code) === user.verifyCode) {
      user.isVerified = true;
      await user.save();
      return res
        .status(200)
        .send({ message: "Account verified successfully", payload: true });
    } else {
      return res
        .status(400)
        .send({ message: "Invalid verification code", payload: false });
    }
  })
);

// Complete the resendOtp endpoint
userApp.post(
  "/resendotp",
  expressAsyncHandler(async (req, res) => {
    const email = req.body.email;
    const userId = req.body.userId;

    if (!email || !userId) {
      return res.status(400).send({
        message: "Email and user ID are required",
      });
    }

    try {
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).send({
          message: "User not found",
        });
      }

      if (user.email !== email) {
        return res.status(400).send({
          message: "Email does not match user record",
        });
      }

      // Check if already verified
      if (user.isVerified) {
        return res.status(400).send({
          message: "User is already verified",
        });
      }

      // Check if user can resend OTP based on resendCode Date field
      if (!canResendOTP(user)) {
        const waitTime = user.resendCode - new Date();
        const hoursToWait = Math.ceil(waitTime / (1000 * 60 * 60));

        return res.status(429).send({
          message: `You can request another OTP in ${hoursToWait} hour(s)`,
          nextResendTime: user.resendCode,
        });
      }

      const currentTime = new Date();

      // Check if the verification code has expired
      const codeExpired =
        !user.verifyCodeExpiry || currentTime > user.verifyCodeExpiry;

      // Generate new verification code and update expiry
      const newVerifyCode = generateVerifyCode();
      user.verifyCode = newVerifyCode;
      user.verifyCodeExpiry = setVerifyCodeExpiry();
      user.resendCode = setNextResendTime(); // Set next allowed resend time

      await user.save();

      // Send the email with new code
      const emailResult = await sendVerificationEmail(user, newVerifyCode);

      if (emailResult.success) {
        return res.status(200).send({
          message: "Verification code resent successfully",
          expiresAt: user.verifyCodeExpiry,
          nextResendAvailable: user.resendCode,
        });
      } else {
        return res.status(500).send({
          message: "Failed to send verification email",
          error: emailResult.message,
        });
      }
    } catch (err) {
      console.error("Error resending OTP:", err);
      return res.status(500).send({
        message: "Internal server error",
        error: err.message,
      });
    }
  })
);


module.exports = userApp;
