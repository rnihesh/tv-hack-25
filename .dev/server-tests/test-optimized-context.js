const { vectorContextService } = require("../services/langchain/vectorContext");
const { ChatbotChain } = require("../services/langchain/contextualChains");
const mongoose = require("mongoose");
const config = require("../config/env-config");

async function testOptimizedContext() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("✅ Connected to MongoDB");

    await vectorContextService.initialize();
    console.log("✅ Vector service initialized");

    // Test with a real company ID (get first company)
    const Company = require("../models/Company");
    const company = await Company.findOne({});

    if (!company) {
      console.log("❌ No companies found");
      process.exit(1);
    }

    console.log(`📋 Testing context for: ${company.companyName}`);

    // Test 1: Direct context retrieval
    console.log("\n🔍 Test 1: Direct context retrieval");
    const context = await vectorContextService.getContextForPrompt(
      company._id.toString(),
      "What is my company name?",
      "chatbot"
    );

    console.log("📄 Context generated:");
    console.log(context.substring(0, 500) + "...");

    // Check if company name is included
    if (context.includes(company.companyName)) {
      console.log("✅ Company name found in context!");
    } else {
      console.log("❌ Company name NOT found in context");
    }

    // Test 2: Chatbot chain response
    console.log("\n🤖 Test 2: Chatbot chain response");
    const chatbotChain = new ChatbotChain();
    const result = await chatbotChain.processMessage(
      company._id.toString(),
      "What is my company name?",
      "test_session",
      { maxTokens: 100 }
    );

    console.log("🎯 Chatbot response:");
    console.log(result.content);

    if (result.content.includes(company.companyName)) {
      console.log("✅ Chatbot correctly mentions company name!");
    } else {
      console.log("❌ Chatbot does NOT mention company name");
    }

    // Test 3: Check context details
    console.log("\n📊 Test 3: Context details");
    const fullContext = await vectorContextService.getCompanyContext(
      company._id.toString()
    );

    console.log("Company info in context:");
    console.log("- Name:", fullContext.companyInfo?.name);
    console.log("- Business Type:", fullContext.companyInfo?.businessType);
    console.log(
      "- Description:",
      fullContext.companyInfo?.description?.substring(0, 100) + "..."
    );
    console.log(
      "- Vector Context Items:",
      fullContext.vectorContext?.length || 0
    );

    await mongoose.disconnect();
    console.log("\n✅ All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testOptimizedContext();
