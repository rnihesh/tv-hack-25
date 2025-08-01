// Central model exports for the AI Business Toolkit
const Company = require("./Company");
const AIContext = require("./AIContext");
const WebsiteTemplate = require("./Website");
const EmailCampaign = require("./Marketing");
const GeneratedContent = require("./Media");
const ChatbotConfig = require("./Chatbot");
const ImageGen = require("./ImageGen");
const { Feedback, FeedbackAnalytics } = require("./Feedback");
const {
  SubscriptionPlan,
  Payment,
  CreditPackage,
  CreditTransaction,
  AIServiceAnalytics,
} = require("./Subscription");
const { VectorStore, DocumentChunk, SearchHistory } = require("./VectorStore");

module.exports = {
  // Core User/Company Models
  Company,
  AIContext,

  // Content Generation Models
  WebsiteTemplate,
  EmailCampaign,
  GeneratedContent,
  ChatbotConfig,
  ImageGen,

  // Feedback & Analytics Models
  Feedback,
  FeedbackAnalytics,

  // Subscription & Payment Models
  SubscriptionPlan,
  Payment,
  CreditPackage,
  CreditTransaction,
  AIServiceAnalytics,

  // Vector Store & LangChain Models
  VectorStore,
  DocumentChunk,
  SearchHistory,
};
