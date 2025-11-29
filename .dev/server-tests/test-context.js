// Test context storage and retrieval
const mongoose = require("mongoose");
const config = require("../config/env-config");
const { vectorContextService } = require("../services/langchain/vectorContext");
const Company = require("../models/Company");

async function testContext() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    console.log("✅ Connected to MongoDB");

    // Find a test company (get any company from database)
    const testCompany = await Company.findOne();
    if (!testCompany) {
      console.log("❌ No companies found in database");
      return;
    }

    const testCompanyId = testCompany._id.toString();
    console.log(
      `\n🔍 Testing with company: ${testCompany.name} (${testCompany.businessType})`
    );

    console.log("\n🔍 Testing context storage and retrieval...");

    // Initialize the vector service
    await vectorContextService.initialize();
    console.log("✅ Vector context service initialized");

    // Test adding documents to context using actual company data
    console.log("\n📝 Adding test documents to context...");

    await vectorContextService.addDocumentToContext(
      testCompanyId,
      `We are ${testCompany.name}, a ${testCompany.businessType}. ${
        testCompany.description ||
        "We provide quality services to our customers."
      }`,
      {
        source: "test_business_info",
        type: "business_description",
        importance: 8,
        timestamp: new Date().toISOString(),
      }
    );

    await vectorContextService.addDocumentToContext(
      testCompanyId,
      `Our business type is ${testCompany.businessType} and we focus on providing excellent customer service`,
      {
        source: "test_business_info",
        type: "target_audience",
        importance: 7,
        timestamp: new Date().toISOString(),
      }
    );

    console.log("✅ Test documents added to context");

    // Test searching context
    console.log("\n🔍 Testing context search...");

    const searchResults = await vectorContextService.searchContext(
      testCompanyId,
      `${testCompany.businessType} business information`,
      { limit: 5 }
    );

    console.log(`Found ${searchResults.length} context documents:`);
    searchResults.forEach((doc, index) => {
      console.log(
        `${index + 1}. ${doc.content} (Score: ${doc.score.toFixed(2)})`
      );
    });

    // Test getting full company context
    console.log("\n📋 Testing full company context retrieval...");

    const fullContext = await vectorContextService.getCompanyContext(
      testCompanyId
    );

    console.log("Company Info:", {
      name: fullContext.companyInfo?.name,
      businessType: fullContext.companyInfo?.businessType,
      vectorContextCount: fullContext.vectorContext?.length || 0,
    });

    // Test context for prompt
    console.log("\n💭 Testing context for prompt...");

    const contextForPrompt = await vectorContextService.getContextForPrompt(
      testCompanyId,
      "Create a website for my business",
      "website_generation"
    );

    console.log("Context for prompt length:", contextForPrompt.length);
    console.log("Context preview:", contextForPrompt.substring(0, 200) + "...");

    console.log("\n✅ All context tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

console.log("🧪 Starting context system test...");
testContext();
