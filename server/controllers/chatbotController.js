const { validationResult } = require("express-validator");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Company = require("../models/Company");
const AIContext = require("../models/AIContext");
const config = require("../config/env-config");
const { logger, aiLogger } = require("../utils/logger");
const {
  feedbackChatbotIntegration,
} = require("../services/feedback-langchain");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(config.geminiApiKey);

/**
 * Process chatbot message with company context
 */
const processMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { message, sessionId } = req.body;
    const companyId = req.company.id;

    // Check if company has sufficient credits
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Check credits for chatbot usage
    if (!company.hasCredits(1)) {
      return res.status(402).json({
        success: false,
        message: "Insufficient credits for chatbot service",
        creditsRequired: 1,
        currentCredits: company.credits.currentCredits,
      });
    }

    logger.info("Processing chatbot message", {
      companyId,
      sessionId,
      messageLength: message.length,
    });

    // Get or create AI context for this session
    let aiContext = await AIContext.findOne({
      companyId,
      contextType: "chatbot",
      sessionId,
    });

    if (!aiContext) {
      aiContext = new AIContext({
        companyId,
        contextType: "chatbot",
        sessionId,
        conversationHistory: [],
        businessContext: {
          extractedPreferences: {},
          communicationPatterns: {},
        },
      });
    }

    // Build context-aware prompt
    const businessInfo = company.businessDescription || "A business";
    const targetAudience = company.targetAudience || "customers";
    const personality =
      company.aiContextProfile?.businessPersonality ||
      "helpful and professional";
    const brandVoice = company.aiContextProfile?.brandVoice || "professional";

    // Get recent conversation history
    const recentHistory = aiContext.conversationHistory
      .slice(-10) // Last 10 messages for context
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    const contextualPrompt = `You are an AI business assistant for "${
      company.companyName || "this company"
    }".

BUSINESS CONTEXT:
- Business Description: ${businessInfo}
- Target Audience: ${targetAudience}
- Communication Style: ${personality}
- Brand Voice: ${brandVoice}
- Services/Products: ${
      company.aiContextProfile?.productServices?.join(", ") ||
      "various services"
    }

RECENT CONVERSATION:
${recentHistory}

INSTRUCTIONS:
- Act as a helpful customer service representative for this specific business
- Use the business context to provide relevant, accurate responses
- Maintain a ${brandVoice} tone that matches the company's communication style
- Reference the company's services and target audience when appropriate
- Be helpful, friendly, and professional
- If you don't know specific details, suggest contacting the business directly
- Keep responses concise but informative (max 200 words)
- Avoid generic responses, no matter how common the query is, and tailor your answers to the specific business context.

User Message: ${message}

Response:`;

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Log AI request
    aiLogger.request("gemini", "gemini-2.5-flash", contextualPrompt, {
      companyId,
      sessionId,
      promptLength: contextualPrompt.length,
    });

    const startTime = Date.now();
    const result = await model.generateContent(contextualPrompt);
    const response = result.response;
    const responseText = response.text();
    const duration = Date.now() - startTime;

    // Log AI response
    aiLogger.response("gemini", "gemini-2.5-flash", responseText, {
      companyId,
      sessionId,
      duration: `${duration}ms`,
      responseLength: responseText.length,
    });

    // Save conversation to context
    aiContext.conversationHistory.push(
      {
        role: "user",
        content: message,
        timestamp: new Date(),
        metadata: {
          sessionId,
        },
      },
      {
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
        metadata: {
          model: "gemini-2.5-flash",
          sessionId,
        },
      }
    );

    // Update business context with conversation patterns
    if (!aiContext.businessContext.communicationPatterns) {
      aiContext.businessContext.communicationPatterns = {};
    }

    // Track common query types
    const queryType = categorizeQuery(message);
    if (queryType) {
      aiContext.businessContext.communicationPatterns[queryType] =
        (aiContext.businessContext.communicationPatterns[queryType] || 0) + 1;
    }

    await aiContext.save();

    // Deduct credits after successful generation
    await company.deductCredits(1, "chatbot", "Chatbot message processing");

    // Update usage tracking
    company.usage.chatbotQueries += 1;
    await company.save();

    logger.info("Chatbot response generated successfully", {
      companyId,
      sessionId,
      responseLength: responseText.length,
    });

    res.json({
      success: true,
      data: {
        response: responseText,
        sessionId,
        creditsRemaining: company.credits.currentCredits - 1,
      },
    });
  } catch (error) {
    // Log AI error if it's related to AI processing
    if (
      error.message.includes("gemini") ||
      error.message.includes("generative")
    ) {
      aiLogger.error("gemini", "gemini-2.5-flash", error, {
        companyId: req.company?.id,
        sessionId: req.body?.sessionId,
      });
    }

    logger.error("Chatbot processing failed:", {
      error: error.message,
      stack: error.stack,
      companyId: req.company?.id,
    });

    res.status(500).json({
      success: false,
      message: "Failed to process chatbot message",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Helper function to categorize user queries
const categorizeQuery = (message) => {
  const lowercaseMessage = message.toLowerCase();

  if (
    lowercaseMessage.includes("price") ||
    lowercaseMessage.includes("cost") ||
    lowercaseMessage.includes("pricing")
  ) {
    return "pricing_inquiry";
  } else if (
    lowercaseMessage.includes("service") ||
    lowercaseMessage.includes("product")
  ) {
    return "service_inquiry";
  } else if (
    lowercaseMessage.includes("contact") ||
    lowercaseMessage.includes("reach") ||
    lowercaseMessage.includes("phone")
  ) {
    return "contact_inquiry";
  } else if (
    lowercaseMessage.includes("about") ||
    lowercaseMessage.includes("company") ||
    lowercaseMessage.includes("business")
  ) {
    return "about_inquiry";
  } else if (
    lowercaseMessage.includes("help") ||
    lowercaseMessage.includes("support")
  ) {
    return "support_request";
  }

  return "general_inquiry";
};

/**
 * Get chatbot conversation history
 */
const getConversationHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const companyId = req.company.id;

    // Get conversation context from AI Context
    const aiContext = await AIContext.findOne({
      companyId,
      contextType: "chatbot",
      sessionId,
    });

    const history = aiContext ? aiContext.conversationHistory : [];

    res.json({
      success: true,
      data: {
        sessionId,
        history,
      },
    });
  } catch (error) {
    logger.error("Failed to get conversation history:", {
      error: error.message,
      companyId: req.company?.id,
      sessionId: req.params.sessionId,
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve conversation history",
    });
  }
};

/**
 * Clear chatbot conversation history
 */
const clearConversationHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const companyId = req.company.id;

    // Clear session context in AIContext
    await AIContext.findOneAndUpdate(
      {
        companyId,
        contextType: "chatbot",
        sessionId,
      },
      {
        $set: { conversationHistory: [] },
      }
    );

    logger.info("Conversation history cleared", {
      companyId,
      sessionId,
    });

    res.json({
      success: true,
      message: "Conversation history cleared successfully",
    });
  } catch (error) {
    logger.error("Failed to clear conversation history:", {
      error: error.message,
      companyId: req.company?.id,
      sessionId: req.params.sessionId,
    });

    res.status(500).json({
      success: false,
      message: "Failed to clear conversation history",
    });
  }
};

/**
 * Process feedback-related queries using the feedback analyzer
 */
const processFeedbackQuery = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { message, sessionId } = req.body;
    const companyId = req.company.id;

    // Check if company has sufficient credits
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Check credits for feedback analysis
    if (!company.hasCredits(1)) {
      return res.status(402).json({
        success: false,
        message: "Insufficient credits for feedback analysis service",
        creditsRequired: 1,
        currentCredits: company.credits.currentCredits,
      });
    }

    logger.info("Processing feedback query", {
      companyId,
      sessionId,
      messageLength: message.length,
      query: message, // Log the actual query for debugging
    });

    // Create a session ID scoped to the company
    const feedbackSessionId = sessionId
      ? `${companyId}_feedback_${sessionId}`
      : `${companyId}_feedback_${Date.now()}`;

    // Detect sentiment trend queries
    const isSentimentTrendQuery =
      message.toLowerCase().includes("sentiment trend") ||
      (message.toLowerCase().includes("sentiment") &&
        message.toLowerCase().includes("month"));

    // Extract timeframe information from the query
    let timeframe = "all";
    if (message.toLowerCase().includes("this month")) timeframe = "this_month";
    else if (message.toLowerCase().includes("last month"))
      timeframe = "last_month";
    else if (message.toLowerCase().includes("week")) timeframe = "week";
    else if (message.toLowerCase().includes("day")) timeframe = "day";

    // Process the feedback query with additional context
    try {
      const feedbackResponse =
        await feedbackChatbotIntegration.handleFeedbackQuery(
          message,
          feedbackSessionId,
          {
            companyId,
            companyName: company.companyName,
            queryType: isSentimentTrendQuery ? "sentiment_trend" : "general",
            timeframe,
            includeAnalytics: true,
          }
        );

      // If it's a sentiment trend query but the response indicates an error,
      // try to fall back to a more general analysis
      if (isSentimentTrendQuery && feedbackResponse.intent === "error") {
        logger.warn("Sentiment trend analysis failed, attempting fallback", {
          companyId,
          sessionId: feedbackSessionId,
        });

        // Try a more general sentiment analysis request
        const fallbackResponse =
          await feedbackChatbotIntegration.handleFeedbackQuery(
            "Give me a general summary of recent feedback sentiment",
            feedbackSessionId,
            {
              companyId,
              companyName: company.companyName,
              queryType: "general_sentiment",
              includeAnalytics: true,
            }
          );

        if (fallbackResponse.intent !== "error") {
          // Use the fallback response instead
          Object.assign(feedbackResponse, fallbackResponse);
        }
      }

      // Deduct credits
      await company.deductCredits(1, "feedback_analysis");
      logger.info("Credits deducted for feedback analysis", {
        companyId,
        creditsUsed: 1,
        remainingCredits: company.credits.currentCredits,
      });

      // Log AI usage for feedback
      aiLogger.response(
        "feedback-analyzer",
        feedbackResponse.intent,
        feedbackResponse.response,
        {
          companyId,
          sessionId: feedbackSessionId,
          intent: feedbackResponse.intent,
          responseLength: feedbackResponse.response.length,
          suggestionsCount: feedbackResponse.suggestions?.length || 0,
        }
      );

      res.json({
        success: true,
        data: {
          response: feedbackResponse.response,
          intent: feedbackResponse.intent,
          suggestions: feedbackResponse.suggestions || [],
          sessionId: feedbackSessionId,
          analysisData: feedbackResponse.data || {},
          timeframe: timeframe,
        },
        creditsUsed: 1,
        remainingCredits: company.credits.currentCredits,
      });
    } catch (processingError) {
      logger.error("Feedback analysis engine error:", {
        error: processingError.message,
        stack: processingError.stack,
        companyId,
        queryType: isSentimentTrendQuery ? "sentiment_trend" : "general",
      });

      // Return a more helpful error message
      res.status(200).json({
        success: true,
        data: {
          response: isSentimentTrendQuery
            ? "I couldn't analyze the sentiment trends at this time. This might be due to insufficient feedback data or a temporary technical issue. Try asking for general feedback insights instead."
            : "I encountered an issue while analyzing the feedback. This could be due to system initialization or data availability. Please try asking for general feedback summaries or contact support if the issue persists.",
          intent: "error",
          suggestions: [
            "Ask about general feedback insights",
            "Check for common feedback themes",
            "Request feedback summaries",
            "Try asking about recent customer comments",
          ],
          sessionId: feedbackSessionId,
          analysisData: {},
          errorType: "system_error",
        },
        creditsUsed: 0,
        remainingCredits: company.credits.currentCredits,
      });
    }
  } catch (error) {
    logger.error("Failed to process feedback query:", {
      error: error.message,
      stack: error.stack,
      companyId: req.company?.id,
      sessionId: req.body?.sessionId,
    });

    res.status(500).json({
      success: false,
      message: "Failed to process feedback query",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

module.exports = {
  processMessage,
  getConversationHistory,
  clearConversationHistory,
  processFeedbackQuery,
};
