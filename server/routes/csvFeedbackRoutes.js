const express = require("express");
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");
const multer = require("multer");
const { protect } = require("../middlewares/authMiddleware");
const { logger } = require("../utils/logger");
const {
  feedbackDataProcessor,
  feedbackAnalyzer,
  feedbackChatbotIntegration,
  feedbackVectorStore,
} = require("../services/feedback-langchain");

// Configure multer for CSV uploads (demo purposes)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `demo-${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const router = express.Router();

// @route   POST /api/csv-feedback/quick-analyze
// @desc    Quick analysis of feedback.csv for presentation (no LLM processing)
// @access  Public (for demo purposes)
router.post("/quick-analyze", async (req, res) => {
  try {
    const csvPath = path.join(__dirname, "../../client/public/feedback.csv");

    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({
        success: false,
        message: "feedback.csv not found in public folder",
      });
    }

    logger.info("Quick processing feedback CSV for presentation");

    // Read CSV data directly without LLM processing
    const feedbackData = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(
          csv({
            skipEmptyLines: true,
            skipLinesWithError: true,
            separator: ", ",
            headers: false,
          })
        )
        .on("data", (row) => {
          // Skip the header row
          if (row["0"] && row["0"].includes("Text, Sentiment, Source")) {
            return;
          }

          // Parse the malformed CSV manually
          const rowText = Object.values(row).join(", ");
          if (!rowText || rowText.length < 10) return;

          // Use regex to extract components from the combined string
          const match = rowText.match(
            /^"([^"]+)",\s*(\w+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([0-9.]+)/
          );

          if (match) {
            const [
              ,
              text,
              sentiment,
              source,
              datetime,
              userid,
              location,
              confidence,
            ] = match;

            feedbackData.push({
              text: text.trim(),
              sentiment: sentiment.toLowerCase().trim(),
              source: source.trim(),
              date: datetime.trim(),
              confidence: parseFloat(confidence),
              location: location.trim(),
            });
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });

    // Calculate quick statistics
    const totalFeedback = feedbackData.length;

    // Sentiment distribution
    const sentimentDistribution = feedbackData.reduce((acc, item) => {
      const sentiment = item.sentiment.toLowerCase();
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {});

    // Source distribution
    const sourceDistribution = feedbackData.reduce((acc, item) => {
      acc[item.source] = (acc[item.source] || 0) + 1;
      return acc;
    }, {});

    // Average confidence
    const avgConfidence =
      feedbackData.reduce((sum, item) => sum + item.confidence, 0) /
      totalFeedback;

    // Quick insights based on statistical analysis
    const positiveCount = sentimentDistribution.positive || 0;
    const negativeCount = sentimentDistribution.negative || 0;
    const neutralCount = sentimentDistribution.neutral || 0;

    const positivePercentage = Math.round(
      (positiveCount / totalFeedback) * 100
    );
    const negativePercentage = Math.round(
      (negativeCount / totalFeedback) * 100
    );
    const neutralPercentage = Math.round((neutralCount / totalFeedback) * 100);

    // Generate quick analysis report
    const analysisReport = `# 📊 **Feedback Analysis Report**

## 📈 **Key Metrics**

- **Total Feedback Analyzed**: ${totalFeedback} entries
- **Average Confidence**: ${Math.round(avgConfidence * 100)}%
- **Analysis Date**: ${new Date().toLocaleString()}

## 🎯 **Sentiment Overview**

### 📊 Distribution:
- **✅ Positive**: ${positiveCount} (${positivePercentage}%)
- **❌ Negative**: ${negativeCount} (${negativePercentage}%) 
- **➖ Neutral**: ${neutralCount} (${neutralPercentage}%)

### 📈 **Sentiment Health Score**: ${
      positivePercentage > 60
        ? "🟢 Excellent"
        : positivePercentage > 40
        ? "🟡 Good"
        : "🔴 Needs Attention"
    } (${positivePercentage}% positive)

## 📍 **Feedback Sources**

${Object.entries(sourceDistribution)
  .map(
    ([source, count]) =>
      `- **${source}**: ${count} entries (${Math.round(
        (count / totalFeedback) * 100
      )}%)`
  )
  .join("\n")}

## 🎯 **Quick Insights**

${
  positivePercentage > 60
    ? "✅ **Strong Performance**: Customer sentiment is predominantly positive. This indicates good service quality and customer satisfaction."
    : positivePercentage > 40
    ? "⚠️ **Moderate Performance**: Customer sentiment is mixed. There are opportunities for improvement in service delivery."
    : "🚨 **Action Required**: High negative sentiment detected. Immediate attention needed to address customer concerns."
}

${
  negativePercentage > 30
    ? "\n🔍 **Priority Focus**: With " +
      negativePercentage +
      "% negative feedback, consider investigating common complaint patterns and implementing improvements."
    : ""
}

## 📋 **Recommendations**

${
  positivePercentage > 60
    ? "- **Maintain Excellence**: Continue current practices that drive positive sentiment\n- **Leverage Success**: Use positive feedback for marketing and testimonials"
    : "- **Improve Service Quality**: Focus on addressing negative feedback patterns\n- **Enhance Communication**: Better customer communication and support"
}
- **Monitor Trends**: Set up regular feedback analysis to track improvements
- **Source Optimization**: Focus on high-volume feedback sources for maximum impact

---
*Report generated in real-time from ${totalFeedback} feedback entries*`;

    res.json({
      success: true,
      message: "Quick feedback analysis completed",
      data: {
        analysis: analysisReport,
        summary: {
          totalFeedback,
          avgConfidence: Math.round(avgConfidence * 100),
          analysisDate: new Date().toISOString(),
          fileName: "feedback.csv",
          processingTime: "< 1 second",
        },
        metrics: {
          sentimentDistribution,
          sourceDistribution,
          percentages: {
            positive: positivePercentage,
            negative: negativePercentage,
            neutral: neutralPercentage,
          },
        },
      },
    });
  } catch (error) {
    logger.error("Error in quick CSV analysis:", error);
    res.status(500).json({
      success: false,
      message: "Failed to analyze CSV file",
      error: error.message,
    });
  }
});

// @route   POST /api/csv-feedback/upload-and-analyze
// @desc    Upload CSV file and provide quick analysis (for demo purposes)
// @access  Public (for demo purposes)
router.post(
  "/upload-and-analyze",
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
      logger.info(`Processing uploaded CSV for demo analysis: ${csvPath}`);

      // Read CSV data and provide quick analysis
      const feedbackData = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(csvPath)
          .pipe(
            csv({
              skipEmptyLines: true,
              skipLinesWithError: true,
            })
          )
          .on("data", (row) => {
            // Try to extract feedback data from common CSV formats
            const text =
              row.text ||
              row.Text ||
              row.comment ||
              row.Comment ||
              row.feedback ||
              row.Feedback ||
              Object.values(row)[0];
            const sentiment = row.sentiment || row.Sentiment || "neutral";
            const source = row.source || row.Source || "Upload";
            const confidence = parseFloat(
              row.confidence || row.Confidence || "0.8"
            );

            if (text && text.length > 5) {
              feedbackData.push({
                text: text.trim(),
                sentiment: sentiment.toLowerCase().trim(),
                source: source.trim(),
                confidence: confidence,
                date: row.date || row.Date || new Date().toISOString(),
              });
            }
          })
          .on("end", resolve)
          .on("error", reject);
      });

      // Clean up uploaded file
      fs.unlinkSync(csvPath);

      if (feedbackData.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "No valid feedback data found in CSV. Please ensure your CSV has columns like 'text', 'comment', or 'feedback'.",
        });
      }

      // Calculate quick statistics
      const totalFeedback = feedbackData.length;
      const sentimentDistribution = feedbackData.reduce((acc, item) => {
        const sentiment = item.sentiment.toLowerCase();
        if (["positive", "negative", "neutral"].includes(sentiment)) {
          acc[sentiment] = (acc[sentiment] || 0) + 1;
        } else {
          acc["neutral"] = (acc["neutral"] || 0) + 1;
        }
        return acc;
      }, {});

      const sourceDistribution = feedbackData.reduce((acc, item) => {
        acc[item.source] = (acc[item.source] || 0) + 1;
        return acc;
      }, {});

      const avgConfidence =
        feedbackData.reduce((sum, item) => sum + item.confidence, 0) /
        totalFeedback;

      const positiveCount = sentimentDistribution.positive || 0;
      const negativeCount = sentimentDistribution.negative || 0;
      const neutralCount = sentimentDistribution.neutral || 0;

      const positivePercentage = Math.round(
        (positiveCount / totalFeedback) * 100
      );
      const negativePercentage = Math.round(
        (negativeCount / totalFeedback) * 100
      );
      const neutralPercentage = Math.round(
        (neutralCount / totalFeedback) * 100
      );

      // Generate analysis report
      const analysisReport = `# 📊 **Your CSV Feedback Analysis**

## 📈 **Key Metrics**

- **Total Feedback Analyzed**: ${totalFeedback} entries
- **Average Confidence**: ${Math.round(avgConfidence * 100)}%
- **Analysis Date**: ${new Date().toLocaleString()}
- **File Name**: ${req.file.originalname}

## 🎯 **Sentiment Overview**

### 📊 Distribution:
- **✅ Positive**: ${positiveCount} (${positivePercentage}%)
- **❌ Negative**: ${negativeCount} (${negativePercentage}%) 
- **➖ Neutral**: ${neutralCount} (${neutralPercentage}%)

### 📈 **Sentiment Health Score**: ${
        positivePercentage > 60
          ? "🟢 Excellent"
          : positivePercentage > 40
          ? "🟡 Good"
          : "🔴 Needs Attention"
      } (${positivePercentage}% positive)

## 📍 **Feedback Sources**

${Object.entries(sourceDistribution)
  .map(
    ([source, count]) =>
      `- **${source}**: ${count} entries (${Math.round(
        (count / totalFeedback) * 100
      )}%)`
  )
  .join("\n")}

## 🔍 **Sample Feedback**

### Recent Positive Comments:
${feedbackData
  .filter((f) => f.sentiment === "positive")
  .slice(0, 3)
  .map((f) => `- "${f.text}"`)
  .join("\n")}

### Recent Negative Comments:
${feedbackData
  .filter((f) => f.sentiment === "negative")
  .slice(0, 3)
  .map((f) => `- "${f.text}"`)
  .join("\n")}

## 🎯 **Quick Insights**

${
  positivePercentage > 60
    ? "✅ **Strong Performance**: Customer sentiment is predominantly positive. This indicates good service quality and customer satisfaction."
    : positivePercentage > 40
    ? "⚠️ **Moderate Performance**: Customer sentiment is mixed. There are opportunities for improvement in service delivery."
    : "🚨 **Action Required**: High negative sentiment detected. Immediate attention needed to address customer concerns."
}

---
*Analysis completed for your uploaded CSV file with ${totalFeedback} feedback entries*`;

      res.json({
        success: true,
        message: "CSV file analyzed successfully",
        data: {
          analysis: analysisReport,
          summary: {
            totalFeedback,
            avgConfidence: Math.round(avgConfidence * 100),
            analysisDate: new Date().toISOString(),
            fileName: req.file.originalname,
            processingTime: "< 2 seconds",
          },
          metrics: {
            sentimentDistribution,
            sourceDistribution,
            percentages: {
              positive: positivePercentage,
              negative: negativePercentage,
              neutral: neutralPercentage,
            },
          },
          stats: {
            total: totalFeedback,
            processed: totalFeedback,
            failed: 0,
            skipped: 0,
          },
        },
      });
    } catch (error) {
      logger.error("Error in CSV upload and analysis:", error);

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

// @route   POST /api/feedback/analyze-public-csv
// @desc    Analyze the feedback.csv from public folder
// @access  Private
router.post("/analyze-public-csv", protect, async (req, res) => {
  try {
    // Path to the public feedback CSV
    const csvPath = path.join(__dirname, "../../client/public/feedback.csv");

    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({
        success: false,
        message: "feedback.csv not found in public folder",
      });
    }

    logger.info("Processing public feedback CSV for analysis");

    // Load and process the CSV data
    const result = await feedbackDataProcessor.loadFromCSVFile(csvPath);

    // Generate comprehensive analysis
    const [sentimentTrends, insights, recommendations] = await Promise.all([
      feedbackAnalyzer.analyzeSentimentTrends({ timeframe: "all" }),
      feedbackAnalyzer.generateFeedbackInsights(),
      feedbackAnalyzer.generateRecommendations(),
    ]);

    // Get all feedback for additional metrics
    const allFeedback = await feedbackVectorStore.getAllFeedback();

    // Calculate sentiment distribution
    const sentimentDistribution = allFeedback.reduce((acc, item) => {
      const sentiment = item.sentiment?.toLowerCase() || "neutral";
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {});

    // Calculate source distribution
    const sourceDistribution = allFeedback.reduce((acc, item) => {
      const source = item.source || "Unknown";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    // Get recent feedback examples
    const recentFeedback = allFeedback
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 5);

    // Calculate metrics
    const totalFeedback = allFeedback.length;
    const avgConfidence =
      allFeedback.reduce((sum, item) => {
        return sum + (item.confidence || 0);
      }, 0) / totalFeedback;

    const analysisResult = {
      summary: {
        totalFeedback,
        avgConfidence: Math.round(avgConfidence * 100),
        analysisDate: new Date().toISOString(),
        fileName: "feedback.csv",
        dataRange: {
          earliest: allFeedback.reduce((earliest, item) => {
            const itemDate = new Date(item.date || 0);
            return itemDate < earliest ? itemDate : earliest;
          }, new Date()),
          latest: allFeedback.reduce((latest, item) => {
            const itemDate = new Date(item.date || 0);
            return itemDate > latest ? itemDate : latest;
          }, new Date(0)),
        },
      },
      sentimentDistribution,
      sourceDistribution,
      sentimentTrends: sentimentTrends || {},
      insights: insights || {},
      recommendations: recommendations || {},
      recentFeedback,
      stats: result.stats || {
        total: totalFeedback,
        processed: totalFeedback,
        failed: 0,
        skipped: 0,
      },
    };

    res.json({
      success: true,
      message: "Public CSV feedback analyzed successfully",
      data: analysisResult,
    });
  } catch (error) {
    logger.error("Error analyzing public CSV feedback:", error);
    res.status(500).json({
      success: false,
      message: "Failed to analyze feedback CSV",
      error: error.message,
    });
  }
});

// @route   POST /api/feedback/chat-with-csv
// @desc    Chat with feedback data from CSV
// @access  Private
router.post("/chat-with-csv", protect, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const companyId = req.company.id;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // Check if CSV data is loaded, if not load it first
    const stats = await feedbackVectorStore.getStats();
    if (stats.totalFeedback === 0) {
      logger.info("Loading CSV data before processing query");
      const csvPath = path.join(__dirname, "../../client/public/feedback.csv");

      if (fs.existsSync(csvPath)) {
        await feedbackDataProcessor.loadFromCSVFile(csvPath);
      } else {
        return res.status(404).json({
          success: false,
          message:
            "No feedback data available. Please ensure feedback.csv exists.",
        });
      }
    }

    const finalSessionId = sessionId || `${companyId}_csv_${Date.now()}`;

    // Process the feedback query
    const response = await feedbackChatbotIntegration.handleFeedbackQuery(
      message,
      finalSessionId,
      {
        companyId,
        source: "feedback.csv",
        dataLoaded: true,
      }
    );

    res.json({
      success: true,
      message: "Feedback query processed successfully",
      data: response,
    });
  } catch (error) {
    logger.error("Error processing CSV feedback chat:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process feedback query",
      error: error.message,
    });
  }
});

module.exports = router;
