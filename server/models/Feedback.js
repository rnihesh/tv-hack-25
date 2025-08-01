const mongoose = require("mongoose");

// Feedback Collection Schema
const FeedbackSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      
    },
    source: {
      type: String,
      enum: [
        "website",
        "email",
        "chatbot",
        "social_media",
        "review_site",
        "survey",
        "direct",
      ],
      required: true,
      
    },
    content: {
      originalText: {
        type: String,
        required: true,
        maxlength: 5000,
      },
      processedText: String,
      language: {
        type: String,
        default: "en",
      },
    },
    sentiment: {
      overall: {
        type: String,
        enum: ["positive", "negative", "neutral"],
        
      },
      score: {
        type: Number,
        min: -1,
        max: 1,
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1,
      },
      emotions: [
        {
          emotion: {
            type: String,
            enum: [
              "joy",
              "anger",
              "sadness",
              "fear",
              "surprise",
              "disgust",
              "trust",
              "anticipation",
            ],
          },
          intensity: {
            type: Number,
            min: 0,
            max: 1,
          },
        },
      ],
    },
    analysis: {
      categories: [
        {
          type: String,
          enum: [
            "product",
            "service",
            "pricing",
            "support",
            "delivery",
            "quality",
            "user_experience",
            "staff",
            "facilities",
            "general",
          ],
        },
      ],
      topics: [
        {
          topic: String,
          relevance: Number,
        },
      ],
      keywords: [String],
      actionItems: [
        {
          action: String,
          priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            default: "medium",
          },
          category: String,
          isResolved: {
            type: Boolean,
            default: false,
          },
        },
      ],
      aiInsights: {
        type: String,
        maxlength: 1000,
      },
    },
    customer: {
      name: String,
      email: String,
      phone: String,
      customerId: String,
      isReturning: Boolean,
      segment: String,
    },
    metadata: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      platform: String,
      deviceType: String,
      location: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
      ipAddress: String,
      userAgent: String,
      referrer: String,
    },
    processing: {
      status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed"],
        default: "pending",
        
      },
      aiModel: String,
      processingTime: Number,
      errorMessage: String,
      lastProcessed: Date,
    },
    followUp: {
      isRequired: {
        type: Boolean,
        default: false,
      },
      priority: {
        type: String,
        enum: ["low", "medium", "high", "urgent"],
        default: "medium",
      },
      assignedTo: String,
      status: {
        type: String,
        enum: ["pending", "in_progress", "completed", "cancelled"],
        default: "pending",
      },
      notes: String,
      completedAt: Date,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    tags: [String],
  },
  {
    timestamps: true,
    collection: "feedback",
  }
);

// Feedback Analytics Schema
const FeedbackAnalyticsSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      
    },
    period: {
      type: String,
      enum: ["daily", "weekly", "monthly", "quarterly"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    summary: {
      totalFeedback: Number,
      sentimentDistribution: {
        positive: Number,
        negative: Number,
        neutral: Number,
      },
      averageRating: Number,
      topCategories: [
        {
          category: String,
          count: Number,
          percentage: Number,
        },
      ],
      topTopics: [
        {
          topic: String,
          count: Number,
          relevance: Number,
        },
      ],
      urgentActionItems: Number,
      resolvedActionItems: Number,
    },
    trends: {
      sentimentTrend: [
        {
          date: Date,
          positive: Number,
          negative: Number,
          neutral: Number,
        },
      ],
      volumeTrend: [
        {
          date: Date,
          count: Number,
        },
      ],
      ratingTrend: [
        {
          date: Date,
          averageRating: Number,
        },
      ],
    },
    insights: {
      keyFindings: [String],
      recommendations: [
        {
          action: String,
          impact: {
            type: String,
            enum: ["low", "medium", "high"],
          },
          effort: {
            type: String,
            enum: ["low", "medium", "high"],
          },
          category: String,
        },
      ],
      riskFactors: [String],
      opportunities: [String],
    },
    comparisonData: {
      previousPeriod: {
        sentimentChange: Number,
        volumeChange: Number,
        ratingChange: Number,
      },
      industryBenchmark: {
        averageRating: Number,
        sentimentScore: Number,
      },
    },
  },
  {
    timestamps: true,
    collection: "feedback_analytics",
  }
);

// Indexes
FeedbackSchema.index({ companyId: 1, source: 1 });
FeedbackSchema.index({ "sentiment.overall": 1 });
FeedbackSchema.index({ "processing.status": 1 });
FeedbackSchema.index({ "metadata.timestamp": -1 });
FeedbackSchema.index({ tags: 1 });

FeedbackAnalyticsSchema.index({ companyId: 1, period: 1 });
FeedbackAnalyticsSchema.index({ startDate: 1, endDate: 1 });

// Methods for Feedback
FeedbackSchema.methods.updateSentiment = function (
  sentiment,
  score,
  confidence
) {
  this.sentiment.overall = sentiment;
  this.sentiment.score = score;
  this.sentiment.confidence = confidence;
  this.processing.status = "completed";
  this.processing.lastProcessed = new Date();
};

FeedbackSchema.methods.addActionItem = function (
  action,
  priority = "medium",
  category = "general"
) {
  this.analysis.actionItems.push({
    action,
    priority,
    category,
    isResolved: false,
  });
};

FeedbackSchema.methods.resolveActionItem = function (actionId) {
  const actionItem = this.analysis.actionItems.id(actionId);
  if (actionItem) {
    actionItem.isResolved = true;
  }
};

FeedbackSchema.methods.requiresFollowUp = function (
  priority = "medium",
  assignedTo = null
) {
  this.followUp.isRequired = true;
  this.followUp.priority = priority;
  if (assignedTo) {
    this.followUp.assignedTo = assignedTo;
  }
};

// Methods for Analytics
FeedbackAnalyticsSchema.statics.generatePeriodAnalytics = async function (
  companyId,
  period,
  startDate,
  endDate
) {
  const feedback = await mongoose.model("Feedback").find({
    companyId,
    "metadata.timestamp": { $gte: startDate, $lte: endDate },
    "processing.status": "completed",
  });

  const totalFeedback = feedback.length;
  const sentimentCounts = feedback.reduce((acc, f) => {
    acc[f.sentiment.overall] = (acc[f.sentiment.overall] || 0) + 1;
    return acc;
  }, {});

  const avgRating =
    feedback.reduce((sum, f) => sum + (f.metadata.rating || 0), 0) /
    totalFeedback;

  return new this({
    companyId,
    period,
    startDate,
    endDate,
    summary: {
      totalFeedback,
      sentimentDistribution: {
        positive: sentimentCounts.positive || 0,
        negative: sentimentCounts.negative || 0,
        neutral: sentimentCounts.neutral || 0,
      },
      averageRating: avgRating || 0,
    },
  });
};

module.exports = {
  Feedback: mongoose.model("Feedback", FeedbackSchema),
  FeedbackAnalytics: mongoose.model(
    "FeedbackAnalytics",
    FeedbackAnalyticsSchema
  ),
};
