const mongoose = require("mongoose");

const GeneratedContentSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      
    },
    contentType: {
      type: String,
      enum: [
        "website",
        "email",
        "image",
        "chatbot_response",
        "logo",
        "banner",
        "social_media",
      ],
      required: true,
      
    },
    prompt: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    generatedContent: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    metadata: {
      imageUrl: String,
      imageSize: {
        width: Number,
        height: Number,
      },
      fileFormat: String,
      fileSize: Number,
      resolution: String,
      style: String,
      colors: [String],
      tags: [String],
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comments: {
        type: String,
        maxlength: 1000,
      },
      improvements: [
        {
          type: String,
          maxlength: 200,
        },
      ],
      isUseful: {
        type: Boolean,
      },
      feedbackDate: {
        type: Date,
      },
    },
    aiModel: {
      type: String,
      enum: [
        "gemini-2.5-flash",
        "ollama-llama3",
        "dalle-3",
        "stable-diffusion",
        "custom",
      ],
      required: true,
    },
    generation: {
      tokensUsed: Number,
      processingTime: Number,
      cost: Number,
      quality: String,
    },
    version: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    parentContentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GeneratedContent",
    },
    variants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GeneratedContent",
      },
    ],
    usage: {
      downloads: {
        type: Number,
        default: 0,
      },
      views: {
        type: Number,
        default: 0,
      },
      shares: {
        type: Number,
        default: 0,
      },
      lastAccessed: Date,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "generated_content",
  }
);

// Indexes
GeneratedContentSchema.index({ companyId: 1, contentType: 1 });
GeneratedContentSchema.index({ createdAt: -1 });
GeneratedContentSchema.index({ isActive: 1 });
GeneratedContentSchema.index({ aiModel: 1 });
GeneratedContentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Methods
GeneratedContentSchema.methods.addFeedback = function (
  rating,
  comments,
  improvements = []
) {
  this.feedback = {
    rating,
    comments,
    improvements,
    isUseful: rating >= 3,
    feedbackDate: new Date(),
  };
};

GeneratedContentSchema.methods.incrementUsage = function (type = "views") {
  if (this.usage[type] !== undefined) {
    this.usage[type] += 1;
    this.usage.lastAccessed = new Date();
  }
};

GeneratedContentSchema.methods.createVariant = function (
  newContent,
  newPrompt
) {
  const variant = new this.constructor({
    companyId: this.companyId,
    contentType: this.contentType,
    prompt: newPrompt,
    generatedContent: newContent,
    aiModel: this.aiModel,
    version: this.version + 1,
    parentContentId: this._id,
  });

  this.variants.push(variant._id);
  return variant;
};

GeneratedContentSchema.methods.setExpiration = function (days = 30) {
  this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

module.exports = mongoose.model("GeneratedContent", GeneratedContentSchema);
