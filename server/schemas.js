// User/Company Schema
const CompanySchema = {
  _id: ObjectId,
  companyName: String,
  email: String,
  password: String, // hashed
  businessType: String, // e.g., "restaurant", "retail", "service"
  targetAudience: String,
  businessDescription: String,
  preferences: {
    colorScheme: String,
    brandStyle: String, // "modern", "classic", "minimal"
    communicationTone: String, // "formal", "casual", "friendly"
    marketingGoals: [String],
    contentStyle: String,
  },
  aiContextProfile: {
    businessPersonality: String,
    keyMessages: [String],
    brandVoice: String,
    commonQueries: [String],
    productServices: [String],
    contextualData: Object, // For LangChain vector context
    vectorCollectionId: String, // Reference to company's vector collection
    contextualPreferences: {
      preferredAIModel: String, // "gemini", "ollama-llama3", etc.
      responseStyle: String,
      industrySpecificContext: Object,
    },
  },
  subscription: {
    plan: String, // "free", "starter", "professional"
    subscriptionId: String, // Payment provider subscription ID
    status: String, // "active", "canceled", "past_due", "incomplete"
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: Boolean,
    featuresEnabled: [String],
  },
  credits: {
    currentCredits: Number,
    totalCreditsUsed: Number,
    dailyCreditsUsed: Number,
    lastCreditReset: Date, // For daily credit reset tracking
    creditHistory: [
      {
        action: String, // "earned", "used", "purchased", "refunded"
        amount: Number,
        service: String, // "website_gen", "email_gen", "image_gen", "chatbot"
        timestamp: Date,
        description: String,
      },
    ],
  },
  usage: {
    websitesGenerated: Number,
    emailsSent: Number,
    imagesGenerated: Number,
    chatbotQueries: Number,
    vectorSearches: Number,
    lastUsageReset: Date,
  },
  createdAt: Date,
  updatedAt: Date,
};

// AI Context Memory Schema
const AIContextSchema = {
  _id: ObjectId,
  companyId: ObjectId,
  contextType: String, // "chatbot", "email", "website", "image_gen"
  conversationHistory: [
    {
      role: String, // "user", "assistant"
      content: String,
      timestamp: Date,
      metadata: Object,
    },
  ],
  businessContext: {
    extractedPreferences: Object,
    learnedPatterns: [String],
    customerInsights: Object,
  },
  vectorDocumentIds: [String], // References to Chroma vector store
  createdAt: Date,
  updatedAt: Date,
};

// Generated Content Schema
const GeneratedContentSchema = {
  _id: ObjectId,
  companyId: ObjectId,
  contentType: String, // "website", "email", "image", "chatbot_response"
  prompt: String,
  generatedContent: Object, // Flexible structure for different content types
  feedback: {
    rating: Number,
    comments: String,
    improvements: [String],
  },
  aiModel: String, // "gemini", "ollama", etc.
  version: Number,
  isActive: Boolean,
  createdAt: Date,
};

// Website Templates Schema
const WebsiteTemplateSchema = {
  _id: ObjectId,
  companyId: ObjectId,
  templateName: String,
  industry: String,
  structure: {
    header: Object,
    sections: [Object],
    footer: Object,
    styling: Object,
  },
  aiGenerated: Boolean,
  customizations: Object,
  isPublished: Boolean,
  createdAt: Date,
};

// Email Campaigns Schema
const EmailCampaignSchema = {
  _id: ObjectId,
  companyId: ObjectId,
  campaignName: String,
  emailContent: {
    subject: String,
    body: String,
    template: String,
  },
  targetAudience: String,
  scheduledDate: Date,
  status: String, // "draft", "scheduled", "sent"
  analytics: {
    sent: Number,
    opened: Number,
    clicked: Number,
    conversions: Number,
  },
  aiGenerated: Boolean,
  createdAt: Date,
};

// Chatbot Configuration Schema
const ChatbotConfigSchema = {
  _id: ObjectId,
  companyId: ObjectId,
  botName: String,
  personality: String,
  knowledgeBase: [Object],
  commonQuestions: [Object],
  fallbackResponses: [String],
  isActive: Boolean,
  performance: {
    totalQueries: Number,
    resolvedQueries: Number,
    averageRating: Number,
  },
  createdAt: Date,
  updatedAt: Date,
};

// Subscription Plans Schema
const SubscriptionPlanSchema = {
  _id: ObjectId,
  planName: String, // "free", "starter", "professional"
  displayName: String,
  description: String,
  price: {
    monthly: Number,
    yearly: Number,
    currency: String,
  },
  features: {
    dailyCredits: Number, // Free: 10, Starter: 100, Professional: 500
    bonusCredits: Number, // Additional credits on subscription
    websiteTemplates: Number, // -1 for unlimited
    emailCampaigns: Number,
    imageGenerations: Number,
    chatbotQueries: Number,
    vectorSearchLimit: Number,
    customBranding: Boolean,
    prioritySupport: Boolean,
    apiAccess: Boolean,
    advancedAnalytics: Boolean,
    customDomains: Boolean,
  },
  creditCosts: {
    websiteGeneration: Number, // Credits per website
    emailGeneration: Number, // Credits per email
    imageGeneration: Number, // Credits per image
    chatbotQuery: Number, // Credits per chatbot interaction
    vectorSearch: Number, // Credits per vector search
  },
  stripePriceId: String, // Stripe price ID for integration
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
};

// Payment Schema
const PaymentSchema = {
  _id: ObjectId,
  companyId: ObjectId,
  paymentIntentId: String, // Stripe payment intent ID
  subscriptionId: String, // Stripe subscription ID
  amount: Number,
  currency: String,
  status: String, // "pending", "succeeded", "failed", "canceled"
  paymentMethod: String, // "card", "bank_transfer", etc.
  description: String,
  metadata: {
    planName: String,
    creditsAdded: Number,
    billingPeriod: String,
  },
  invoiceUrl: String,
  receiptUrl: String,
  createdAt: Date,
  updatedAt: Date,
};

// Credit Packages Schema (for one-time credit purchases)
const CreditPackageSchema = {
  _id: ObjectId,
  packageName: String,
  displayName: String,
  credits: Number,
  price: Number,
  currency: String,
  bonusCredits: Number, // Extra credits for bulk purchases
  stripePriceId: String,
  isActive: Boolean,
  validityDays: Number, // How long purchased credits are valid
  createdAt: Date,
};

// Vector Store Management Schema
const VectorStoreSchema = {
  _id: ObjectId,
  companyId: ObjectId,
  collectionName: String, // Unique collection for each company
  vectorStoreType: String, // "chroma", "pinecone", etc.
  documents: [
    {
      documentId: String,
      content: String,
      metadata: Object,
      embeddings: [Number], // Optional: store embeddings if needed
      source: String, // "user_input", "website_content", "feedback", etc.
      timestamp: Date,
    },
  ],
  contextualData: {
    businessDomain: String,
    customerInteractions: Object,
    productCatalog: Object,
    companyKnowledge: Object,
  },
  indexStatus: String, // "indexing", "ready", "error"
  lastUpdated: Date,
  createdAt: Date,
};

// Credit Transaction Schema (for detailed tracking)
const CreditTransactionSchema = {
  _id: ObjectId,
  companyId: ObjectId,
  transactionType: String, // "earned", "used", "purchased", "expired", "refunded"
  service: String, // "website_gen", "email_gen", "image_gen", "chatbot", "vector_search"
  creditsAmount: Number, // Positive for earned/purchased, negative for used
  remainingCredits: Number, // Credits after this transaction
  description: String,
  metadata: {
    contentId: ObjectId, // Reference to generated content
    sessionId: String,
    aiModel: String,
    promptTokens: Number,
    responseTokens: Number,
  },
  timestamp: Date,
  expiresAt: Date, // For purchased credits that expire
};

// AI Service Usage Analytics Schema
const AIServiceAnalyticsSchema = {
  _id: ObjectId,
  companyId: ObjectId,
  date: Date, // Daily aggregation
  services: {
    websiteGeneration: {
      requests: Number,
      creditsUsed: Number,
      successRate: Number,
      averageRating: Number,
    },
    emailGeneration: {
      requests: Number,
      creditsUsed: Number,
      emailsSent: Number,
      openRate: Number,
    },
    imageGeneration: {
      requests: Number,
      creditsUsed: Number,
      successRate: Number,
      averageProcessingTime: Number,
    },
    chatbotQueries: {
      requests: Number,
      creditsUsed: Number,
      resolvedQueries: Number,
      averageRating: Number,
    },
    vectorSearches: {
      requests: Number,
      creditsUsed: Number,
      averageRelevanceScore: Number,
    },
  },
  totalCreditsUsed: Number,
  createdAt: Date,
};
