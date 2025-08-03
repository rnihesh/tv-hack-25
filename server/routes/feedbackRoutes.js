const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");
const { protect } = require("../middlewares/authMiddleware");
const { logger } = require("../utils/logger");
const {
  feedbackDataProcessor,
  feedbackAnalyzer,
  feedbackChatbotIntegration,
  feedbackVectorStore,
} = require("../services/feedback-langchain");

// Configure multer for CSV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/feedback");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `feedback-${uniqueSuffix}.csv`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "text/csv" ||
      path.extname(file.originalname).toLowerCase() === ".csv"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed!"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

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
    const { timeframe = "30d", source, location } = req.query;

    const trends = await feedbackAnalyzer.analyzeSentimentTrends({
      timeframe,
      source,
      location,
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
    const {
      query,
      limit = 10,
      sentimentFilter,
      sourceFilter,
      similarityThreshold = 0.7,
    } = req.body;

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
      similarityThreshold,
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
    const ids = feedbackIds ? feedbackIds.split(",") : null;

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

    const answer = await feedbackAnalyzer.answerFeedbackQuestion(
      question,
      context
    );

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
      feedback = feedback.filter((f) => f.source === source);
    }
    if (sentiment) {
      feedback = feedback.filter(
        (f) => f.sentiment?.toLowerCase() === sentiment.toLowerCase()
      );
    }

    // Limit results
    feedback = feedback.slice(0, parseInt(limit));

    res.json({
      success: true,
      message: "Feedback data retrieved successfully",
      data: {
        feedback,
        total: feedback.length,
        filters: { source, sentiment, limit },
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

// @route   POST /api/feedback/upload-csv
// @desc    Upload and process CSV feedback file
// @access  Private
router.post(
  "/upload-csv",
  protect,
  upload.single("csvFile"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No CSV file uploaded",
        });
      }

      const csvPath = req.file.path;
      logger.info(`Processing uploaded CSV: ${csvPath}`);

      // Load and process the CSV data
      const result = await feedbackDataProcessor.loadFromCSVFile(csvPath);

      // Clean up the uploaded file
      fs.unlinkSync(csvPath);

      res.json({
        success: true,
        message: "CSV file processed successfully",
        data: {
          recordsProcessed: result.recordsProcessed,
          fileName: req.file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error("Error processing CSV upload:", error);

      // Clean up file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: "Failed to process CSV file",
        error: error.message,
      });
    }
  }
);

// @route   POST /api/feedback/comprehensive-analysis
// @desc    Generate comprehensive feedback analysis
// @access  Private
router.post("/comprehensive-analysis", protect, async (req, res) => {
  try {
    const { filters = {} } = req.body;

    logger.info("Generating comprehensive feedback analysis");

    // Get all feedback data
    const feedback = await feedbackVectorStore.getAllFeedback();

    if (!feedback || feedback.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No feedback data available for analysis",
      });
    }

    // Generate comprehensive analysis
    const [sentimentTrends, insights, recommendations, themes] =
      await Promise.all([
        feedbackAnalyzer.analyzeSentimentTrends({ timeframe: "30d" }),
        feedbackAnalyzer.generateLLMInsights(feedback),
        feedbackAnalyzer.generateRecommendations(feedback),
        feedbackAnalyzer.extractThemes(feedback),
      ]);

    // Calculate sentiment distribution
    const sentimentDistribution = feedback.reduce((acc, item) => {
      const sentiment = item.sentiment || "neutral";
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {});

    // Calculate confidence scores
    const avgConfidence =
      feedback.reduce((sum, item) => {
        return sum + (item.confidence || 0);
      }, 0) / feedback.length;

    // Extract pain points and positive highlights
    const negativeFeedback = feedback.filter(
      (item) => item.sentiment === "negative" && item.confidence > 0.7
    );
    const positiveFeedback = feedback.filter(
      (item) => item.sentiment === "positive" && item.confidence > 0.7
    );

    const painPoints = negativeFeedback.slice(0, 5).map((item) => ({
      text: item.text,
      confidence: item.confidence,
      emotions: item.emotions || [],
    }));

    const positiveHighlights = positiveFeedback.slice(0, 5).map((item) => ({
      text: item.text,
      confidence: item.confidence,
      emotions: item.emotions || [],
    }));

    const analysisResult = {
      summary: {
        totalFeedback: feedback.length,
        avgConfidence: Math.round(avgConfidence * 100),
        analysisDate: new Date().toISOString(),
        timeframe: filters.timeframe || "30d",
      },
      sentimentDistribution,
      sentimentTrends,
      insights: insights.insights || [],
      recommendations: recommendations.recommendations || [],
      themes: themes.themes || [],
      painPoints,
      positiveHighlights,
      metrics: {
        satisfactionScore: Math.round(
          ((sentimentDistribution.positive || 0) / feedback.length) * 100
        ),
        urgentIssues: negativeFeedback.filter(
          (item) =>
            item.confidence > 0.8 &&
            item.emotions?.some(
              (emotion) =>
                emotion.emotion === "anger" && emotion.intensity > 0.7
            )
        ).length,
        trendDirection: sentimentTrends.trend || "stable",
      },
    };

    res.json({
      success: true,
      message: "Comprehensive analysis generated successfully",
      data: analysisResult,
    });
  } catch (error) {
    logger.error("Error generating comprehensive analysis:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate comprehensive analysis",
      error: error.message,
    });
  }
});

module.exports = router;
