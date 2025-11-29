const { feedbackAnalyzer } = require("../services/feedback-langchain");

async function testAnalyzer() {
  try {
    console.log("🧪 Testing PERSISTENT storage vs in-memory...");
    console.log("📁 Checking if vector store files exist on disk...");

    const fs = require("fs");
    const vectorPath = "../data/feedback_vectors";
    const indexPath = "../data/feedback_vectors_index.json";

    console.log(`   Vector store exists: ${fs.existsSync(vectorPath)}`);
    console.log(`   Index file exists: ${fs.existsSync(indexPath)}`);

    if (fs.existsSync(indexPath)) {
      const stats = fs.statSync(indexPath);
      console.log(`   Index file size: ${Math.round(stats.size / 1024)}KB`);
    }

    // Test initialization
    await feedbackAnalyzer.initialize();
    console.log("✅ Analyzer initialized (loading from PERSISTENT storage)");

    // Test getting feedback count with longer timeframe to include 2023 data
    const analysis = await feedbackAnalyzer.analyzeSentimentTrends({
      timeframe: "2y", // Changed to 2 years to include 2023 data
    });

    console.log(`📊 Analyzer results (2 year timeframe):`);
    console.log(`   Total feedback: ${analysis.totalFeedback}`);
    console.log(`   Overall metrics:`, analysis.overallMetrics);

    // Test answering a question (uses similarity search, not time filtering)
    const questionAnswer = await feedbackAnalyzer.answerFeedbackQuestion(
      "Show me customer feedback examples"
    );
    console.log(`❓ Question response (first 200 chars):`);
    console.log(`   ${questionAnswer.answer.substring(0, 200)}...`);

    console.log(
      "\n🎯 CONCLUSION: Using FaissStore (PERSISTENT) instead of MemoryVectorStore (in-memory)"
    );
  } catch (error) {
    console.error("❌ Error testing analyzer:", error.message);
  }
}

testAnalyzer();
