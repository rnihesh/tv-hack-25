const mongoose = require("mongoose");
const Company = require("../models/Company");
const config = require("../config/env-config");

async function addCredits() {
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
    console.log(`Current credits: ${company.credits.currentCredits}`);

    // Add 100 credits
    company.credits.currentCredits += 100;
    await company.save();

    console.log(`Updated credits: ${company.credits.currentCredits}`);
    console.log("Credits added successfully!");
  } catch (error) {
    console.error("Error adding credits:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

addCredits();
