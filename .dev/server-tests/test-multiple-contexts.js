const mongoose = require("mongoose");
const config = require("../config/env-config");
const Company = require("../models/Company");
const { vectorContextService } = require("../services/langchain/vectorContext");

async function testMultipleCompanyContexts() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("✅ Connected to MongoDB");

    // Initialize vector service
    await vectorContextService.initialize();
    console.log("✅ Vector context service initialized");

    // Get all companies
    const companies = await Company.find({}).limit(5);
    console.log(`📋 Found ${companies.length} companies`);

    for (const company of companies) {
      console.log(
        `\n=== Testing company: ${company.companyName} (${company.email}) ===`
      );

      // Seed unique context for each company
      // Seed basic context for all companies
      await vectorContextService.addDocumentToContext(
        company._id.toString(),
        `${company.companyName} is a ${company.businessType} business. ${
          company.businessDescription ||
          "We provide excellent service to our customers."
        }`,
        {
          source: "business_info",
          type: "company_description",
          importance: 8,
          timestamp: new Date().toISOString(),
        }
      );

      await vectorContextService.addDocumentToContext(
        company._id.toString(),
        `Target customers: ${
          company.targetAudience || "General public looking for quality service"
        }`,
        {
          source: "business_info",
          type: "target_audience",
          importance: 7,
          timestamp: new Date().toISOString(),
        }
      );

      console.log(`✅ Seeded basic context for ${company.companyName}`);

      // Test context retrieval
      const testContext = await vectorContextService.getContextForPrompt(
        company._id.toString(),
        "create a website for our business",
        "website_generation"
      );

      console.log(`📄 Context preview for ${company.companyName}:`);
      console.log(testContext.substring(0, 300) + "...");
    }
  } catch (error) {
    console.error("❌ Error testing contexts:", error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log("📤 Disconnected from MongoDB");
  }
}

testMultipleCompanyContexts().catch(console.error);
