const mongoose = require("mongoose");

const ChatbotConfigSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      unique: true,
      
    },
    botName: {
      type: String,
      required: true,
      maxlength: 50,
      default: "Assistant",
    },
    personality: {
      type: String,
      enum: [
        "helpful",
        "friendly",
        "professional",
        "casual",
        "enthusiastic",
        "empathetic",
        "authoritative",
      ],
      default: "helpful",
    },
    knowledgeBase: [
      {
        category: {
          type: String,
          required: true,
        },
        questions: [
          {
            question: String,
            answer: String,
            keywords: [String],
            priority: {
              type: Number,
              default: 1,
            },
          },
        ],
      },
    ],
    commonQuestions: [
      {
        question: {
          type: String,
          required: true,
        },
        answer: {
          type: String,
          required: true,
        },
        category: String,
        frequency: {
          type: Number,
          default: 0,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    fallbackResponses: [
      {
        type: String,
        default:
          "I'm sorry, I don't have information about that. Would you like me to connect you with a human representative?",
      },
    ],
    configuration: {
      welcomeMessage: {
        type: String,
        default: "Hello! How can I help you today?",
      },
      contextWindow: {
        type: Number,
        default: 5,
        min: 1,
        max: 20,
      },
      responseDelay: {
        type: Number,
        default: 1000,
        min: 0,
        max: 5000,
      },
      maxResponseLength: {
        type: Number,
        default: 500,
        min: 100,
        max: 2000,
      },
      escalationTriggers: [
        {
          type: String,
          enum: [
            "human_request",
            "confusion",
            "complaint",
            "technical_issue",
            "billing_inquiry",
          ],
        },
      ],
      businessHours: {
        enabled: {
          type: Boolean,
          default: false,
        },
        timezone: {
          type: String,
          default: "UTC",
        },
        schedule: [
          {
            day: {
              type: String,
              enum: [
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
              ],
            },
            startTime: String,
            endTime: String,
            isOpen: Boolean,
          },
        ],
      },
    },
    aiModel: {
      type: String,
      enum: ["gemini-2.5-flash", "ollama-llama3", "hybrid"],
      default: "ollama-llama3",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    performance: {
      totalQueries: {
        type: Number,
        default: 0,
      },
      resolvedQueries: {
        type: Number,
        default: 0,
      },
      escalatedQueries: {
        type: Number,
        default: 0,
      },
      averageRating: {
        type: Number,
        default: 0,
      },
      totalRatings: {
        type: Number,
        default: 0,
      },
      averageResponseTime: {
        type: Number,
        default: 0,
      },
      lastPerformanceUpdate: Date,
    },
    integration: {
      widgetSettings: {
        position: {
          type: String,
          enum: ["bottom-right", "bottom-left", "top-right", "top-left"],
          default: "bottom-right",
        },
        theme: {
          primaryColor: String,
          textColor: String,
          backgroundColor: String,
        },
        size: {
          type: String,
          enum: ["small", "medium", "large"],
          default: "medium",
        },
      },
      webhookUrl: String,
      apiKey: String,
    },
  },
  {
    timestamps: true,
    collection: "chatbot_configs",
  }
);

// Indexes
ChatbotConfigSchema.index({ isActive: 1 });

// Methods
ChatbotConfigSchema.methods.addQuestion = function (
  question,
  answer,
  category = "general"
) {
  this.commonQuestions.push({
    question,
    answer,
    category,
    frequency: 0,
    isActive: true,
  });
};

ChatbotConfigSchema.methods.updatePerformance = function (metrics) {
  Object.assign(this.performance, metrics);
  this.performance.lastPerformanceUpdate = new Date();
};

ChatbotConfigSchema.methods.addRating = function (rating) {
  const currentTotal =
    this.performance.averageRating * this.performance.totalRatings;
  this.performance.totalRatings += 1;
  this.performance.averageRating =
    (currentTotal + rating) / this.performance.totalRatings;
};

ChatbotConfigSchema.methods.incrementQuery = function (resolved = true) {
  this.performance.totalQueries += 1;
  if (resolved) {
    this.performance.resolvedQueries += 1;
  } else {
    this.performance.escalatedQueries += 1;
  }
};

ChatbotConfigSchema.methods.findAnswer = function (userQuery) {
  const lowerQuery = userQuery.toLowerCase();

  // Look for exact matches first
  let match = this.commonQuestions.find(
    (qa) => qa.isActive && qa.question.toLowerCase().includes(lowerQuery)
  );

  if (!match) {
    // Look for keyword matches in knowledge base
    for (const category of this.knowledgeBase) {
      for (const qa of category.questions) {
        if (
          qa.keywords.some((keyword) =>
            lowerQuery.includes(keyword.toLowerCase())
          )
        ) {
          match = qa;
          break;
        }
      }
      if (match) break;
    }
  }

  return match;
};

module.exports = mongoose.model("ChatbotConfig", ChatbotConfigSchema);
