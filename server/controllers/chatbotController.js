const { validationResult } = require("express-validator");
const Company = require("../models/Company");
const { ChatbotChain } = require("../services/langchain/contextualChains");
const { businessLogger, aiLogger } = require("../utils/logger");

// Credit costs for chatbot operations
const CREDIT_COSTS = {
  chatbot_response: 1,
  chatbot_training: 5,
  conversation_analysis: 2,
};

// @desc    Generate chatbot response with context
// @route   POST /api/chatbot/respond
// @access  Private
const generateResponse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { userMessage, conversationId, customerInfo, intent } = req.body;
    const company = req.companyData; // From middleware

    // Check and deduct credits
    const requiredCredits = CREDIT_COSTS.chatbot_response;
    if (!company.hasCredits(requiredCredits)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient credits",
        requiredCredits,
        currentCredits: company.credits.currentCredits,
      });
    }

    // Initialize the chatbot chain with context
    const chatbotChain = new ChatbotChain(company._id);

    // Generate contextual response
    const result = await chatbotChain.generateResponse({
      userMessage,
      conversationId: conversationId || `conv_${Date.now()}`,
      customerInfo,
      intent,
    });

    // Deduct credits and update usage
    await company.deductCredits(
      requiredCredits,
      "chatbot_response",
      "Chatbot response generation"
    );
    company.usage.chatbotResponses = (company.usage.chatbotResponses || 0) + 1;
    await company.save();

    // Log business activity
    businessLogger.contentGeneration(company.email, "chatbot_response", true, {
      intent: result.detectedIntent,
      model: result.modelUsed,
      creditsUsed: requiredCredits,
    });

    res.status(200).json({
      success: true,
      message: "Response generated successfully",
      data: {
        response: result.response,
        conversationId: result.conversationId,
        detectedIntent: result.detectedIntent,
        suggestedActions: result.suggestedActions,
        contextInsights: result.contextInsights,
        metadata: {
          tokensUsed: result.metrics.tokenUsage.total,
          processingTime: result.metrics.duration,
          contextSources: result.contextUsed,
          confidence: result.confidence,
        },
        creditsUsed: requiredCredits,
        remainingCredits: company.credits.currentCredits,
      },
    });
  } catch (error) {
    businessLogger.contentGeneration(
      req.company?.email || "unknown",
      "chatbot_response",
      false,
      { error: error.message }
    );

    console.error("Chatbot response error:", error);
    res.status(500).json({
      success: false,
      message: "Error generating chatbot response",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Train chatbot with business-specific context
// @route   POST /api/chatbot/train
// @access  Private
const trainChatbot = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { trainingData, businessInfo, faqData, productInfo } = req.body;
    const company = req.companyData;

    // Check and deduct credits
    const requiredCredits = CREDIT_COSTS.chatbot_training;
    if (!company.hasCredits(requiredCredits)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient credits",
        requiredCredits,
        currentCredits: company.credits.currentCredits,
      });
    }

    // Initialize the chatbot chain with context
    const chatbotChain = new ChatbotChain(company._id);

    // Train chatbot with business context
    const result = await chatbotChain.trainWithBusinessContext({
      trainingData,
      businessInfo,
      faqData,
      productInfo,
    });

    // Deduct credits and update usage
    await company.deductCredits(
      requiredCredits,
      "chatbot_training",
      "Chatbot training"
    );
    company.usage.chatbotTrainingSessions =
      (company.usage.chatbotTrainingSessions || 0) + 1;
    await company.save();

    // Log business activity
    businessLogger.contentGeneration(company.email, "chatbot_training", true, {
      trainingDataSize: trainingData?.length || 0,
      model: result.modelUsed,
      creditsUsed: requiredCredits,
    });

    res.status(200).json({
      success: true,
      message: "Chatbot training completed successfully",
      data: {
        trainingResults: result.trainingResults,
        improvedCapabilities: result.improvedCapabilities,
        contextUpdates: result.contextUpdates,
        metadata: {
          tokensUsed: result.metrics.tokenUsage.total,
          processingTime: result.metrics.duration,
          documentsProcessed: result.documentsProcessed,
        },
        creditsUsed: requiredCredits,
        remainingCredits: company.credits.currentCredits,
      },
    });
  } catch (error) {
    businessLogger.contentGeneration(
      req.company?.email || "unknown",
      "chatbot_training",
      false,
      { error: error.message }
    );

    console.error("Chatbot training error:", error);
    res.status(500).json({
      success: false,
      message: "Error training chatbot",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Analyze conversation patterns
// @route   POST /api/chatbot/analyze
// @access  Private
const analyzeConversations = async (req, res) => {
  try {
    const { timeRange, conversationIds, analysisType } = req.body;
    const company = req.companyData;

    // Check and deduct credits
    const requiredCredits = CREDIT_COSTS.conversation_analysis;
    if (!company.hasCredits(requiredCredits)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient credits",
        requiredCredits,
        currentCredits: company.credits.currentCredits,
      });
    }

    // Initialize the chatbot chain with context
    const chatbotChain = new ChatbotChain(company._id);

    // Analyze conversation patterns
    const result = await chatbotChain.analyzeConversations({
      timeRange,
      conversationIds,
      analysisType: analysisType || "comprehensive",
    });

    // Deduct credits and update usage
    await company.deductCredits(
      requiredCredits,
      "conversation_analysis",
      "Conversation analysis"
    );

    // Log business activity
    businessLogger.contentGeneration(
      company.email,
      "conversation_analysis",
      true,
      {
        analysisType,
        conversationsAnalyzed: result.conversationsAnalyzed,
        creditsUsed: requiredCredits,
      }
    );

    res.status(200).json({
      success: true,
      message: "Conversation analysis completed successfully",
      data: {
        insights: result.insights,
        patterns: result.patterns,
        recommendations: result.recommendations,
        performanceMetrics: result.performanceMetrics,
        metadata: {
          conversationsAnalyzed: result.conversationsAnalyzed,
          timeRange: result.timeRange,
          processingTime: result.metrics.duration,
        },
        creditsUsed: requiredCredits,
        remainingCredits: company.credits.currentCredits,
      },
    });
  } catch (error) {
    businessLogger.contentGeneration(
      req.company?.email || "unknown",
      "conversation_analysis",
      false,
      { error: error.message }
    );

    console.error("Conversation analysis error:", error);
    res.status(500).json({
      success: false,
      message: "Error analyzing conversations",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

module.exports = {
  generateResponse,
  trainChatbot,
  analyzeConversations,
};
