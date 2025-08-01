const mongoose = require("mongoose");

const AIContextSchema = new mongoose.Schema(
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
          maxlength: 10000,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        metadata: {
          type: mongoose.Schema.Types.Mixed,
          default: {},
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
          type: String,
          maxlength: 500,
        },
      ],
      customerInsights: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },
    vectorDocumentIds: [
      {
        type: String,
      },
    ],
    sessionId: {
      type: String,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "ai_contexts",
  }
);

// Indexes
AIContextSchema.index({ companyId: 1, contextType: 1 });
AIContextSchema.index({ sessionId: 1 });
AIContextSchema.index({ createdAt: -1 });

// Methods
AIContextSchema.methods.addMessage = function (role, content, metadata = {}) {
  this.conversationHistory.push({
    role,
    content,
    metadata,
    timestamp: new Date(),
  });

  // Keep only last 50 messages to prevent unbounded growth
  if (this.conversationHistory.length > 50) {
    this.conversationHistory = this.conversationHistory.slice(-50);
  }
};

AIContextSchema.methods.getRecentMessages = function (limit = 10) {
  return this.conversationHistory.slice(-limit);
};

AIContextSchema.methods.updateBusinessContext = function (newContext) {
  this.businessContext = {
    ...this.businessContext,
    ...newContext,
  };
};

module.exports = mongoose.model("AIContext", AIContextSchema);
