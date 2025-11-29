const mongoose = require("mongoose");
const config = require("../config/env-config");
const Company = require("../models/Company");
const demoAuth = require("../middlewares/demoAuth");

async function testChatbotDeductCredits() {
  try {
    console.log("🧪 Testing chatbot deductCredits fix...");
    await mongoose.connect(config.mongoUri);
    console.log("✅ Connected to MongoDB");

    // Test the demoAuth middleware
    const req = { body: { message: "Test message", sessionId: "test-123" } };
    const res = {};
    const next = () => {};

    demoAuth(req, res, next);
    const companyId = req.company.id;

    // Get the company from database
    const company = await Company.findById(companyId);

    if (!company) {
      console.log("❌ Company not found");
      return;
    }

    console.log("📋 Company before test:");
    console.log(`- Name: ${company.companyName}`);
    console.log(`- Current Credits: ${company.credits.currentCredits}`);
    console.log(`- Total Credits Used: ${company.credits.totalCreditsUsed}`);
    console.log(`- Daily Credits Used: ${company.credits.dailyCreditsUsed}`);

    // Test the deductCredits method with correct parameters
    console.log("🔧 Testing deductCredits method...");
    try {
      await company.deductCredits(
        1,
        "chatbot",
        "Test chatbot message processing"
      );
      console.log("✅ deductCredits method called successfully!");

      // Refresh the company from database to see changes
      const updatedCompany = await Company.findById(companyId);
      console.log("📋 Company after deductCredits:");
      console.log(
        `- Current Credits: ${updatedCompany.credits.currentCredits}`
      );
      console.log(
        `- Total Credits Used: ${updatedCompany.credits.totalCreditsUsed}`
      );
      console.log(
        `- Daily Credits Used: ${updatedCompany.credits.dailyCreditsUsed}`
      );

      // Check credit history
      const lastHistoryEntry =
        updatedCompany.credits.creditHistory[
          updatedCompany.credits.creditHistory.length - 1
        ];
      console.log("📋 Last credit history entry:");
      console.log(`- Action: ${lastHistoryEntry.action}`);
      console.log(`- Amount: ${lastHistoryEntry.amount}`);
      console.log(`- Service: ${lastHistoryEntry.service}`);
      console.log(`- Description: ${lastHistoryEntry.description}`);

      console.log("🎉 All tests passed! Chatbot should work now!");
    } catch (error) {
      console.error("❌ deductCredits failed:", error.message);
      console.error("Full error:", error);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("📤 Disconnected from MongoDB");
  }
}

testChatbotDeductCredits().catch(console.error);
