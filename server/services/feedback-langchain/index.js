// Main exports for feedback-langchain services
const { feedbackAnalyzer } = require('./analyzer');
const { feedbackChatbotIntegration } = require('./chatbotIntegration');
const { feedbackDataProcessor } = require('./dataProcessor');
const { feedbackLLMService } = require('./llmService');
const { feedbackVectorStore } = require('./vectorStore');

module.exports = {
  // Main services
  feedbackAnalyzer,
  feedbackChatbotIntegration,
  feedbackDataProcessor,
  feedbackLLMService,
  feedbackVectorStore,
  
  // Classes for custom instantiation
  FeedbackAnalyzer: require('./analyzer').FeedbackAnalyzer,
  FeedbackChatbotIntegration: require('./chatbotIntegration').FeedbackChatbotIntegration,
  FeedbackDataProcessor: require('./dataProcessor').FeedbackDataProcessor,
  FeedbackLLMService: require('./llmService').FeedbackLLMService,
  FeedbackVectorStore: require('./vectorStore').FeedbackVectorStore,
};
