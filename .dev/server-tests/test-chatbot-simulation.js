const mongoose = require("mongoose");
const config = require("../config/env-config");
const Company = require("../models/Company");
const demoAuth = require("../middlewares/demoAuth");

async function simulateChatbotRequest() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("✅ Connected to MongoDB");

    // Simulate the request object that would come to the chatbot controller
    const req = {
      body: {
        message: "Hello, this is a test message",
        sessionId: "test-session-123",
      },
    };

    const res = {
      status: (code) => ({
        json: (data) => {
          console.log(`Response ${code}:`, data);
          return res;
        },
      }),
      json: (data) => {
        console.log("Response 200:", data);
        return res;
      },
    };

    // Simulate demoAuth middleware
    demoAuth(req, res, () => {
      console.log("✅ demoAuth middleware passed");
    });

    // Simulate the part of chatbot controller that was failing
    const { message, sessionId } = req.body;
    const companyId = req.company.id;

    console.log("📋 Processing message:", message);
    console.log("📋 Session ID:", sessionId);
    console.log("📋 Company ID:", companyId);

    // Check if company exists (this was the failing part)
    const company = await Company.findById(companyId);
    if (!company) {
      console.log("❌ Company not found - THIS SHOULD NOT HAPPEN NOW");
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    console.log("✅ Company found successfully!");
    console.log(`- Company Name: ${company.companyName}`);
    console.log(`- Company Email: ${company.email}`);
    console.log(`- Current Credits: ${company.credits.currentCredits}`);

    // Check if company has sufficient credits
    if (!company.hasCredits(1)) {
      console.log("❌ Insufficient credits");
      return res.status(402).json({
        success: false,
        message: "Insufficient credits for chatbot service",
      });
    }

    console.log("✅ Company has sufficient credits");
    console.log("🎉 Chatbot request would proceed successfully!");
  } catch (error) {
    console.error("❌ Error simulating chatbot request:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("📤 Disconnected from MongoDB");
  }
}

simulateChatbotRequest().catch(console.error);
