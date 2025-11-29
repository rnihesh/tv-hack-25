const mongoose = require("mongoose");
const Company = require("../models/Company");
const config = require("../config/env-config");

async function fixCompany() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    console.log("Connected to MongoDB");

    // Find the first active company
    const company = await Company.findOne({ isActive: true });

    if (!company) {
      console.log("No active company found");
      return;
    }

    console.log(`Found company: ${company.companyName} (${company.email})`);
    console.log(
      `Current AI model: ${company.aiContextProfile.contextualPreferences.preferredAIModel}`
    );

    // Fix the AI model
    company.aiContextProfile.contextualPreferences.preferredAIModel =
      "gemini-2.5-flash";
    await company.save();

    console.log(
      `Updated AI model: ${company.aiContextProfile.contextualPreferences.preferredAIModel}`
    );
    console.log("Company fixed successfully!");
  } catch (error) {
    console.error("Error fixing company:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

fixCompany();
