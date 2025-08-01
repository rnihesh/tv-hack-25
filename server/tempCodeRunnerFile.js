const mongoose = require("mongoose");
const config = require("./config/env-config");
const {
  sendSingleEmail,
  sendVerificationEmail,
  generateVerifyCode,
} = require("./services/emailService");

async function testEmailSending() {
  try {
    console.log("🧪 Testing Email Service...\n");

    // Test 1: Simple email
    console.log("📧 Test 1: Sending simple test email...");
    const testCompany = {
      companyName: "Test Company",
      email: "test@example.com",
    };

    try {
      const result = await sendSingleEmail(
        "niheshr03@gmail.com", // Replace with your email for testing
        "Test Email from TechnoVista AI Toolkit",
        `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #e85f5c;">Email Service Test</h2>
            <p>Hello!</p>
            <p>This is a test email from your TechnoVista AI Toolkit email service.</p>
            <p>If you're reading this, the Gmail OAuth2 integration is working correctly!</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          </div>
        `,
        `Email Service Test\n\nHello!\n\nThis is a test email from your TechnoVista AI Toolkit email service.\n\nIf you're reading this, the Gmail OAuth2 integration is working correctly!\n\nTimestamp: ${new Date().toISOString()}`,
        testCompany
      );

      console.log("✅ Simple email sent successfully!");
      console.log("   Message ID:", result.messageId);
      console.log("   Timestamp:", result.timestamp);
    } catch (error) {
      console.log("❌ Simple email failed:", error.message);
    }

    // Test 2: Verification email
    console.log("\n📧 Test 2: Sending verification email...");
    const testUser = {
      email: "niheshr03@gmail.com", // Replace with your email for testing
      firstName: "Test User",
      id: "test123",
    };

    const verifyCode = generateVerifyCode();

    try {
      const result = await sendVerificationEmail(
        testUser,
        verifyCode,
        testCompany
      );

      if (result.success) {
        console.log("✅ Verification email sent successfully!");
        console.log("   Verification code:", verifyCode);
      } else {
        console.log("❌ Verification email failed:", result.message);
      }
    } catch (error) {
      console.log("❌ Verification email failed:", error.message);
    }

    console.log("\n🎉 Email service test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Check environment variables
function checkEnvironmentVariables() {
  console.log("🔍 Checking environment variables...\n");

  const requiredVars = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REFRESH_TOKEN",
    "GMAIL_ADDRESS",
  ];

  let allVarsSet = true;

  requiredVars.forEach((varName) => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Set`);
    } else {
      console.log(`❌ ${varName}: Missing`);
      allVarsSet = false;
    }
  });

  if (!allVarsSet) {
    console.log("\n❌ Some environment variables are missing!");
    console.log("Please set up the following variables in your .env file:");
    console.log("- GOOGLE_CLIENT_ID");
    console.log("- GOOGLE_CLIENT_SECRET");
    console.log("- GOOGLE_REFRESH_TOKEN");
    console.log("- GMAIL_ADDRESS");
    console.log("\nRefer to .env.example for setup instructions.");
    return false;
  }

  console.log("\n✅ All environment variables are set!");
  return true;
}

async function main() {
  console.log("🚀 TechnoVista Email Service Test");
  console.log("================================\n");

  // Check environment variables first
  if (!checkEnvironmentVariables()) {
    process.exit(1);
  }

  // Test email sending
  await testEmailSending();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testEmailSending, checkEnvironmentVariables };
