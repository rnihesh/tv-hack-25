#!/usr/bin/env node

/**
 * Setup script for Feedback Analyzer with LangChain Integration
 *
 * This script helps set up and initialize the feedback analysis system
 */

const path = require("path");
const {
  feedbackDataProcessor,
  feedbackChatbotIntegration,
} = require("../services/feedback-langchain");
const { logger } = require("../utils/logger");

class FeedbackSetup {
  async run() {
    console.log("🚀 Setting up Feedback Analyzer with LangChain...\n");

    try {
      // Step 1: Initialize the system
      await this.initializeSystem();

      // Step 2: Load sample data
      await this.loadSampleData();

      // Step 3: Test the system
      await this.testSystem();

      console.log("✅ Feedback Analyzer setup completed successfully!");
      console.log("\n📋 Next steps:");
      console.log("1. Start your server: npm start");
      console.log("2. Test feedback routes: POST /api/feedback/chat");
      console.log("3. Try chatbot integration: POST /api/chatbot/feedback");
      console.log("4. Load your own data: POST /api/feedback/load");
    } catch (error) {
      console.error("❌ Setup failed:", error.message);
      console.log("\n🔧 Troubleshooting:");
      console.log("1. Make sure Ollama is running (or use Gemini API key)");
      console.log("2. Check your environment variables");
      console.log("3. Ensure all dependencies are installed");
      process.exit(1);
    }
  }

  async initializeSystem() {
    console.log("📋 Step 1: Initializing system components...");

    try {
      await feedbackChatbotIntegration.initialize();
      console.log("✅ System initialized successfully");
    } catch (error) {
      console.log("⚠️  System initialized with limited functionality");
      console.log("   Make sure Ollama is running or Gemini API key is set");
    }
  }

  async loadSampleData() {
    console.log("\n📋 Step 2: Loading sample feedback data...");

    try {
      // Load from the existing CSV file
      const csvPath = path.join(__dirname, "../client/public/feedback.csv");
      const result = await feedbackDataProcessor.loadFromCSVFile(csvPath);

      console.log("✅ Sample data loaded successfully");
      console.log(`   - Total items: ${result.stats.total}`);
      console.log(`   - Processed: ${result.stats.processed}`);
      console.log(`   - Failed: ${result.stats.failed}`);
      console.log(`   - Skipped: ${result.stats.skipped}`);
    } catch (error) {
      console.log("⚠️  Failed to load sample data:", error.message);
      console.log("   You can load data later using the API");
    }
  }

  async testSystem() {
    console.log("\n📋 Step 3: Testing system functionality...");

    const testQueries = [
      "What's the overall sentiment?",
      "Find feedback about service",
      "Show me recent trends",
    ];

    for (const query of testQueries) {
      try {
        const response = await feedbackChatbotIntegration.handleFeedbackQuery(
          query,
          "setup_test_session"
        );

        console.log(`✅ Test query: "${query}"`);
        console.log(`   Response: ${response.response.substring(0, 80)}...`);
      } catch (error) {
        console.log(`⚠️  Test query failed: "${query}"`);
      }
    }
  }
}

// Function to run setup
async function runSetup() {
  const setup = new FeedbackSetup();
  await setup.run();
}

// Export for use in other modules
module.exports = {
  FeedbackSetup,
  runSetup,
};

// Run setup if this file is executed directly
if (require.main === module) {
  runSetup();
}
