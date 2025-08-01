const mongoose = require("mongoose");

const EmailCampaignSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      
    },
    campaignName: {
      type: String,
      required: true,
      maxlength: 100,
    },
    emailContent: {
      subject: {
        type: String,
        required: true,
        maxlength: 200,
      },
      body: {
        type: String,
        required: true,
        maxlength: 50000,
      },
      template: {
        type: String,
        enum: [
          "newsletter",
          "promotion",
          "announcement",
          "welcome",
          "follow_up",
          "custom",
        ],
        default: "custom",
      },
      htmlContent: String,
      plainTextContent: String,
    },
    targetAudience: {
      type: String,
      maxlength: 500,
    },
    recipientList: [
      {
        email: {
          type: String,
          required: true,
        },
        name: String,
        customData: mongoose.Schema.Types.Mixed,
      },
    ],
    scheduledDate: {
      type: Date,
    },
    sentDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["draft", "scheduled", "sending", "sent", "failed", "paused"],
      default: "draft",
      
    },
    analytics: {
      sent: {
        type: Number,
        default: 0,
      },
      delivered: {
        type: Number,
        default: 0,
      },
      opened: {
        type: Number,
        default: 0,
      },
      clicked: {
        type: Number,
        default: 0,
      },
      bounced: {
        type: Number,
        default: 0,
      },
      unsubscribed: {
        type: Number,
        default: 0,
      },
      conversions: {
        type: Number,
        default: 0,
      },
      openRate: {
        type: Number,
        default: 0,
      },
      clickRate: {
        type: Number,
        default: 0,
      },
      lastUpdated: Date,
    },
    aiGenerated: {
      type: Boolean,
      default: true,
    },
    generationPrompt: {
      type: String,
      maxlength: 1000,
    },
    aiModel: {
      type: String,
      enum: ["gemini-2.5-flash", "ollama-llama3", "custom"],
    },
    personalizations: [
      {
        field: String,
        value: String,
      },
    ],
    abTesting: {
      enabled: {
        type: Boolean,
        default: false,
      },
      variants: [
        {
          name: String,
          subject: String,
          content: String,
          percentage: Number,
        },
      ],
      winningVariant: String,
    },
    deliveryProvider: {
      type: String,
      enum: ["sendgrid", "mailgun", "ses", "smtp"],
      default: "sendgrid",
    },
    tags: [String],
    notes: {
      type: String,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    collection: "email_campaigns",
  }
);

// Indexes
EmailCampaignSchema.index({ companyId: 1 });
EmailCampaignSchema.index({ status: 1 });
EmailCampaignSchema.index({ scheduledDate: 1 });
EmailCampaignSchema.index({ tags: 1 });

// Methods
EmailCampaignSchema.methods.updateAnalytics = function (analyticsData) {
  Object.assign(this.analytics, analyticsData);
  this.analytics.lastUpdated = new Date();

  // Calculate rates
  if (this.analytics.sent > 0) {
    this.analytics.openRate =
      (this.analytics.opened / this.analytics.sent) * 100;
    this.analytics.clickRate =
      (this.analytics.clicked / this.analytics.sent) * 100;
  }
};

EmailCampaignSchema.methods.schedule = function (scheduledDate) {
  this.scheduledDate = scheduledDate;
  this.status = "scheduled";
};

EmailCampaignSchema.methods.send = function () {
  this.status = "sending";
  this.sentDate = new Date();
};

EmailCampaignSchema.methods.markSent = function () {
  this.status = "sent";
  this.sentDate = new Date();
};

EmailCampaignSchema.methods.pause = function () {
  this.status = "paused";
};

EmailCampaignSchema.methods.addRecipients = function (recipients) {
  this.recipientList.push(...recipients);
};

module.exports = mongoose.model("EmailCampaign", EmailCampaignSchema);
