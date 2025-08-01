const { validationResult } = require("express-validator");
const Company = require("../models/Company");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { businessLogger, aiLogger } = require("../utils/logger");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Credit costs for chatbot operations
const CREDIT_COSTS = {
  chatbot_response: 1,
};

// @desc    Simple chat with Gemini AI
// @route   POST /api/chatbot/chat
// @access  Private
const chat = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { message, conversationHistory = [] } = req.body;
    const company = req.companyData; // From middleware

    // Check and deduct credits
    const hasCredits = await company.useCredits(CREDIT_COSTS.chatbot_response);
    if (!hasCredits) {
      return res.status(402).json({
        success: false,
        message: "Insufficient credits for chatbot response",
        creditsRequired: CREDIT_COSTS.chatbot_response,
        currentCredits: company.credits.current,
      });
    }

    try {
      // Get the generative model
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      // Build conversation context
      let conversationContext = "";
      if (conversationHistory.length > 0) {
        conversationContext = conversationHistory
          .slice(-5) // Last 5 messages for context
          .map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.message}`)
          .join('\n');
        conversationContext += '\n';
      }

      // Create the prompt
      const prompt = `You are a helpful AI assistant. You are professional, friendly, and informative. 

Previous conversation:
${conversationContext}

User: ${message}

Please provide a helpful and relevant response:`;

      // Generate response
      const result = await model.generateContent(prompt);
      const response = result.response;
      const responseText = response.text();

      // Log the interaction
      aiLogger.info('Chatbot response generated', {
        companyId: company._id,
        userMessage: message,
        responseLength: responseText.length,
        creditsUsed: CREDIT_COSTS.chatbot_response,
        remainingCredits: company.credits.current
      });

      res.json({
        success: true,
        response: responseText,
        creditsUsed: CREDIT_COSTS.chatbot_response,
        remainingCredits: company.credits.current,
      });

    } catch (aiError) {
      // Refund credits on AI error
      await company.refundCredits(CREDIT_COSTS.chatbot_response);
      
      aiLogger.error('Gemini AI error', {
        companyId: company._id,
        error: aiError.message,
        userMessage: message
      });

      res.status(500).json({
        success: false,
        message: "AI service temporarily unavailable",
        error: process.env.NODE_ENV === 'development' ? aiError.message : undefined,
      });
    }

  } catch (error) {
    businessLogger.error('Chat endpoint error', {
      companyId: req.companyData?._id,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  chat,
};
