const mongoose = require("mongoose");

const imageGenSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
    index: true,
  },
  prompt: {
    type: String,
    required: true,
    trim: true,
    maxLength: 500,
  },
  enhancedPrompt: {
    type: String,
    trim: true,
  },
  style: {
    type: String,
    enum: ["realistic", "artistic", "cartoon", "abstract", "photographic"],
    default: "realistic",
  },
  aspectRatio: {
    type: String,
    enum: ["1:1", "16:9", "9:16", "4:3", "3:4"],
    default: "1:1",
  },
  imageUrl: {
    type: String,
    required: true,
  },
  cloudinaryUrl: {
    type: String,
    index: true,
  },
  imageDescription: {
    type: String,
    trim: true,
  },
  creditsUsed: {
    type: Number,
    required: true,
    min: 0,
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    aiModel: {
      type: String,
      default: "gemini-2.5-flash",
    },
    cloudinaryUrl: String, // Keep for backward compatibility
    localUrl: String,
    processingTime: {
      type: Number, // in milliseconds
    },
    imageSize: {
      width: Number,
      height: Number,
    },
  },
}, {
  timestamps: true,
});

// Indexes for better performance
imageGenSchema.index({ companyId: 1, generatedAt: -1 });
imageGenSchema.index({ generatedAt: -1 });

// Virtual for formatted generation date
imageGenSchema.virtual("formattedDate").get(function() {
  return this.generatedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
});

// Static method to get company's total images
imageGenSchema.statics.getCompanyImageCount = function(companyId) {
  return this.countDocuments({ companyId });
};

// Static method to get company's total credits used for images
imageGenSchema.statics.getCompanyImageCredits = function(companyId) {
  return this.aggregate([
    { $match: { companyId: mongoose.Types.ObjectId(companyId) } },
    { $group: { _id: null, totalCredits: { $sum: "$creditsUsed" } } },
  ]);
};

// Instance method to get short prompt for display
imageGenSchema.methods.getShortPrompt = function(maxLength = 50) {
  return this.prompt.length > maxLength
    ? this.prompt.substring(0, maxLength) + "..."
    : this.prompt;
};

module.exports = mongoose.model("ImageGen", imageGenSchema);
