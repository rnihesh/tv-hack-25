const { feedbackAnalyzer } = require('./analyzer');
const { feedbackDataProcessor } = require('./dataProcessor');
const { feedbackVectorStore } = require('./vectorStore');
const { feedbackLLMService } = require('./llmService');
const { logger } = require('../../utils/logger');

class FeedbackChatbotIntegration {
  constructor() {
    this.initialized = false;
    this.conversationContext = new Map(); // Store conversation context by session
  }

  async initialize() {
    try {
      await feedbackAnalyzer.initialize();
      this.initialized = true;
      logger.info('Feedback chatbot integration initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize feedback chatbot integration:', error);
      throw error;
    }
  }

  async handleFeedbackQuery(userMessage, sessionId, context = {}) {
    try {
      if (!this.initialized) await this.initialize();

      // Get or create conversation context
      const conversationHistory = this.conversationContext.get(sessionId) || [];
      
      // Determine query intent
      const intent = this.analyzeQueryIntent(userMessage);
      
      let response;
      let responseData = {};

      switch (intent.type) {
        case 'sentiment_analysis':
          response = await this.handleSentimentQuery(userMessage, intent, conversationHistory);
          break;
          
        case 'find_similar':
          response = await this.handleSimilarityQuery(userMessage, intent, conversationHistory);
          break;
          
        case 'trends_analysis':
          response = await this.handleTrendsQuery(userMessage, intent, conversationHistory);
          break;
          
        case 'insights_request':
          response = await this.handleInsightsQuery(userMessage, intent, conversationHistory);
          break;
          
        case 'specific_feedback':
          response = await this.handleSpecificFeedbackQuery(userMessage, intent, conversationHistory);
          break;
          
        case 'general_question':
        default:
          response = await this.handleGeneralQuery(userMessage, intent, conversationHistory);
          break;
      }

      // Update conversation context
      conversationHistory.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
        intent: intent.type
      });
      
      conversationHistory.push({
        role: 'assistant',
        content: response.text,
        timestamp: new Date().toISOString(),
        data: responseData
      });

      // Keep only last 10 messages
      if (conversationHistory.length > 10) {
        conversationHistory.splice(0, conversationHistory.length - 10);
      }
      
      this.conversationContext.set(sessionId, conversationHistory);

      return {
        response: response.text,
        intent: intent.type,
        data: response.data || {},
        suggestions: this.generateFollowUpSuggestions(intent.type, response.data),
        sessionId
      };
    } catch (error) {
      logger.error('Error handling feedback query:', error);
      return {
        response: "I apologize, but I encountered an error while analyzing the feedback. Please try again.",
        intent: 'error',
        data: {},
        suggestions: ['Try asking about sentiment trends', 'Ask for feedback insights'],
        sessionId
      };
    }
  }

  analyzeQueryIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    // Sentiment analysis queries
    if (lowerMessage.includes('sentiment') || lowerMessage.includes('feeling') || 
        lowerMessage.includes('positive') || lowerMessage.includes('negative')) {
      return { type: 'sentiment_analysis', confidence: 0.8 };
    }
    
    // Similarity queries
    if (lowerMessage.includes('similar') || lowerMessage.includes('like') || 
        lowerMessage.includes('find feedback about')) {
      return { type: 'find_similar', confidence: 0.7 };
    }
    
    // Trends queries
    if (lowerMessage.includes('trend') || lowerMessage.includes('over time') || 
        lowerMessage.includes('pattern') || lowerMessage.includes('change')) {
      return { type: 'trends_analysis', confidence: 0.8 };
    }
    
    // Insights queries
    if (lowerMessage.includes('insight') || lowerMessage.includes('analysis') || 
        lowerMessage.includes('summary') || lowerMessage.includes('overview')) {
      return { type: 'insights_request', confidence: 0.7 };
    }
    
    // Specific feedback queries
    if (lowerMessage.includes('feedback about') || lowerMessage.includes('what do customers say')) {
      return { type: 'specific_feedback', confidence: 0.6 };
    }
    
    return { type: 'general_question', confidence: 0.5 };
  }

  async handleSentimentQuery(message, intent, history) {
    try {
      // Extract timeframe and filters from message
      const timeframe = this.extractTimeframe(message);
      const source = this.extractSource(message);
      
      const analysis = await feedbackAnalyzer.analyzeSentimentTrends({
        timeframe,
        source
      });

      const responseText = this.formatSentimentResponse(analysis);
      
      return {
        text: responseText,
        data: analysis
      };
    } catch (error) {
      logger.error('Error handling sentiment query:', error);
      return {
        text: "I couldn't analyze the sentiment trends right now. Please try again.",
        data: {}
      };
    }
  }

  async handleSimilarityQuery(message, intent, history) {
    try {
      // Extract the search query from the message
      const searchQuery = this.extractSearchQuery(message);
      
      const results = await feedbackAnalyzer.findSimilarFeedback(searchQuery, {
        limit: 5,
        similarityThreshold: 0.6
      });

      const responseText = this.formatSimilarityResponse(results, searchQuery);
      
      return {
        text: responseText,
        data: results
      };
    } catch (error) {
      logger.error('Error handling similarity query:', error);
      return {
        text: "I couldn't find similar feedback right now. Please try again.",
        data: {}
      };
    }
  }

  async handleTrendsQuery(message, intent, history) {
    try {
      const timeframe = this.extractTimeframe(message);
      
      const trends = await feedbackAnalyzer.analyzeSentimentTrends({
        timeframe
      });

      const responseText = this.formatTrendsResponse(trends);
      
      return {
        text: responseText,
        data: trends
      };
    } catch (error) {
      logger.error('Error handling trends query:', error);
      return {
        text: "I couldn't analyze trends right now. Please try again.",
        data: {}
      };
    }
  }

  async handleInsightsQuery(message, intent, history) {
    try {
      const insights = await feedbackAnalyzer.generateFeedbackInsights();
      const responseText = this.formatInsightsResponse(insights);
      
      return {
        text: responseText,
        data: insights
      };
    } catch (error) {
      logger.error('Error handling insights query:', error);
      return {
        text: "I couldn't generate insights right now. Please try again.",
        data: {}
      };
    }
  }

  async handleSpecificFeedbackQuery(message, intent, history) {
    try {
      const answer = await feedbackAnalyzer.answerFeedbackQuestion(message);
      
      return {
        text: answer.answer,
        data: answer
      };
    } catch (error) {
      logger.error('Error handling specific feedback query:', error);
      return {
        text: "I couldn't find specific feedback information right now. Please try again.",
        data: {}
      };
    }
  }

  async handleGeneralQuery(message, intent, history) {
    try {
      const answer = await feedbackAnalyzer.answerFeedbackQuestion(message);
      
      return {
        text: answer.answer,
        data: answer
      };
    } catch (error) {
      logger.error('Error handling general query:', error);
      return {
        text: "I'm here to help you analyze customer feedback. You can ask me about sentiment trends, find similar feedback, or get insights about your customer feedback data.",
        data: {}
      };
    }
  }

  // Helper methods for text extraction and formatting
  extractTimeframe(message) {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('week') || lowerMessage.includes('7 day')) return '7d';
    if (lowerMessage.includes('month') || lowerMessage.includes('30 day')) return '30d';
    if (lowerMessage.includes('quarter') || lowerMessage.includes('90 day')) return '90d';
    if (lowerMessage.includes('year') || lowerMessage.includes('365 day')) return '1y';
    return '30d'; // default
  }

  extractSource(message) {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('twitter')) return 'Twitter';
    if (lowerMessage.includes('yelp')) return 'Yelp Reviews';
    if (lowerMessage.includes('amazon')) return 'Amazon Reviews';
    if (lowerMessage.includes('website')) return 'Website Testimonial';
    return null;
  }

  extractSearchQuery(message) {
    // Simple extraction - can be enhanced with NLP
    const aboutMatch = message.match(/about (.+?)(\?|$)/i);
    if (aboutMatch) return aboutMatch[1];
    
    const similarMatch = message.match(/similar to (.+?)(\?|$)/i);
    if (similarMatch) return similarMatch[1];
    
    return message; // fallback to full message
  }

  formatSentimentResponse(analysis) {
    const { overallMetrics, insights } = analysis;
    
    return `Based on ${analysis.totalFeedback} feedback items in the ${analysis.timeframe} timeframe:

📊 **Sentiment Distribution:**
• Positive: ${overallMetrics.positivePercentage}% (${overallMetrics.positive} items)
• Negative: ${overallMetrics.negativePercentage}% (${overallMetrics.negative} items)  
• Neutral: ${overallMetrics.neutralPercentage}% (${overallMetrics.neutral} items)

💡 **Key Insights:**
${insights.summary || 'Analysis shows overall customer sentiment patterns.'}

${insights.key_trends ? `🔍 **Trends:** ${insights.key_trends.join(', ')}` : ''}`;
  }

  formatSimilarityResponse(results, query) {
    if (results.totalResults === 0) {
      return `I couldn't find any feedback similar to "${query}". Try using different keywords or check if you have feedback data loaded.`;
    }

    const topResults = results.results.slice(0, 3);
    let response = `Found ${results.totalResults} feedback items similar to "${query}":\n\n`;
    
    topResults.forEach((result, index) => {
      const feedback = result.fullFeedback;
      response += `${index + 1}. **${feedback.sentiment || 'Unknown'} sentiment** (${result.analysisScore}% match)\n`;
      response += `   "${feedback.text.substring(0, 100)}..."\n`;
      response += `   Source: ${feedback.source} | ${feedback.location}\n\n`;
    });

    return response;
  }

  formatTrendsResponse(trends) {
    const { sentimentTrends, overallMetrics, insights } = trends;
    const recentTrends = sentimentTrends.slice(-7);
    
    let response = `📈 **Sentiment Trends Analysis (${trends.timeframe})**\n\n`;
    response += `**Overall:** ${overallMetrics.positivePercentage}% positive, ${overallMetrics.negativePercentage}% negative\n\n`;
    
    if (insights.key_trends) {
      response += `**Key Trends:**\n`;
      insights.key_trends.forEach(trend => {
        response += `• ${trend}\n`;
      });
    }
    
    if (insights.concerns && insights.concerns.length > 0) {
      response += `\n⚠️ **Areas of Concern:**\n`;
      insights.concerns.forEach(concern => {
        response += `• ${concern}\n`;
      });
    }

    return response;
  }

  formatInsightsResponse(insights) {
    let response = `📋 **Feedback Analysis Summary**\n\n`;
    response += `Analyzed ${insights.totalAnalyzed} feedback items\n\n`;
    
    if (insights.themes && insights.themes.length > 0) {
      response += `**Top Themes:**\n`;
      insights.themes.slice(0, 5).forEach(theme => {
        response += `• ${theme.theme} (${theme.count} mentions)\n`;
      });
      response += '\n';
    }
    
    if (insights.llmInsights?.customer_pain_points) {
      response += `**Pain Points:**\n`;
      insights.llmInsights.customer_pain_points.forEach(point => {
        response += `• ${point}\n`;
      });
      response += '\n';
    }
    
    if (insights.recommendations?.immediate_actions) {
      response += `**Recommended Actions:**\n`;
      insights.recommendations.immediate_actions.forEach(action => {
        response += `• ${action}\n`;
      });
    }

    return response;
  }

  generateFollowUpSuggestions(intentType, data) {
    const suggestions = [];
    
    switch (intentType) {
      case 'sentiment_analysis':
        suggestions.push('Show me negative feedback details');
        suggestions.push('What are the main themes in positive feedback?');
        suggestions.push('Compare sentiment across different sources');
        break;
        
      case 'trends_analysis':
        suggestions.push('What caused the recent sentiment changes?');
        suggestions.push('Show me feedback from last week');
        suggestions.push('Generate improvement recommendations');
        break;
        
      case 'insights_request':
        suggestions.push('Find similar feedback about service quality');
        suggestions.push('Show sentiment trends over time');
        suggestions.push('What do customers say about pricing?');
        break;
        
      default:
        suggestions.push('Analyze sentiment trends');
        suggestions.push('Show me feedback insights');
        suggestions.push('Find feedback about specific topics');
    }
    
    return suggestions;
  }

  getConversationHistory(sessionId) {
    return this.conversationContext.get(sessionId) || [];
  }

  clearConversation(sessionId) {
    this.conversationContext.delete(sessionId);
  }
}

// Create singleton instance
const feedbackChatbotIntegration = new FeedbackChatbotIntegration();

module.exports = {
  FeedbackChatbotIntegration,
  feedbackChatbotIntegration,
};
