const mongoose = require("mongoose");
const Company = require("../models/Company");
const config = require("../config/env-config");

async function testImageGenerationFix() {
  try {
    console.log("🧪 Testing image generation credit fix...");
    await mongoose.connect(config.mongoUri);
    console.log("✅ Connected to MongoDB");

    // Get the demo company
    const companyId = "688cd50afd0cbf4e61570dab";
    const company = await Company.findById(companyId);

    if (!company) {
      console.log("❌ Company not found");
      return;
    }

    console.log("📋 Company before test:");
    console.log(`- Name: ${company.companyName}`);
    console.log(`- Current Credits: ${company.credits.currentCredits}`);
    console.log(`- Total Credits Used: ${company.credits.totalCreditsUsed}`);

    // Test credit checking (this should work now)
    const creditCost = 3;
    const hasCredits = company.hasCredits(creditCost);
    console.log(`🔍 Has ${creditCost} credits? ${hasCredits}`);

    if (!hasCredits) {
      console.log("❌ Test failed: Should have enough credits");
      return;
    }

    // Test the deductCredits method (this should work without the MongoDB error)
    console.log("🔧 Testing deductCredits method...");
    const originalCredits = company.credits.currentCredits;

    try {
      await company.deductCredits(
        creditCost,
        "image_gen",
        "Test image generation"
      );
      console.log("✅ deductCredits method succeeded!");

      // Reload company to check credits were properly deducted
      const updatedCompany = await Company.findById(companyId);
      console.log(
        `📊 Credits after deduction: ${updatedCompany.credits.currentCredits}`
      );
      console.log(
        `💰 Credits deducted: ${
          originalCredits - updatedCompany.credits.currentCredits
        }`
      );

      if (
        updatedCompany.credits.currentCredits ===
        originalCredits - creditCost
      ) {
        console.log("✅ Credits were properly deducted!");
      } else {
        console.log("❌ Credit deduction amount is incorrect");
      }
    } catch (error) {
      console.log("❌ deductCredits method failed:", error.message);
      return;
    }

    console.log("🎉 Image generation credit fix test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("📤 Disconnected from MongoDB");
  }
}

if (require.main === module) {
  testImageGenerationFix().catch(console.error);
}

module.exports = { testImageGenerationFix };
