const mongoose = require("mongoose");

// Vector Store Management Schema
const VectorStoreSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      unique: true,
      
    },
    collectionName: {
      type: String,
      required: true,
      unique: true,
    },
    vectorStoreType: {
      type: String,
      enum: ["chroma", "pinecone", "weaviate", "qdrant"],
      default: "chroma",
    },
    documents: [
      {
        documentId: {
          type: String,
          required: true,
        },
        content: {
          type: String,
          required: true,
          maxlength: 50000,
        },
        metadata: {
          type: mongoose.Schema.Types.Mixed,
          default: {},
        },
        embeddings: [
          {
            type: Number,
          },
        ],
        source: {
          type: String,
          enum: [
            "user_input",
            "website_content",
            "feedback",
            "chat_history",
            "product_info",
            "faq",
            "business_context",
            "manual_upload",
          ],
          required: true,
        },
        contentType: {
          type: String,
          enum: ["text", "json", "markdown", "html", "csv"],
          default: "text",
        },
        category: {
          type: String,
          enum: [
            "company_info",
            "products_services",
            "policies",
            "faq",
            "testimonials",
            "marketing_copy",
            "technical_docs",
            "customer_interactions",
          ],
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        lastUpdated: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    contextualData: {
      businessDomain: {
        type: String,
        maxlength: 500,
      },
      customerInteractions: {
        commonQueries: [String],
        responsePatterns: [String],
        preferredLanguage: String,
        customerSegments: [String],
      },
      productCatalog: {
        categories: [String],
        features: [String],
        benefits: [String],
        pricingInfo: mongoose.Schema.Types.Mixed,
      },
      companyKnowledge: {
        mission: String,
        values: [String],
        uniqueSellingPoints: [String],
        targetMarkets: [String],
        competitors: [String],
        brandGuidelines: mongoose.Schema.Types.Mixed,
      },
      marketingContext: {
        brandVoice: String,
        messagingFramework: mongoose.Schema.Types.Mixed,
        campaignHistory: [String],
        customerPersonas: [mongoose.Schema.Types.Mixed],
      },
    },
    configuration: {
      embeddingModel: {
        type: String,
        default: "mxbai-embed-large",
      },
      dimensionality: {
        type: Number,
        default: 768,
      },
      similarityThreshold: {
        type: Number,
        default: 0.7,
        min: 0,
        max: 1,
      },
      maxResults: {
        type: Number,
        default: 5,
        min: 1,
        max: 20,
      },
      chunkSize: {
        type: Number,
        default: 1000,
      },
      chunkOverlap: {
        type: Number,
        default: 200,
      },
    },
    indexStatus: {
      type: String,
      enum: [
        "initializing",
        "indexing",
        "ready",
        "updating",
        "error",
        "maintenance",
      ],
      default: "initializing",
      
    },
    indexMetrics: {
      totalDocuments: {
        type: Number,
        default: 0,
      },
      totalChunks: {
        type: Number,
        default: 0,
      },
      averageChunkSize: {
        type: Number,
        default: 0,
      },
      lastIndexTime: Date,
      indexingDuration: Number,
      errorCount: {
        type: Number,
        default: 0,
      },
      lastError: String,
    },
    usage: {
      totalSearches: {
        type: Number,
        default: 0,
      },
      averageRelevanceScore: {
        type: Number,
        default: 0,
      },
      popularQueries: [
        {
          query: String,
          count: Number,
          lastUsed: Date,
        },
      ],
      lastSearched: Date,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "vector_stores",
  }
);

// Document Chunk Schema (for better organization)
const DocumentChunkSchema = new mongoose.Schema(
  {
    vectorStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VectorStore",
      required: true,
      
    },
    parentDocumentId: {
      type: String,
      required: true,
      
    },
    chunkId: {
      type: String,
      required: true,
      unique: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    embeddings: [
      {
        type: Number,
      },
    ],
    metadata: {
      chunkIndex: Number,
      startOffset: Number,
      endOffset: Number,
      source: String,
      category: String,
      importance: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.5,
      },
    },
    searchMetrics: {
      timesRetrieved: {
        type: Number,
        default: 0,
      },
      averageRelevanceScore: {
        type: Number,
        default: 0,
      },
      lastRetrieved: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "document_chunks",
  }
);

// Search History Schema (for analytics and improvement)
const SearchHistorySchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      
    },
    vectorStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VectorStore",
      required: true,
    },
    query: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    results: [
      {
        documentId: String,
        chunkId: String,
        content: String,
        relevanceScore: Number,
        metadata: mongoose.Schema.Types.Mixed,
      },
    ],
    searchMetrics: {
      searchTime: Number,
      totalResults: Number,
      avgRelevanceScore: Number,
      searchType: {
        type: String,
        enum: ["similarity", "keyword", "hybrid"],
        default: "similarity",
      },
    },
    context: {
      service: {
        type: String,
        enum: ["chatbot", "website_gen", "email_gen", "general"],
      },
      sessionId: String,
      userIntent: String,
    },
    feedback: {
      wasHelpful: Boolean,
      relevanceRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      improvements: String,
    },
  },
  {
    timestamps: true,
    collection: "search_history",
  }
);

// Indexes
VectorStoreSchema.index({ indexStatus: 1 });
VectorStoreSchema.index({ "documents.source": 1 });
VectorStoreSchema.index({ "documents.category": 1 });

DocumentChunkSchema.index({ vectorStoreId: 1, parentDocumentId: 1 });
DocumentChunkSchema.index({ "metadata.category": 1 });

SearchHistorySchema.index({ companyId: 1, createdAt: -1 });
SearchHistorySchema.index({ query: "text" });
SearchHistorySchema.index({ "context.service": 1 });

// Methods for VectorStore
VectorStoreSchema.methods.addDocument = function (documentData) {
  const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  this.documents.push({
    documentId,
    ...documentData,
    lastUpdated: new Date(),
  });

  this.indexMetrics.totalDocuments += 1;
  this.lastUpdated = new Date();
  this.indexStatus = "updating";

  return documentId;
};

VectorStoreSchema.methods.updateDocument = function (documentId, updates) {
  const document = this.documents.find((doc) => doc.documentId === documentId);
  if (document) {
    Object.assign(document, updates);
    document.lastUpdated = new Date();
    this.lastUpdated = new Date();
    this.indexStatus = "updating";
    return true;
  }
  return false;
};

VectorStoreSchema.methods.removeDocument = function (documentId) {
  const index = this.documents.findIndex(
    (doc) => doc.documentId === documentId
  );
  if (index !== -1) {
    this.documents.splice(index, 1);
    this.indexMetrics.totalDocuments -= 1;
    this.lastUpdated = new Date();
    this.indexStatus = "updating";
    return true;
  }
  return false;
};

VectorStoreSchema.methods.updateIndexStatus = function (status, error = null) {
  this.indexStatus = status;
  this.indexMetrics.lastIndexTime = new Date();

  if (error) {
    this.indexMetrics.errorCount += 1;
    this.indexMetrics.lastError = error;
  }
};

VectorStoreSchema.methods.recordSearch = function (query, results, metrics) {
  this.usage.totalSearches += 1;
  this.usage.lastSearched = new Date();

  if (metrics && metrics.avgRelevanceScore) {
    const currentAvg = this.usage.averageRelevanceScore || 0;
    const count = this.usage.totalSearches;
    this.usage.averageRelevanceScore =
      (currentAvg * (count - 1) + metrics.avgRelevanceScore) / count;
  }

  // Update popular queries
  const existingQuery = this.usage.popularQueries.find(
    (q) => q.query === query
  );
  if (existingQuery) {
    existingQuery.count += 1;
    existingQuery.lastUsed = new Date();
  } else if (this.usage.popularQueries.length < 100) {
    this.usage.popularQueries.push({
      query,
      count: 1,
      lastUsed: new Date(),
    });
  }

  // Sort popular queries by count
  this.usage.popularQueries.sort((a, b) => b.count - a.count);
};

// Methods for DocumentChunk
DocumentChunkSchema.methods.recordRetrieval = function (relevanceScore) {
  this.searchMetrics.timesRetrieved += 1;
  this.searchMetrics.lastRetrieved = new Date();

  if (relevanceScore) {
    const currentAvg = this.searchMetrics.averageRelevanceScore || 0;
    const count = this.searchMetrics.timesRetrieved;
    this.searchMetrics.averageRelevanceScore =
      (currentAvg * (count - 1) + relevanceScore) / count;
  }
};

// Static methods
VectorStoreSchema.statics.createForCompany = async function (
  companyId,
  businessData = {}
) {
  const collectionName = `company_${companyId}_${Date.now()}`;

  const vectorStore = new this({
    companyId,
    collectionName,
    contextualData: {
      businessDomain: businessData.businessType || "general",
      companyKnowledge: {
        mission: businessData.businessDescription || "",
        values: businessData.keyMessages || [],
        uniqueSellingPoints: businessData.productServices || [],
      },
    },
    indexStatus: "initializing",
  });

  return await vectorStore.save();
};

SearchHistorySchema.statics.getPopularQueries = async function (
  companyId,
  limit = 10
) {
  return await this.aggregate([
    { $match: { companyId } },
    {
      $group: {
        _id: "$query",
        count: { $sum: 1 },
        lastUsed: { $max: "$createdAt" },
      },
    },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
};

module.exports = {
  VectorStore: mongoose.model("VectorStore", VectorStoreSchema),
  DocumentChunk: mongoose.model("DocumentChunk", DocumentChunkSchema),
  SearchHistory: mongoose.model("SearchHistory", SearchHistorySchema),
};
