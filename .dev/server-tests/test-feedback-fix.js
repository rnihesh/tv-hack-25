const {
  feedbackLLMService,
} = require("../services/feedback-langchain/llmService");
const { logger } = require("../utils/logger");

async function testFeedbackFix() {
  try {
    console.log("Testing feedback LLM service initialization...");

    // Test initialization
    await feedbackLLMService.initialize();
    console.log("✅ LLM service initialized successfully");

    // Test simple text generation
    const testResponse = await feedbackLLMService.generateResponse(
      "Hello, this is a test message."
    );
    console.log(
      "✅ Test response generated:",
      testResponse?.substring(0, 100) + "..."
    );

    // Test sentiment analysis
    const sentimentResult = await feedbackLLMService.analyzeText(
      "This product is amazing! I love it.",
      "sentiment"
    );
    console.log("✅ Sentiment analysis result:", sentimentResult);

    console.log("\n🎉 All feedback service tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    process.exit(0);
  }
}

testFeedbackFix();
