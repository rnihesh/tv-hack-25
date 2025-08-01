const mongoose = require("mongoose");

// Subscription Plans Schema
const SubscriptionPlanSchema = new mongoose.Schema(
  {
    planName: {
      type: String,
      required: true,
      unique: true,
      enum: ["free", "starter", "professional"],
    },
    displayName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    price: {
      monthly: {
        type: Number,
        required: true,
        min: 0,
      },
      yearly: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        default: "USD",
      },
    },
    features: {
      dailyCredits: {
        type: Number,
        required: true,
        min: 0,
      },
      bonusCredits: {
        type: Number,
        default: 0,
        min: 0,
      },
      websiteTemplates: {
        type: Number,
        default: -1, // -1 for unlimited
      },
      emailCampaigns: {
        type: Number,
        default: -1,
      },
      imageGenerations: {
        type: Number,
        default: -1,
      },
      chatbotQueries: {
        type: Number,
        default: -1,
      },
      vectorSearchLimit: {
        type: Number,
        default: -1,
      },
      customBranding: {
        type: Boolean,
        default: false,
      },
      prioritySupport: {
        type: Boolean,
        default: false,
      },
      apiAccess: {
        type: Boolean,
        default: false,
      },
      advancedAnalytics: {
        type: Boolean,
        default: false,
      },
      customDomains: {
        type: Boolean,
        default: false,
      },
    },
    creditCosts: {
      websiteGeneration: {
        type: Number,
        required: true,
        min: 0,
      },
      emailGeneration: {
        type: Number,
        required: true,
        min: 0,
      },
      imageGeneration: {
        type: Number,
        required: true,
        min: 0,
      },
      chatbotQuery: {
        type: Number,
        required: true,
        min: 0,
      },
      vectorSearch: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    stripePriceId: {
      monthly: String,
      yearly: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "subscription_plans",
  }
);

// Payment Schema
const PaymentSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    paymentIntentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    subscriptionId: {
      type: String,
      sparse: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "succeeded",
        "failed",
        "canceled",
        "refunded",
      ],
      default: "pending",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["card", "bank_transfer", "paypal", "apple_pay", "google_pay"],
      default: "card",
    },
    description: {
      type: String,
      maxlength: 500,
    },
    metadata: {
      planName: String,
      creditsAdded: Number,
      billingPeriod: {
        type: String,
        enum: ["monthly", "yearly", "one_time"],
      },
      itemType: {
        type: String,
        enum: ["subscription", "credits", "upgrade", "addon"],
      },
    },
    fees: {
      stripeFee: Number,
      applicationFee: Number,
      netAmount: Number,
    },
    invoiceUrl: String,
    receiptUrl: String,
    refundedAmount: {
      type: Number,
      default: 0,
    },
    refundReason: String,
    isTestPayment: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "payments",
  }
);

// Credit Packages Schema
const CreditPackageSchema = new mongoose.Schema(
  {
    packageName: {
      type: String,
      required: true,
      unique: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      maxlength: 300,
    },
    credits: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    bonusCredits: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCredits: {
      type: Number, // credits + bonusCredits (computed)
    },
    stripePriceId: {
      type: String,
      unique: true,
      sparse: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    validityDays: {
      type: Number,
      default: 365, // Credits valid for 1 year by default
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "credit_packages",
  }
);

// Credit Transaction Schema
const CreditTransactionSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    transactionType: {
      type: String,
      enum: [
        "earned",
        "used",
        "purchased",
        "expired",
        "refunded",
        "bonus",
        "daily_reset",
      ],
      required: true,
      index: true,
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
        "daily_allowance",
        "bonus",
        "refund",
      ],
    },
    creditsAmount: {
      type: Number,
      required: true,
    },
    remainingCredits: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    metadata: {
      contentId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "metadata.contentType",
      },
      contentType: {
        type: String,
        enum: [
          "GeneratedContent",
          "WebsiteTemplate",
          "EmailCampaign",
          "ChatbotConfig",
        ],
      },
      sessionId: String,
      aiModel: String,
      promptTokens: Number,
      responseTokens: Number,
      processingTime: Number,
      paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
      },
      packageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CreditPackage",
      },
    },
    expiresAt: {
      type: Date,
    },
    isReversible: {
      type: Boolean,
      default: false,
    },
    reversalTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreditTransaction",
    },
  },
  {
    timestamps: true,
    collection: "credit_transactions",
  }
);

// AI Service Analytics Schema
const AIServiceAnalyticsSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    services: {
      websiteGeneration: {
        requests: { type: Number, default: 0 },
        creditsUsed: { type: Number, default: 0 },
        successRate: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
        averageProcessingTime: { type: Number, default: 0 },
      },
      emailGeneration: {
        requests: { type: Number, default: 0 },
        creditsUsed: { type: Number, default: 0 },
        emailsSent: { type: Number, default: 0 },
        openRate: { type: Number, default: 0 },
        clickRate: { type: Number, default: 0 },
      },
      imageGeneration: {
        requests: { type: Number, default: 0 },
        creditsUsed: { type: Number, default: 0 },
        successRate: { type: Number, default: 0 },
        averageProcessingTime: { type: Number, default: 0 },
        resolutionBreakdown: {
          low: { type: Number, default: 0 },
          medium: { type: Number, default: 0 },
          high: { type: Number, default: 0 },
        },
      },
      chatbotQueries: {
        requests: { type: Number, default: 0 },
        creditsUsed: { type: Number, default: 0 },
        resolvedQueries: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
        escalationRate: { type: Number, default: 0 },
      },
      vectorSearches: {
        requests: { type: Number, default: 0 },
        creditsUsed: { type: Number, default: 0 },
        averageRelevanceScore: { type: Number, default: 0 },
        averageResponseTime: { type: Number, default: 0 },
      },
    },
    totalCreditsUsed: {
      type: Number,
      default: 0,
    },
    totalRequests: {
      type: Number,
      default: 0,
    },
    costAnalysis: {
      totalCost: { type: Number, default: 0 },
      costByService: {
        website: { type: Number, default: 0 },
        email: { type: Number, default: 0 },
        image: { type: Number, default: 0 },
        chatbot: { type: Number, default: 0 },
        vectorSearch: { type: Number, default: 0 },
      },
      averageCostPerRequest: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    collection: "ai_service_analytics",
  }
);

// Indexes
SubscriptionPlanSchema.index({ planName: 1 });
SubscriptionPlanSchema.index({ isActive: 1 });
SubscriptionPlanSchema.index({ order: 1 });

PaymentSchema.index({ companyId: 1, status: 1 });
PaymentSchema.index({ paymentIntentId: 1 });
PaymentSchema.index({ subscriptionId: 1 });
PaymentSchema.index({ createdAt: -1 });

CreditPackageSchema.index({ isActive: 1 });
CreditPackageSchema.index({ order: 1 });
CreditPackageSchema.index({ price: 1 });

CreditTransactionSchema.index({ companyId: 1, transactionType: 1 });
CreditTransactionSchema.index({ timestamp: -1 });
CreditTransactionSchema.index({ service: 1 });
CreditTransactionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

AIServiceAnalyticsSchema.index({ companyId: 1, date: -1 });

// Pre-save middleware
CreditPackageSchema.pre("save", function (next) {
  this.totalCredits = this.credits + this.bonusCredits;
  next();
});

// Methods
SubscriptionPlanSchema.methods.getCreditCost = function (service) {
  return this.creditCosts[service] || 0;
};

SubscriptionPlanSchema.methods.hasFeature = function (feature) {
  return this.features[feature] === true || this.features[feature] === -1;
};

PaymentSchema.methods.markSucceeded = function (receiptUrl = null) {
  this.status = "succeeded";
  if (receiptUrl) this.receiptUrl = receiptUrl;
};

PaymentSchema.methods.markFailed = function (reason = null) {
  this.status = "failed";
  if (reason) this.description = reason;
};

CreditTransactionSchema.methods.reverse = function (
  reason = "Manual reversal"
) {
  if (!this.isReversible) {
    throw new Error("This transaction cannot be reversed");
  }

  return new this.constructor({
    companyId: this.companyId,
    transactionType: this.transactionType === "used" ? "refunded" : "used",
    service: this.service,
    creditsAmount: -this.creditsAmount,
    remainingCredits: this.remainingCredits + Math.abs(this.creditsAmount),
    description: `Reversal: ${reason}`,
    metadata: this.metadata,
    reversalTransactionId: this._id,
  });
};

module.exports = {
  SubscriptionPlan: mongoose.model("SubscriptionPlan", SubscriptionPlanSchema),
  Payment: mongoose.model("Payment", PaymentSchema),
  CreditPackage: mongoose.model("CreditPackage", CreditPackageSchema),
  CreditTransaction: mongoose.model(
    "CreditTransaction",
    CreditTransactionSchema
  ),
  AIServiceAnalytics: mongoose.model(
    "AIServiceAnalytics",
    AIServiceAnalyticsSchema
  ),
};
