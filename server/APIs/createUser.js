require("dotenv").config();
const User = require("../models/user.prod.model.js");
const {
  sendVerificationEmail,
  generateVerifyCode,
  setVerifyCodeExpiry,
} = require("../utils/sendMail.js");

async function createUser(req, res) {
  try {
    const newUser = req.body;
    const existing = await User.findOne({ email: newUser.email });

    if (existing) {
      return res
        .status(200)
        .send({ message: newUser.firstName, payload: existing });
    }

    // Generate verification code and set expiry
    const verifyCode = generateVerifyCode();
    newUser.verifyCode = verifyCode;
    newUser.verifyCodeExpiry = setVerifyCodeExpiry();
    newUser.resendCode = null; // Initially no resend restriction

    // Save the new user
    const userDoc = await new User(newUser).save();

    // Send verification email
    const emailResult = await sendVerificationEmail(userDoc, verifyCode);

    return res.status(201).send({
      message: userDoc.firstName,
      payload: userDoc,
      emailStatus: emailResult.message,
    });
  } catch (err) {
    console.error("Error in createUser:", err);
    return res
      .status(500)
      .send({ message: "Internal server error", error: err.message });
  }
}

module.exports = createUser;
