const mongoose = require("mongoose");

const aiContextSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    contextType: {
      type: String,
      enum: ["chatbot", "email", "website", "image_gen", "general"],
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
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
        index: true,
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
    this.businessContext.extractedPreferences = {
      ...this.businessContext.extractedPreferences,
      ...newContext.extractedPreferences,
    };
  }

  if (newContext.learnedPatterns) {
    newContext.learnedPatterns.forEach((pattern) => {
      const existing = this.businessContext.learnedPatterns.find(
        (p) => p.pattern === pattern.pattern
      );
      if (existing) {
        existing.frequency += 1;
        existing.lastSeen = new Date();
      } else {
        this.businessContext.learnedPatterns.push({
          pattern: pattern.pattern,
          frequency: 1,
          lastSeen: new Date(),
          context: pattern.context || "",
        });
      }
    });
  }

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
