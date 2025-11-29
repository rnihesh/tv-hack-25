#!/usr/bin/env node

// Fix for vector context issue - ensures all companies have proper context seeded
const mongoose = require("mongoose");
const { vectorContextService } = require("../services/langchain/vectorContext");
const Company = require("../models/Company");
require("dotenv").config();

async function fixVectorContext() {
  try {
    await mongoose.connect(process.env.DBURL || process.env.MONGO_URI);
    console.log("🔗 Connected to MongoDB");

    // Get all companies
    const companies = await Company.find({});
    console.log(`📊 Found ${companies.length} companies to process`);

    for (const company of companies) {
      console.log(`\n🏢 Processing: ${company.companyName} (${company._id})`);

      try {
        // Seed context for this company
        await vectorContextService.seedCompanyContext(company._id, {
          companyName: company.companyName,
          businessType: company.businessType,
          businessDescription: company.businessDescription,
          targetAudience: company.targetAudience,
          preferences: company.preferences,
          keyMessages: company.aiContextProfile?.keyMessages || [],
          productServices: company.aiContextProfile?.productServices || [],
          businessPersonality: company.aiContextProfile?.businessPersonality,
          brandVoice: company.aiContextProfile?.brandVoice,
        });

        console.log(
          `✅ Successfully seeded context for ${company.companyName}`
        );

        // Verify the context was stored
        const vectorResults = await vectorContextService.searchContext(
          company._id,
          "business information",
          { limit: 3 }
        );
        console.log(`📋 Stored ${vectorResults.length} context documents`);
      } catch (error) {
        console.error(
          `❌ Failed to seed context for ${company.companyName}:`,
          error.message
        );
      }
    }

    console.log("\n🎉 Vector context fix completed!");
    await mongoose.disconnect();
  } catch (error) {
    console.error("💥 Error:", error);
    process.exit(1);
  }
}

console.log("🚀 Starting vector context fix...");
fixVectorContext();
