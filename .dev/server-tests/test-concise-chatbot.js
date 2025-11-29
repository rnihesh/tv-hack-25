#!/usr/bin/env node

// Test the optimized chatbot responses
const mongoose = require("mongoose");
const config = require("../config/env-config");
const { ChatbotChain } = require("../services/langchain/contextualChains");

async function testConciseChatbot() {
  try {
    console.log("🤖 Testing Concise Chatbot Responses");

    await mongoose.connect(config.mongoUri);
    console.log("✅ MongoDB connected");

    const Company = require("../models/Company");
    const company = await Company.findOne({});

    if (!company) {
      console.log("❌ No companies found");
      return;
    }

    console.log(`📋 Testing with company: ${company.companyName}`);

    const chatbotChain = new ChatbotChain();

    // Test various queries to see response length
    const testQueries = [
      "what am i",
      "What is my company name?",
      "What services do we offer?",
      "Who are our target customers?",
      "Hello",
    ];

    for (const query of testQueries) {
      console.log(`\n❓ Query: "${query}"`);

      try {
        const result = await chatbotChain.processMessage(
          company._id.toString(),
          query,
          "test_session"
        );

        console.log(`🎯 Response (${result.content.length} chars):`);
        console.log(`"${result.content}"`);
        console.log(`📊 Model used: ${result.modelUsed}`);
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }

    await mongoose.disconnect();
    console.log("\n✅ Test completed");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testConciseChatbot();
