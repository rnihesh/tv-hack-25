const {
  feedbackLLMService,
  feedbackChatbotIntegration,
  feedbackAnalyzer,
} = require("../services/feedback-langchain");
const { logger } = require("../utils/logger");

async function testImprovedFeedbackAnalysis() {
  try {
    console.log("🧪 Testing Improved Feedback Analysis System...\n");

    // Test 1: Initialize the LLM service
    console.log("📋 Test 1: LLM Service Initialization");
    try {
      await feedbackLLMService.initialize();
      console.log("✅ LLM service initialized successfully");
    } catch (error) {
      console.log(`⚠️ LLM service failed to initialize: ${error.message}`);
      console.log(
        "Please check your GEMINI_API_KEY or ensure Ollama is running on port 11434\n"
      );
      return;
    }

    // Test 2: Test improved sentiment analysis
    console.log("\n📋 Test 2: Enhanced Sentiment Analysis");
    const testFeedback =
      "I absolutely love this product! The customer service was amazing and the delivery was super fast. However, the packaging could be improved as it was a bit damaged.";

    try {
      const sentimentResult = await feedbackLLMService.analyzeText(
        testFeedback,
        "sentiment"
      );
      console.log("✅ Sentiment Analysis Result:");
      console.log(JSON.stringify(sentimentResult, null, 2));
    } catch (error) {
      console.log(`❌ Sentiment analysis failed: ${error.message}`);
    }

    // Test 3: Test emotion analysis
    console.log("\n📋 Test 3: Enhanced Emotion Analysis");
    try {
      const emotionResult = await feedbackLLMService.analyzeText(
        testFeedback,
        "emotion"
      );
      console.log("✅ Emotion Analysis Result:");
      console.log(JSON.stringify(emotionResult, null, 2));
    } catch (error) {
      console.log(`❌ Emotion analysis failed: ${error.message}`);
    }

    // Test 4: Test theme extraction
    console.log("\n📋 Test 4: Enhanced Theme Extraction");
    try {
      const themeResult = await feedbackLLMService.analyzeText(
        testFeedback,
        "themes"
      );
      console.log("✅ Theme Analysis Result:");
      console.log(JSON.stringify(themeResult, null, 2));
    } catch (error) {
      console.log(`❌ Theme analysis failed: ${error.message}`);
    }

    // Test 5: Test chatbot integration
    console.log("\n📋 Test 5: Chatbot Integration with Improved Prompts");
    try {
      await feedbackChatbotIntegration.initialize();

      const testQueries = [
        "What's the overall sentiment of our feedback?",
        "Give me insights about customer feedback",
        "What are the main customer pain points?",
      ];

      for (const query of testQueries) {
        console.log(`\n🤖 Query: "${query}"`);
        try {
          const response = await feedbackChatbotIntegration.handleFeedbackQuery(
            query,
            "test_session_improved"
          );
          console.log(`✅ Response: ${response.response.substring(0, 200)}...`);
          console.log(`📊 Intent: ${response.intent}`);
        } catch (error) {
          console.log(`❌ Query failed: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`❌ Chatbot integration failed: ${error.message}`);
    }

    console.log("\n🎉 Improved feedback analysis tests completed!");
    console.log("\n📝 Notes:");
    console.log(
      "- Prompts have been enhanced with better structure and context"
    );
    console.log("- JSON parsing is more robust with fallback handling");
    console.log(
      "- System prompts now provide clear role definition for the AI"
    );
    console.log("- Response formatting is improved for better user experience");
    console.log("- Error handling has been strengthened");
  } catch (error) {
    console.error("❌ Test suite failed:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    process.exit(0);
  }
}

// Helper function to display configuration status
function checkConfiguration() {
  console.log("🔧 Configuration Status:");
  console.log(
    `- GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? "✅ Set" : "❌ Missing"}`
  );
  console.log(
    `- OLLAMA_URL: ${process.env.OLLAMA_URL || "http://localhost:11434"}`
  );
  console.log(`- NODE_ENV: ${process.env.NODE_ENV || "development"}`);
  console.log("");
}

// Run the test
checkConfiguration();
testImprovedFeedbackAnalysis();
