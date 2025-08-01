const { validationResult } = require('express-validator');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Company = require('../models/Company');
const AIContext = require('../models/AIContext');
const config = require('../config/env-config');
const { logger, aiLogger } = require('../utils/logger');

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
        errors: errors.array()
      });
    }

    const { message, sessionId } = req.body;
    const companyId = req.company.id;

    // Check if company has sufficient credits
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check credits for chatbot usage
    if (!company.hasCredits(1)) {
      return res.status(402).json({
        success: false,
        message: 'Insufficient credits for chatbot service',
        creditsRequired: 1,
        currentCredits: company.credits.currentCredits
      });
    }

    aiLogger.info('Processing chatbot message', {
      companyId,
      sessionId,
      messageLength: message.length
    });

    // Get or create AI context for this session
    let aiContext = await AIContext.findOne({
      companyId,
      contextType: 'chatbot',
      sessionId
    });

    if (!aiContext) {
      aiContext = new AIContext({
        companyId,
        contextType: 'chatbot',
        sessionId,
        conversationHistory: [],
        businessContext: {
          extractedPreferences: {},
          communicationPatterns: {}
        }
      });
    }

    // Build context-aware prompt
    const businessInfo = company.businessDescription || 'A business';
    const targetAudience = company.targetAudience || 'customers';
    const personality = company.aiContextProfile?.businessPersonality || 'helpful and professional';
    const brandVoice = company.aiContextProfile?.brandVoice || 'professional';

    // Get recent conversation history
    const recentHistory = aiContext.conversationHistory
      .slice(-10) // Last 10 messages for context
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const contextualPrompt = `You are an AI business assistant for "${company.companyName || 'this company'}".

BUSINESS CONTEXT:
- Business Description: ${businessInfo}
- Target Audience: ${targetAudience}
- Communication Style: ${personality}
- Brand Voice: ${brandVoice}
- Services/Products: ${company.aiContextProfile?.productServices?.join(', ') || 'various services'}

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

User Message: ${message}

Response:`;

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const result = await model.generateContent(contextualPrompt);
    const response = result.response;
    const responseText = response.text();

    // Save conversation to context
    aiContext.conversationHistory.push(
      {
        role: 'user',
        content: message,
        timestamp: new Date(),
        metadata: {
          sessionId
        }
      },
      {
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        metadata: {
          model: 'gemini-2.5-flash',
          sessionId
        }
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
    await company.deductCredits('chatbot', 1, 'Chatbot message processing');

    // Update usage tracking
    company.usage.chatbotQueries += 1;
    await company.save();

    aiLogger.info('Chatbot response generated successfully', {
      companyId,
      sessionId,
      responseLength: responseText.length
    });

    res.json({
      success: true,
      data: {
        response: responseText,
        sessionId,
        creditsRemaining: company.credits.currentCredits - 1
      }
    });

  } catch (error) {
    logger.error('Chatbot processing failed:', {
      error: error.message,
      stack: error.stack,
      companyId: req.company?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to process chatbot message',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Helper function to categorize user queries
const categorizeQuery = (message) => {
  const lowercaseMessage = message.toLowerCase();
  
  if (lowercaseMessage.includes('price') || lowercaseMessage.includes('cost') || lowercaseMessage.includes('pricing')) {
    return 'pricing_inquiry';
  } else if (lowercaseMessage.includes('service') || lowercaseMessage.includes('product')) {
    return 'service_inquiry';
  } else if (lowercaseMessage.includes('contact') || lowercaseMessage.includes('reach') || lowercaseMessage.includes('phone')) {
    return 'contact_inquiry';
  } else if (lowercaseMessage.includes('about') || lowercaseMessage.includes('company') || lowercaseMessage.includes('business')) {
    return 'about_inquiry';
  } else if (lowercaseMessage.includes('help') || lowercaseMessage.includes('support')) {
    return 'support_request';
  }
  
  return 'general_inquiry';
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
      contextType: 'chatbot',
      sessionId
    });

    const history = aiContext ? aiContext.conversationHistory : [];

    res.json({
      success: true,
      data: {
        sessionId,
        history
      }
    });

  } catch (error) {
    logger.error('Failed to get conversation history:', {
      error: error.message,
      companyId: req.company?.id,
      sessionId: req.params.sessionId
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversation history'
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
        contextType: 'chatbot',
        sessionId
      },
      {
        $set: { conversationHistory: [] }
      }
    );

    logger.info('Conversation history cleared', {
      companyId,
      sessionId
    });

    res.json({
      success: true,
      message: 'Conversation history cleared successfully'
    });

  } catch (error) {
    logger.error('Failed to clear conversation history:', {
      error: error.message,
      companyId: req.company?.id,
      sessionId: req.params.sessionId
    });

    res.status(500).json({
      success: false,
      message: 'Failed to clear conversation history'
    });
  }
};

module.exports = {
  processMessage,
  getConversationHistory,
  clearConversationHistory
};
