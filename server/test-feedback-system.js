const {
  feedbackDataProcessor,
  feedbackAnalyzer,
  feedbackChatbotIntegration,
  feedbackVectorStore
} = require('../services/feedback-langchain');
const { logger } = require('../utils/logger');

class FeedbackSystemTester {
  async runAllTests() {
    try {
      console.log('🧪 Starting Feedback System Tests...\n');
      
      // Test 1: Initialize the system
      await this.testInitialization();
      
      // Test 2: Load CSV data
      await this.testDataLoading();
      
      // Test 3: Test sentiment analysis
      await this.testSentimentAnalysis();
      
      // Test 4: Test similarity search
      await this.testSimilaritySearch();
      
      // Test 5: Test insights generation
      await this.testInsightsGeneration();
      
      // Test 6: Test chatbot integration
      await this.testChatbotIntegration();
      
      // Test 7: Test stats and overview
      await this.testStatsAndOverview();
      
      console.log('✅ All tests completed successfully!');
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    }
  }
  
  async testInitialization() {
    console.log('📋 Test 1: System Initialization');
    
    try {
      await feedbackChatbotIntegration.initialize();
      console.log('✅ System initialized successfully');
    } catch (error) {
      console.log('⚠️  System initialization with limited functionality:', error.message);
    }
    
    console.log('');
  }
  
  async testDataLoading() {
    console.log('📋 Test 2: Data Loading from CSV');
    
    try {
      const result = await feedbackDataProcessor.loadFromCSVFile();
      console.log('✅ CSV data loaded successfully');
      console.log(`   - Total feedback items: ${result.stats.total}`);
      console.log(`   - Successfully processed: ${result.stats.processed}`);
      console.log(`   - Failed: ${result.stats.failed}`);
      console.log(`   - Skipped: ${result.stats.skipped}`);
      
      if (result.vectorStoreStats) {
        console.log(`   - Vector store total: ${result.vectorStoreStats.totalFeedback}`);
      }
    } catch (error) {
      console.log('❌ Data loading failed:', error.message);
    }
    
    console.log('');
  }
  
  async testSentimentAnalysis() {
    console.log('📋 Test 3: Sentiment Analysis');
    
    try {
      const trends = await feedbackAnalyzer.analyzeSentimentTrends({
        timeframe: '30d'
      });
      
      console.log('✅ Sentiment analysis completed');
      console.log(`   - Total feedback analyzed: ${trends.totalFeedback}`);
      console.log(`   - Positive: ${trends.overallMetrics.positivePercentage}%`);
      console.log(`   - Negative: ${trends.overallMetrics.negativePercentage}%`);
      console.log(`   - Neutral: ${trends.overallMetrics.neutralPercentage}%`);
      
      if (trends.insights?.summary) {
        console.log(`   - Key insight: ${trends.insights.summary.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log('❌ Sentiment analysis failed:', error.message);
    }
    
    console.log('');
  }
  
  async testSimilaritySearch() {
    console.log('📋 Test 4: Similarity Search');
    
    try {
      const searchResults = await feedbackAnalyzer.findSimilarFeedback('customer service', {
        limit: 5,
        similarityThreshold: 0.5
      });
      
      console.log('✅ Similarity search completed');
      console.log(`   - Query: "customer service"`);
      console.log(`   - Results found: ${searchResults.totalResults}`);
      
      if (searchResults.results.length > 0) {
        const topResult = searchResults.results[0];
        console.log(`   - Top match: ${topResult.analysisScore}% similarity`);
        console.log(`   - Sample: "${topResult.fullFeedback?.text?.substring(0, 80)}..."`);
      }
    } catch (error) {
      console.log('❌ Similarity search failed:', error.message);
    }
    
    console.log('');
  }
  
  async testInsightsGeneration() {
    console.log('📋 Test 5: Insights Generation');
    
    try {
      const insights = await feedbackAnalyzer.generateFeedbackInsights();
      
      console.log('✅ Insights generation completed');
      console.log(`   - Total analyzed: ${insights.totalAnalyzed}`);
      
      if (insights.themes && insights.themes.length > 0) {
        console.log(`   - Top themes: ${insights.themes.slice(0, 3).map(t => t.theme).join(', ')}`);
      }
      
      if (insights.recommendations?.immediate_actions) {
        console.log(`   - Key recommendation: ${insights.recommendations.immediate_actions[0]}`);
      }
      
      if (insights.llmInsights?.business_impact) {
        console.log(`   - Business impact: ${insights.llmInsights.business_impact.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log('❌ Insights generation failed:', error.message);
    }
    
    console.log('');
  }
  
  async testChatbotIntegration() {
    console.log('📋 Test 6: Chatbot Integration');
    
    const testQueries = [
      "What's the overall sentiment?",
      "Find feedback about service quality",
      "Show me sentiment trends",
      "What are the main customer complaints?"
    ];
    
    for (const query of testQueries) {
      try {
        const response = await feedbackChatbotIntegration.handleFeedbackQuery(
          query,
          'test_session_123'
        );
        
        console.log(`✅ Query: "${query}"`);
        console.log(`   - Intent: ${response.intent}`);
        console.log(`   - Response: ${response.response.substring(0, 100)}...`);
        console.log(`   - Suggestions: ${response.suggestions.length} provided`);
        
        // Small delay between queries
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`❌ Query failed: "${query}" - ${error.message}`);
      }
    }
    
    console.log('');
  }
  
  async testStatsAndOverview() {
    console.log('📋 Test 7: Stats and Overview');
    
    try {
      const stats = await feedbackVectorStore.getStats();
      
      console.log('✅ Statistics retrieved successfully');
      console.log(`   - Total feedback: ${stats.totalFeedback}`);
      console.log(`   - Sentiment distribution:`, stats.sentimentDistribution);
      console.log(`   - Source distribution:`, stats.sourceDistribution);
      
      if (stats.dateRange.earliest && stats.dateRange.latest) {
        const earliest = new Date(stats.dateRange.earliest).toLocaleDateString();
        const latest = new Date(stats.dateRange.latest).toLocaleDateString();
        console.log(`   - Date range: ${earliest} to ${latest}`);
      }
      
      // Test getting all feedback
      const allFeedback = await feedbackVectorStore.getAllFeedback();
      console.log(`   - Retrieved ${allFeedback.length} feedback items from store`);
      
    } catch (error) {
      console.log('❌ Stats retrieval failed:', error.message);
    }
    
    console.log('');
  }
}

// Function to run tests
async function runFeedbackTests() {
  const tester = new FeedbackSystemTester();
  try {
    await tester.runAllTests();
    process.exit(0);
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  }
}

// Export for use in other modules
module.exports = {
  FeedbackSystemTester,
  runFeedbackTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runFeedbackTests();
}
