const mongoose = require("mongoose");

const aiContextSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    contextType: {
      type: String,
      enum: [
        "chatbot",
        "email",
        "email_generation",
        "website",
        "website_generation",
        "image_gen",
        "image_generation",
        "general",
      ],
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
    conversationHistory: [
      {
        role: {
          type: String,
          enum: ["user", "assistant", "system"],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        metadata: {
          model: String,
          tokenCount: Number,
          processingTime: Number,
          confidence: Number,
          context: mongoose.Schema.Types.Mixed,
        },
      },
    ],
    businessContext: {
      extractedPreferences: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      learnedPatterns: [
        {
          pattern: String,
          frequency: Number,
          lastSeen: Date,
          context: String,
        },
      ],
      customerInsights: {
        commonQuestions: [
          {
            question: String,
            frequency: Number,
            category: String,
          },
        ],
        preferredTopics: [String],
        engagementPatterns: mongoose.Schema.Types.Mixed,
        sentimentAnalysis: {
          positive: Number,
          negative: Number,
          neutral: Number,
          lastUpdated: Date,
        },
      },
      industryContext: {
        keywords: [String],
        competitorMentions: [String],
        seasonalTrends: mongoose.Schema.Types.Mixed,
      },
    },
    vectorDocumentIds: [
      {
        type: String,
      },
    ],
    contextualState: {
      currentIntent: String,
      previousIntents: [String],
      entities: mongoose.Schema.Types.Mixed,
      mood: {
        type: String,
        enum: ["positive", "negative", "neutral", "confused", "urgent"],
      },
      complexity: {
        type: String,
        enum: ["simple", "moderate", "complex"],
      },
    },
    performance: {
      averageResponseTime: Number,
      successRate: Number,
      userSatisfaction: Number,
      totalInteractions: {
        type: Number,
        default: 0,
      },
      lastInteraction: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes
aiContextSchema.index({ companyId: 1, contextType: 1 });
aiContextSchema.index({ companyId: 1, sessionId: 1 });
aiContextSchema.index({ contextType: 1, isActive: 1 });
aiContextSchema.index({ createdAt: 1 });

// Virtual for conversation summary
aiContextSchema.virtual("conversationSummary").get(function () {
  const totalMessages = this.conversationHistory.length;
  const userMessages = this.conversationHistory.filter(
    (msg) => msg.role === "user"
  ).length;
  const assistantMessages = this.conversationHistory.filter(
    (msg) => msg.role === "assistant"
  ).length;

  return {
    totalMessages,
    userMessages,
    assistantMessages,
    avgResponseTime: this.performance.averageResponseTime || 0,
  };
});

// Method to add conversation message
aiContextSchema.methods.addMessage = function (role, content, metadata = {}) {
  this.conversationHistory.push({
    role,
    content,
    timestamp: new Date(),
    metadata,
  });

  this.performance.totalInteractions += 1;
  this.performance.lastInteraction = new Date();

  // Keep only last 50 messages to prevent document from growing too large
  if (this.conversationHistory.length > 50) {
    this.conversationHistory = this.conversationHistory.slice(-50);
  }

  return this.save();
};

// Method to update business context
aiContextSchema.methods.updateBusinessContext = function (newContext) {
  if (newContext.extractedPreferences) {
    // Deep merge preferences, accumulating arrays like topicsOfInterest
    for (const [key, value] of Object.entries(
      newContext.extractedPreferences
    )) {
      if (Array.isArray(value)) {
        // For arrays, merge and deduplicate
        const existing = this.businessContext.extractedPreferences[key] || [];
        const merged = [...new Set([...existing, ...value])];
        this.businessContext.extractedPreferences[key] = merged.slice(-20); // Keep last 20
      } else if (key === "sentimentScore") {
        // Accumulate sentiment score
        const existing = this.businessContext.extractedPreferences[key] || 0;
        this.businessContext.extractedPreferences[key] = existing + value;
      } else {
        // For other values, update
        this.businessContext.extractedPreferences[key] = value;
      }
    }

    // Update sentiment analysis tracking
    if (newContext.extractedPreferences.lastSentiment) {
      const sentiment = newContext.extractedPreferences.lastSentiment;
      if (!this.businessContext.customerInsights.sentimentAnalysis) {
        this.businessContext.customerInsights.sentimentAnalysis = {
          positive: 0,
          negative: 0,
          neutral: 0,
          lastUpdated: new Date(),
        };
      }
      this.businessContext.customerInsights.sentimentAnalysis[sentiment] += 1;
      this.businessContext.customerInsights.sentimentAnalysis.lastUpdated =
        new Date();
    }
  }

  if (newContext.learnedPatterns && newContext.learnedPatterns.length > 0) {
    newContext.learnedPatterns.forEach((pattern) => {
      const existing = this.businessContext.learnedPatterns.find(
        (p) => p.pattern === pattern.pattern
      );
      if (existing) {
        existing.frequency += 1;
        existing.lastSeen = new Date();
        // Append new context if different
        if (pattern.context && !existing.context.includes(pattern.context)) {
          existing.context = `${existing.context}; ${pattern.context}`.slice(
            -500
          );
        }
      } else {
        this.businessContext.learnedPatterns.push({
          pattern: pattern.pattern,
          frequency: 1,
          lastSeen: new Date(),
          context: pattern.context || "",
        });
      }
    });

    // Keep only the most recent 50 patterns
    if (this.businessContext.learnedPatterns.length > 50) {
      this.businessContext.learnedPatterns =
        this.businessContext.learnedPatterns
          .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen))
          .slice(0, 50);
    }
  }

  this.markModified("businessContext");
  return this.save();
};

// Method to get conversation context for AI
aiContextSchema.methods.getContextForAI = function (maxMessages = 10) {
  const recentMessages = this.conversationHistory
    .slice(-maxMessages)
    .map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

  return {
    messages: recentMessages,
    businessContext: this.businessContext.extractedPreferences,
    currentIntent: this.contextualState.currentIntent,
    entities: this.contextualState.entities,
    mood: this.contextualState.mood,
  };
};

// Static method to find or create context
aiContextSchema.statics.findOrCreateContext = async function (
  companyId,
  contextType,
  sessionId
) {
  let context = await this.findOne({
    companyId,
    contextType,
    sessionId,
    isActive: true,
  });

  if (!context) {
    context = new this({
      companyId,
      contextType,
      sessionId,
      businessContext: {
        extractedPreferences: {},
        learnedPatterns: [],
        customerInsights: {
          commonQuestions: [],
          preferredTopics: [],
          engagementPatterns: {},
          sentimentAnalysis: {
            positive: 0,
            negative: 0,
            neutral: 0,
            lastUpdated: new Date(),
          },
        },
        industryContext: {
          keywords: [],
          competitorMentions: [],
          seasonalTrends: {},
        },
      },
      contextualState: {},
      performance: {
        totalInteractions: 0,
      },
    });
    await context.save();
  }

  return context;
};

// Static method to cleanup old contexts
aiContextSchema.statics.cleanupOldContexts = async function () {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return await this.deleteMany({
    $or: [
      { updatedAt: { $lt: thirtyDaysAgo } },
      {
        isActive: false,
        updatedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    ],
  });
};

module.exports = mongoose.model("AIContext", aiContextSchema);
