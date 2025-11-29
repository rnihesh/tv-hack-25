const {
  feedbackVectorStore,
} = require("../services/feedback-langchain/vectorStore");
const { logger } = require("../utils/logger");

async function testFeedbackAccess() {
  try {
    console.log("🔍 Testing feedback vector store access...\n");

    // Check if vector store is initialized
    if (!feedbackVectorStore.initialized) {
      console.log("Initializing feedback vector store...");
      await feedbackVectorStore.initialize();
    }

    // Get stats directly from vector store
    const stats = await feedbackVectorStore.getStats();
    console.log("📊 Vector store stats:", stats);

    // Get all feedback
    const allFeedback = await feedbackVectorStore.getAllFeedback();
    console.log(
      `📋 Total feedback items in vector store: ${allFeedback.length}`
    );

    if (allFeedback.length > 0) {
      console.log("\n✅ Sample feedback items:");
      allFeedback.slice(0, 3).forEach((feedback, index) => {
        console.log(
          `${index + 1}. [${feedback.sentiment}] "${feedback.text.substring(
            0,
            60
          )}..."`
        );
      });

      // Test similarity search
      console.log("\n🔍 Testing similarity search...");
      const searchResults = await feedbackVectorStore.searchSimilarFeedback(
        "product quality",
        { limit: 3 }
      );
      console.log(`Found ${searchResults.length} similar feedback items`);

      searchResults.forEach((result, index) => {
        console.log(
          `${index + 1}. Similarity: ${result.similarity.toFixed(
            3
          )} - "${result.content.substring(0, 80)}..."`
        );
      });
    } else {
      console.log("❌ No feedback data found in vector store");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    console.log("\nTest completed.");
    process.exit(0);
  }
}

testFeedbackAccess();
