const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { logger } = require("../utils/logger");
const {
  feedbackDataProcessor,
  feedbackAnalyzer,
  feedbackChatbotIntegration,
  feedbackVectorStore
} = require("../services/feedback-langchain");

const router = express.Router();

// @route   POST /api/feedback/load
// @desc    Load feedback data from CSV
// @access  Private
router.post("/load", protect, async (req, res) => {
  try {
    const { csvPath } = req.body;
    const result = await feedbackDataProcessor.loadFromCSVFile(csvPath);
    
    res.json({
      success: true,
      message: "Feedback data loaded successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error loading feedback data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load feedback data",
      error: error.message,
    });
  }
});

// @route   GET /api/feedback/trends
// @desc    Get sentiment trends analysis
// @access  Private
router.get("/trends", protect, async (req, res) => {
  try {
    const { timeframe = '30d', source, location } = req.query;
    
    const trends = await feedbackAnalyzer.analyzeSentimentTrends({
      timeframe,
      source,
      location
    });
    
    res.json({
      success: true,
      message: "Sentiment trends retrieved successfully",
      data: trends,
    });
  } catch (error) {
    logger.error("Error analyzing sentiment trends:", error);
    res.status(500).json({
      success: false,
      message: "Failed to analyze sentiment trends",
      error: error.message,
    });
  }
});

// @route   POST /api/feedback/search
// @desc    Search for similar feedback
// @access  Private
router.post("/search", protect, async (req, res) => {
  try {
    const { query, limit = 10, sentimentFilter, sourceFilter, similarityThreshold = 0.7 } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }
    
    const results = await feedbackAnalyzer.findSimilarFeedback(query, {
      limit,
      sentimentFilter,
      sourceFilter,
      similarityThreshold
    });
    
    res.json({
      success: true,
      message: "Similar feedback retrieved successfully",
      data: results,
    });
  } catch (error) {
    logger.error("Error searching feedback:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search feedback",
      error: error.message,
    });
  }
});

// @route   GET /api/feedback/insights
// @desc    Generate feedback insights
// @access  Private
router.get("/insights", protect, async (req, res) => {
  try {
    const { feedbackIds } = req.query;
    const ids = feedbackIds ? feedbackIds.split(',') : null;
    
    const insights = await feedbackAnalyzer.generateFeedbackInsights(ids);
    
    res.json({
      success: true,
      message: "Feedback insights generated successfully",
      data: insights,
    });
  } catch (error) {
    logger.error("Error generating feedback insights:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate feedback insights",
      error: error.message,
    });
  }
});

// @route   POST /api/feedback/chat
// @desc    Chat with feedback analyzer
// @access  Private
router.post("/chat", protect, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const companyId = req.user.companyId;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }
    
    const finalSessionId = sessionId || `${companyId}_${Date.now()}`;
    
    const response = await feedbackChatbotIntegration.handleFeedbackQuery(
      message,
      finalSessionId
    );
    
    res.json({
      success: true,
      message: "Feedback query processed successfully",
      data: response,
    });
  } catch (error) {
    logger.error("Error processing feedback chat:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process feedback query",
      error: error.message,
    });
  }
});

// @route   GET /api/feedback/stats
// @desc    Get feedback statistics
// @access  Private
router.get("/stats", protect, async (req, res) => {
  try {
    const stats = await feedbackVectorStore.getStats();
    
    res.json({
      success: true,
      message: "Feedback statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    logger.error("Error getting feedback stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get feedback statistics",
      error: error.message,
    });
  }
});

// @route   POST /api/feedback/question
// @desc    Ask specific question about feedback
// @access  Private
router.post("/question", protect, async (req, res) => {
  try {
    const { question, context = {} } = req.body;
    
    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }
    
    const answer = await feedbackAnalyzer.answerFeedbackQuestion(question, context);
    
    res.json({
      success: true,
      message: "Question answered successfully",
      data: answer,
    });
  } catch (error) {
    logger.error("Error answering feedback question:", error);
    res.status(500).json({
      success: false,
      message: "Failed to answer question",
      error: error.message,
    });
  }
});

// @route   GET /api/feedback
// @desc    Get all feedback data
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const { source, sentiment, limit = 50 } = req.query;
    
    let feedback = await feedbackVectorStore.getAllFeedback();
    
    // Apply filters
    if (source) {
      feedback = feedback.filter(f => f.source === source);
    }
    if (sentiment) {
      feedback = feedback.filter(f => f.sentiment?.toLowerCase() === sentiment.toLowerCase());
    }
    
    // Limit results
    feedback = feedback.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      message: "Feedback data retrieved successfully",
      data: {
        feedback,
        total: feedback.length,
        filters: { source, sentiment, limit }
      },
    });
  } catch (error) {
    logger.error("Error getting feedback data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get feedback data",
      error: error.message,
    });
  }
});

// @route   DELETE /api/feedback/clear
// @desc    Clear all feedback data
// @access  Private
router.delete("/clear", protect, async (req, res) => {
  try {
    await feedbackVectorStore.clearStore();
    
    res.json({
      success: true,
      message: "Feedback data cleared successfully",
    });
  } catch (error) {
    logger.error("Error clearing feedback data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear feedback data",
      error: error.message,
    });
  }
});

module.exports = router;
