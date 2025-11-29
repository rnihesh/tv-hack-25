#!/usr/bin/env node

// Simple test to verify chatbot context access
const mongoose = require("mongoose");
const config = require("../config/env-config");

async function quickTest() {
  try {
    console.log("🔍 Quick Context Test");

    await mongoose.connect(config.mongoUri);
    console.log("✅ MongoDB connected");

    const Company = require("../models/Company");
    const company = await Company.findOne({});

    if (!company) {
      console.log("❌ No companies found");
      return;
    }

    console.log(`📋 Found company: ${company.companyName}`);

    // Test if vector context service can access company data
    const {
      vectorContextService,
    } = require("../services/langchain/vectorContext");
    await vectorContextService.initialize();

    // Get context - this should work with lazy loading
    const context = await vectorContextService.getContextForPrompt(
      company._id.toString(),
      "What is my company name?",
      "chatbot"
    );

    console.log("📄 Context check:");
    console.log("- Context length:", context.length);
    console.log(
      "- Contains company name:",
      context.includes(company.companyName) ? "✅ YES" : "❌ NO"
    );
    console.log("- Context preview:", context.substring(0, 200) + "...");

    await mongoose.disconnect();
    console.log("✅ Test completed");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

quickTest();
