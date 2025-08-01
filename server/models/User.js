const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    businessType: {
      type: String,
      required: true,
      enum: [
        "restaurant",
        "retail",
        "service",
        "healthcare",
        "education",
        "technology",
        "consulting",
        "manufacturing",
        "real_estate",
        "other",
      ],
    },
    targetAudience: {
      type: String,
      required: true,
      maxlength: 500,
    },
    businessDescription: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    preferences: {
      colorScheme: {
        type: String,
        enum: [
          "blue",
          "green",
          "red",
          "purple",
          "orange",
          "teal",
          "pink",
          "indigo",
          "gray",
          "black",
        ],
      },
      brandStyle: {
        type: String,
        enum: [
          "modern",
          "classic",
          "minimal",
          "bold",
          "elegant",
          "playful",
          "professional",
          "creative",
        ],
      },
      communicationTone: {
        type: String,
        enum: [
          "formal",
          "casual",
          "friendly",
          "professional",
          "enthusiastic",
          "authoritative",
          "empathetic",
        ],
      },
      marketingGoals: [
        {
          type: String,
          enum: [
            "brand_awareness",
            "lead_generation",
            "customer_retention",
            "sales_increase",
            "engagement",
            "education",
            "community_building",
          ],
        },
      ],
      contentStyle: {
        type: String,
        enum: [
          "informative",
          "persuasive",
          "entertaining",
          "educational",
          "promotional",
          "storytelling",
        ],
      },
    },
    aiContextProfile: {
      businessPersonality: {
        type: String,
        maxlength: 500,
      },
      keyMessages: [
        {
          type: String,
          maxlength: 200,
        },
      ],
      brandVoice: {
        type: String,
        maxlength: 300,
      },
      commonQueries: [
        {
          type: String,
          maxlength: 200,
        },
      ],
      productServices: [
        {
          type: String,
          maxlength: 200,
        },
      ],
      contextualData: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      vectorCollectionId: {
        type: String,
        unique: true,
        sparse: true,
      },
      contextualPreferences: {
        preferredAIModel: {
          type: String,
          enum: ["gemini-2.5-flash", "ollama-llama3", "auto"],
          default: "auto",
        },
        responseStyle: {
          type: String,
          enum: ["concise", "detailed", "balanced"],
          default: "balanced",
        },
        industrySpecificContext: {
          type: mongoose.Schema.Types.Mixed,
          default: {},
        },
      },
    },
    subscription: {
      plan: {
        type: String,
        enum: ["free", "starter", "professional"],
        default: "free",
      },
      subscriptionId: {
        type: String,
        sparse: true,
      },
      status: {
        type: String,
        enum: ["active", "canceled", "past_due", "incomplete", "trialing"],
        default: "active",
      },
      currentPeriodStart: {
        type: Date,
        default: Date.now,
      },
      currentPeriodEnd: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      cancelAtPeriodEnd: {
        type: Boolean,
        default: false,
      },
      featuresEnabled: [
        {
          type: String,
        },
      ],
    },
    credits: {
      currentCredits: {
        type: Number,
        default: 10,
        min: 0,
      },
      totalCreditsUsed: {
        type: Number,
        default: 0,
        min: 0,
      },
      dailyCreditsUsed: {
        type: Number,
        default: 0,
        min: 0,
      },
      lastCreditReset: {
        type: Date,
        default: Date.now,
      },
      creditHistory: [
        {
          action: {
            type: String,
            enum: [
              "earned",
              "used",
              "purchased",
              "refunded",
              "expired",
              "bonus",
            ],
            required: true,
          },
          amount: {
            type: Number,
            required: true,
          },
          service: {
            type: String,
            enum: [
              "website_gen",
              "email_gen",
              "image_gen",
              "chatbot",
              "vector_search",
              "subscription",
              "purchase",
            ],
          },
          timestamp: {
            type: Date,
            default: Date.now,
          },
          description: {
            type: String,
            maxlength: 200,
          },
        },
      ],
    },
    usage: {
      websitesGenerated: {
        type: Number,
        default: 0,
        min: 0,
      },
      emailsSent: {
        type: Number,
        default: 0,
        min: 0,
      },
      imagesGenerated: {
        type: Number,
        default: 0,
        min: 0,
      },
      chatbotQueries: {
        type: Number,
        default: 0,
        min: 0,
      },
      vectorSearches: {
        type: Number,
        default: 0,
        min: 0,
      },
      lastUsageReset: {
        type: Date,
        default: Date.now,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "companies",
  }
);

// Indexes for better performance
CompanySchema.index({ "subscription.plan": 1 });
CompanySchema.index({ "aiContextProfile.vectorCollectionId": 1 });
CompanySchema.index({ createdAt: -1 });

// Pre-save middleware to generate vector collection ID
CompanySchema.pre("save", function (next) {
  if (this.isNew && !this.aiContextProfile.vectorCollectionId) {
    this.aiContextProfile.vectorCollectionId = `company_${this._id}_${Date.now()}`;
  }
  next();
});

// Methods
CompanySchema.methods.toJSON = function () {
  const company = this.toObject();
  delete company.password;
  delete company.emailVerificationToken;
  delete company.passwordResetToken;
  return company;
};

CompanySchema.methods.hasCredits = function (requiredCredits) {
  return this.credits.currentCredits >= requiredCredits;
};

CompanySchema.methods.deductCredits = function (amount, service, description) {
  if (this.credits.currentCredits >= amount) {
    this.credits.currentCredits -= amount;
    this.credits.totalCreditsUsed += amount;
    this.credits.dailyCreditsUsed += amount;

    this.credits.creditHistory.push({
      action: "used",
      amount: -amount,
      service: service,
      description: description,
    });

    return true;
  }
  return false;
};

CompanySchema.methods.addCredits = function (
  amount,
  action = "purchased",
  description = ""
) {
  this.credits.currentCredits += amount;

  this.credits.creditHistory.push({
    action: action,
    amount: amount,
    description: description,
  });
};

module.exports = mongoose.model("Company", CompanySchema);
