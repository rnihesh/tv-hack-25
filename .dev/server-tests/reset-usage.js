const mongoose = require("mongoose");
const Company = require("../models/Company");
const config = require("../config/env-config");

async function resetUsageAndUpgradeSubscription() {
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
    console.log(`Current subscription plan: ${company.subscription.plan}`);
    console.log(
      `Current websites generated: ${company.usage.websitesGenerated}`
    );

    // Reset usage
    company.usage.websitesGenerated = 0;
    company.usage.emailsSent = 0;
    company.usage.imagesGenerated = 0;
    company.usage.chatbotQueries = 0;
    company.usage.vectorSearches = 0;
    company.usage.lastUsageReset = new Date();

    // Upgrade to professional plan for unlimited websites
    company.subscription.plan = "professional";
    company.subscription.status = "active";

    await company.save();

    console.log(`Updated subscription plan: ${company.subscription.plan}`);
    console.log(`Reset websites generated: ${company.usage.websitesGenerated}`);
    console.log("Company usage reset and subscription upgraded successfully!");
  } catch (error) {
    console.error("Error updating company:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

resetUsageAndUpgradeSubscription();
