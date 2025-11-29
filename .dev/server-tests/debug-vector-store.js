const { feedbackVectorStore } = require("../services/feedback-langchain");

async function debugVectorStore() {
  try {
    console.log("🔍 Debugging vector store data access...");

    // Initialize
    await feedbackVectorStore.initialize();
    console.log("✅ Vector store initialized");

    // Test direct access to feedback index
    console.log(
      `📋 Feedback index size: ${feedbackVectorStore.feedbackIndex.size}`
    );

    // Test getAllFeedback method
    const allFeedback = await feedbackVectorStore.getAllFeedback();
    console.log(`📋 getAllFeedback() returned: ${allFeedback.length} items`);

    if (allFeedback.length > 0) {
      console.log(`📝 Sample feedback item:`, {
        id: allFeedback[0].id,
        sentiment: allFeedback[0].sentiment,
        content: allFeedback[0].content?.substring(0, 100) + "...",
        date: allFeedback[0].date,
        addedAt: allFeedback[0].addedAt,
      });

      // Test date filtering
      const now = new Date();
      const cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days
      console.log(`📅 Cutoff date for 30d filter: ${cutoffDate.toISOString()}`);

      const filteredByDate = allFeedback.filter((f) => {
        const feedbackDate = new Date(f.date || f.addedAt);
        const isWithinRange = feedbackDate >= cutoffDate;
        if (!isWithinRange) {
          console.log(
            `   ❌ Filtered out: ${f.id} (date: ${feedbackDate.toISOString()})`
          );
        }
        return isWithinRange;
      });

      console.log(`📋 After date filtering: ${filteredByDate.length} items`);
    }
  } catch (error) {
    console.error("❌ Error debugging vector store:", error.message);
  }
}

debugVectorStore();
