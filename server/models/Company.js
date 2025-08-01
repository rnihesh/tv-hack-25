const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: [100, "Company name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't include password in queries by default
    },
    businessType: {
      type: String,
      required: [true, "Business type is required"],
      enum: [
        "restaurant",
        "retail",
        "service",
        "consulting",
        "healthcare",
        "education",
        "technology",
        "manufacturing",
        "real_estate",
        "other",
      ],
    },
    targetAudience: {
      type: String,
      trim: true,
      maxlength: [
        500,
        "Target audience description cannot exceed 500 characters",
      ],
    },
    businessDescription: {
      type: String,
      trim: true,
      maxlength: [1000, "Business description cannot exceed 1000 characters"],
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
          "custom",
        ],
        default: "blue",
      },
      brandStyle: {
        type: String,
        enum: ["modern", "classic", "minimal", "bold", "elegant", "playful"],
        default: "modern",
      },
      communicationTone: {
        type: String,
        enum: [
          "formal",
          "casual",
          "friendly",
          "professional",
          "conversational",
        ],
        default: "professional",
      },
      marketingGoals: [
        {
          type: String,
          enum: [
            "brand_awareness",
            "lead_generation",
            "customer_retention",
            "sales_conversion",
            "engagement",
            "reach",
          ],
        },
      ],
      contentStyle: {
        type: String,
        enum: [
          "informative",
          "persuasive",
          "educational",
          "entertaining",
          "inspirational",
        ],
        default: "informative",
      },
    },
    aiContextProfile: {
      businessPersonality: {
        type: String,
        trim: true,
        maxlength: [500, "Business personality cannot exceed 500 characters"],
      },
      keyMessages: [
        {
          type: String,
          maxlength: [200, "Key message cannot exceed 200 characters"],
        },
      ],
      brandVoice: {
        type: String,
        trim: true,
        maxlength: [300, "Brand voice cannot exceed 300 characters"],
      },
      commonQueries: [
        {
          type: String,
          maxlength: [200, "Common query cannot exceed 200 characters"],
        },
      ],
      productServices: [
        {
          name: String,
          description: String,
          category: String,
          price: Number,
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
          enum: [
            "gemini-2.5-flash",
            "ollama-llama3",
            "ollama-mistral",
            "gpt-3.5-turbo",
          ],
          default: "gemini-2.5-flash",
        },
        responseStyle: {
          type: String,
          enum: ["concise", "detailed", "creative", "technical"],
          default: "detailed",
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
      currentPeriodStart: Date,
      currentPeriodEnd: Date,
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
        default: 0,
        min: [0, "Credits cannot be negative"],
      },
      totalCreditsUsed: {
        type: Number,
        default: 0,
        min: [0, "Total credits used cannot be negative"],
      },
      dailyCreditsUsed: {
        type: Number,
        default: 0,
        min: [0, "Daily credits used cannot be negative"],
      },
      lastCreditReset: {
        type: Date,
        default: Date.now,
      },
      creditHistory: [
        {
          action: {
            type: String,
            enum: ["earned", "used", "purchased", "refunded", "expired"],
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
              "daily_bonus",
              "subscription_bonus",
            ],
          },
          timestamp: {
            type: Date,
            default: Date.now,
          },
          description: String,
        },
      ],
    },
    emailList: [
      {
        type: String,
        lowercase: true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          "Please enter a valid email",
        ],
      },
    ],
    usage: {
      websitesGenerated: {
        type: Number,
        default: 0,
      },
      emailsSent: {
        type: Number,
        default: 0,
      },
      imagesGenerated: {
        type: Number,
        default: 0,
      },
      chatbotQueries: {
        type: Number,
        default: 0,
      },
      vectorSearches: {
        type: Number,
        default: 0,
      },
      lastUsageReset: {
        type: Date,
        default: Date.now,
      },
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
companySchema.index({ "subscription.status": 1 });
companySchema.index({ businessType: 1 });
companySchema.index({ createdAt: 1 });

// Virtual for company's full name
companySchema.virtual("displayName").get(function () {
  return this.companyName;
});

// Pre-save middleware to hash password
companySchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to set vector collection ID
companySchema.pre("save", function (next) {
  if (this.isNew && !this.aiContextProfile.vectorCollectionId) {
    this.aiContextProfile.vectorCollectionId = `company_${this._id.toString()}`;
  }
  next();
});

// Method to compare password
companySchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if company has sufficient credits
companySchema.methods.hasCredits = function (requiredCredits) {
  return this.credits.currentCredits >= requiredCredits;
};

// Method to deduct credits
companySchema.methods.deductCredits = async function (
  amount,
  service,
  description
) {
  if (this.credits.currentCredits < amount) {
    throw new Error("Insufficient credits");
  }

  this.credits.currentCredits -= amount;
  this.credits.totalCreditsUsed += amount;
  this.credits.dailyCreditsUsed += amount;

  this.credits.creditHistory.push({
    action: "used",
    amount: -amount,
    service: service,
    description: description,
    timestamp: new Date(),
  });

  return await this.save();
};

// Method to add credits
companySchema.methods.addCredits = async function (
  amount,
  source,
  description
) {
  this.credits.currentCredits += amount;

  this.credits.creditHistory.push({
    action: "earned",
    amount: amount,
    service: source,
    description: description,
    timestamp: new Date(),
  });

  return await this.save();
};

// Method to reset daily credits
companySchema.methods.resetDailyCredits = function () {
  const now = new Date();
  const lastReset = new Date(this.credits.lastCreditReset);

  // Check if it's a new day
  if (now.toDateString() !== lastReset.toDateString()) {
    this.credits.dailyCreditsUsed = 0;
    this.credits.lastCreditReset = now;
  }
};

// Static method to get subscription plans
companySchema.statics.getSubscriptionPlans = function () {
  return {
    free: {
      dailyCredits: 10,
      features: {
        websiteTemplates: 1,
        emailCampaigns: 5,
        imageGenerations: 3,
        chatbotQueries: 50,
        vectorSearchLimit: 100,
      },
    },
    starter: {
      dailyCredits: 100,
      features: {
        websiteTemplates: 5,
        emailCampaigns: 50,
        imageGenerations: 100,
        chatbotQueries: 1000,
        vectorSearchLimit: 1000,
      },
    },
    professional: {
      dailyCredits: 500,
      features: {
        websiteTemplates: -1, // unlimited
        emailCampaigns: -1,
        imageGenerations: 500,
        chatbotQueries: 5000,
        vectorSearchLimit: 10000,
      },
    },
  };
};

module.exports = mongoose.model("Company", companySchema);
