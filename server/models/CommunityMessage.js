// server/models/CommunityMessage.js
const mongoose = require("mongoose");

const communityMessageSchema = new mongoose.Schema({
  content: { 
    type: String, 
    required: true,
    maxLength: 1000,
    trim: true
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Company", 
    required: true 
  },
  topics: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company"
  }],
  replies: [{
    content: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    createdAt: { type: Date, default: Date.now }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
communityMessageSchema.index({ createdAt: -1 });
communityMessageSchema.index({ topics: 1 });
communityMessageSchema.index({ author: 1 });

module.exports = mongoose.model("CommunityMessage", communityMessageSchema);
