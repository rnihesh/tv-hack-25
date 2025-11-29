const mongoose = require("mongoose");
const Company = require("../models/Company");
const config = require("../config/env-config");

async function testChatbotCompany() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(config.mongoUri);
    console.log("Connected successfully");

    const demoId = new mongoose.Types.ObjectId("688cd50afd0cbf4e61570dab");
    console.log("Looking for demo company with ID:", demoId);

    let company = await Company.findById(demoId);

    if (!company) {
      console.log("Demo company not found, creating new one...");

      // Create a new demo company
      company = new Company({
        _id: demoId,
        email: "demo@example.com",
        companyName: "Demo Company",
        password: "hashed_password_here", // This would normally be hashed
        businessDescription: "A demo company for testing AI services",
        targetAudience: "Tech enthusiasts and developers",
        credits: {
          currentCredits: 100,
          totalCredits: 100,
        },
        subscription: {
          plan: "basic",
          isActive: true,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
        usage: {
          websiteGeneration: 0,
          emailGeneration: 0,
          imageGeneration: 0,
          chatbotQueries: 0,
        },
        aiContextProfile: {
          businessPersonality: "helpful and professional",
          brandVoice: "friendly",
          productServices: [
            "AI services",
            "chatbot solutions",
            "automation tools",
          ],
        },
      });

      await company.save();
      console.log("Demo company created successfully");
    } else {
      console.log("Demo company found:", {
        id: company._id,
        name: company.companyName,
        email: company.email,
        credits: company.credits.currentCredits,
      });
    }

    // Test the company methods
    console.log("Testing company methods...");
    console.log("Has credits (1):", company.hasCredits(1));
    console.log("Current credits:", company.credits.currentCredits);
  } catch (error) {
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

testChatbotCompany();
