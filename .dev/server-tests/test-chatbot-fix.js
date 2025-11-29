const mongoose = require("mongoose");
const config = require("../config/env-config");
const Company = require("../models/Company");

// Simulate the demoAuth middleware
const demoAuth = require("../middlewares/demoAuth");

async function testChatbotFix() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("✅ Connected to MongoDB");

    // Test the demoAuth middleware
    const req = {};
    const res = {};
    const next = () =>
      console.log("✅ demoAuth middleware executed successfully");

    demoAuth(req, res, next);

    console.log("📋 Company ID from demoAuth:", req.company.id);

    // Test if the company exists in database
    const company = await Company.findById(req.company.id);

    if (!company) {
      console.log("❌ Company not found in database with ID:", req.company.id);

      // List available companies
      const companies = await Company.find({}, "_id companyName email").limit(
        5
      );
      console.log("📄 Available companies:");
      companies.forEach((comp) => {
        console.log(
          `- ID: ${comp._id}, Name: ${comp.companyName}, Email: ${comp.email}`
        );
      });
    } else {
      console.log("✅ Company found successfully!");
      console.log(`- Name: ${company.companyName}`);
      console.log(`- Email: ${company.email}`);
      console.log(`- Credits: ${company.credits.currentCredits}`);
      console.log("🎉 Chatbot should work now!");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("📤 Disconnected from MongoDB");
  }
}

testChatbotFix().catch(console.error);
