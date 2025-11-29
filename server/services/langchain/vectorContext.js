const { OllamaEmbeddings } = require("@langchain/community/embeddings/ollama");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { Document } = require("@langchain/core/documents");
const { VectorStore } = require("../../models/VectorStore");
const config = require("../../config/env-config");
const { logger, aiLogger } = require("../../utils/logger");
const { memoryVectorStore } = require("./memoryVectorStore");

class VectorContextService {
  constructor() {
    this.embeddings = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Initialize embeddings with fallback logic
      let embeddingsInitialized = false;

      // Try Ollama first if URL is configured
      if (config.ollamaUrl) {
        try {
          // Test Ollama connectivity first
          const fetch = require("node-fetch");
          const response = await fetch(`${config.ollamaUrl}/api/tags`, {
            method: "GET",
            timeout: 3000,
          });

          if (response.ok) {
            this.embeddings = new OllamaEmbeddings({
              baseUrl: config.ollamaUrl,
              model: "mxbai-embed-large", // Good embedding model
            });

            // Skip test embedding to save API calls
            logger.info("Vector service initialized with Ollama embeddings");
            embeddingsInitialized = true;
          } else {
            logger.warn(
              `Ollama responded with status ${response.status}, falling back to Google`
            );
          }
        } catch (ollamaError) {
          logger.warn(
            `Ollama not accessible (${ollamaError.message}), falling back to Google embeddings`
          );
        }
      }

      // Fallback to Google if Ollama failed or not configured
      if (!embeddingsInitialized && config.geminiApiKey) {
        try {
          this.embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: config.geminiApiKey,
            model: "text-embedding-004", // Updated to latest model
          });

          // Skip test embedding to save API calls
          logger.info(
            "Vector service initialized with Google embeddings (fallback)"
          );
          embeddingsInitialized = true;
        } catch (geminiError) {
          logger.error(`Google embeddings also failed: ${geminiError.message}`);
        }
      }

      if (!embeddingsInitialized) {
        throw new Error(
          "No embedding service available. Both Ollama and Google embeddings failed to initialize."
        );
      }

      this.initialized = true;
      return true;
    } catch (error) {
      logger.error("Failed to initialize vector context service:", error);
      if (process.env.NODE_ENV === "development") {
        logger.warn(
          "Continuing without vector context service in development mode"
        );
        this.initialized = true;
        return false;
      }
      throw error;
    }
  }

  async getOrCreateCollection(companyId) {
    // Use the memory vector store directly
    return memoryVectorStore.getCollection(companyId);
  }

  async addDocumentToContext(companyId, document, metadata) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!this.embeddings) {
        logger.warn("No embeddings service available, skipping vector storage");
        return { id: `fallback_${Date.now()}` };
      }

      // Check for duplicate content to prevent redundant storage
      const collection = await this.getOrCreateCollection(companyId);
      const existingDoc = collection.documents.find(
        (doc) => doc.toLowerCase().trim() === document.toLowerCase().trim()
      );

      if (existingDoc) {
        logger.info(
          `Document already exists for company ${companyId}, skipping duplicate`
        );
        return { id: `existing_${Date.now()}` };
      }

      // Generate embedding for document with error handling
      let embedding;
      try {
        embedding = await this.embeddings.embedQuery(document);
      } catch (embeddingError) {
        logger.error(`Failed to generate embedding: ${embeddingError.message}`);
        // Re-initialize embeddings and try once more
        try {
          await this.initialize();
          if (this.embeddings) {
            embedding = await this.embeddings.embedQuery(document);
          } else {
            throw new Error(
              "No embeddings service available after re-initialization"
            );
          }
        } catch (retryError) {
          logger.error(
            `Failed to generate embedding on retry: ${retryError.message}`
          );
          return { id: `fallback_${Date.now()}` };
        }
      }

      // Generate unique ID
      const id = `doc_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 15)}`;

      // Store in memory vector store
      await memoryVectorStore.addDocuments(
        companyId,
        [document],
        [metadata],
        [embedding],
        [id]
      );

      // Update MongoDB record if applicable
      try {
        await VectorStore.updateOne(
          { companyId },
          {
            $inc: { "indexMetrics.totalDocuments": 1 },
            $set: { lastUpdated: new Date() },
          },
          { upsert: true }
        );
      } catch (dbError) {
        logger.warn(
          `MongoDB update failed, but document was added to memory store: ${dbError.message}`
        );
      }

      return { id };
    } catch (error) {
      logger.error("Error adding document to context:", error);
      throw error;
    }
  }

  async searchContext(companyId, query, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!this.embeddings) {
        logger.warn(
          "No embeddings service available, returning empty search results"
        );
        return [];
      }

      // Generate query embedding with error handling
      let queryEmbedding;
      try {
        queryEmbedding = await this.embeddings.embedQuery(query);
      } catch (embeddingError) {
        logger.error(
          `Failed to generate query embedding: ${embeddingError.message}`
        );
        // Try to re-initialize and retry once
        try {
          await this.initialize();
          if (this.embeddings) {
            queryEmbedding = await this.embeddings.embedQuery(query);
          } else {
            throw new Error(
              "No embeddings service available after re-initialization"
            );
          }
        } catch (retryError) {
          logger.error(
            `Failed to generate query embedding on retry: ${retryError.message}`
          );
          return []; // Return empty results on failure
        }
      }

      // Search in memory store
      const results = await memoryVectorStore.queryCollection(
        companyId,
        queryEmbedding,
        { limit: options.limit || 5 }
      );

      // Format results
      const contextDocuments = results.documents[0].map((doc, index) => ({
        content: doc,
        metadata: results.metadatas[0][index],
        score: 1 - results.distances[0][index], // Convert distance to similarity
        id: results.ids[0][index],
      }));

      return contextDocuments;
    } catch (error) {
      logger.error("Error searching context:", error);
      return []; // Return empty results on error
    }
  }

  async getCompanyContext(
    companyId,
    contextType = "general",
    sessionId = null
  ) {
    try {
      // Get vector context using actual query context instead of generic search
      const vectorResults = await this.searchContext(
        companyId,
        `${contextType} business context`,
        {
          filter: { source: "business_info" },
          limit: 3,
        }
      );

      // Get AI conversation context (only if sessionId provided)
      let aiContext = null;
      if (sessionId) {
        const AIContext = require("../../models/AIContext");
        aiContext = await AIContext.findOrCreateContext(
          companyId,
          contextType,
          sessionId
        );
      }

      // Get company data (cached to avoid repeated DB calls)
      if (!this.companyCache) this.companyCache = new Map();
      let company = this.companyCache.get(companyId);
      if (!company) {
        const Company = require("../../models/Company");
        company = await Company.findById(companyId).select(
          "companyName businessType businessDescription targetAudience preferences aiContextProfile"
        );
        if (company) {
          // Cache for 5 minutes to balance freshness and performance
          this.companyCache.set(companyId, company);
          setTimeout(() => this.companyCache.delete(companyId), 5 * 60 * 1000);
        }
      }

      // Combine all context
      const fullContext = {
        companyInfo: {
          name: company.companyName,
          businessType: company.businessType,
          description: company.businessDescription,
          targetAudience: company.targetAudience,
          preferences: company.preferences,
          aiProfile: company.aiContextProfile,
        },
        vectorContext: vectorResults,
        conversationContext: aiContext ? aiContext.getContextForAI() : null,
        businessInsights: aiContext ? aiContext.businessContext : null,
      };

      return fullContext;
    } catch (error) {
      logger.error("Error getting company context:", error);
      throw error;
    }
  }

  async updateContextFromInteraction(
    companyId,
    contextType,
    sessionId,
    userMessage,
    aiResponse,
    metadata = {}
  ) {
    try {
      // Update AI context
      const AIContext = require("../../models/AIContext");
      const aiContext = await AIContext.findOrCreateContext(
        companyId,
        contextType,
        sessionId
      );

      // Add conversation messages
      await aiContext.addMessage("user", userMessage, metadata);
      await aiContext.addMessage("assistant", aiResponse, {
        ...metadata,
        model: metadata.model,
        tokenCount: metadata.tokenCount,
      });

      // Extract and store important information in vector store
      if (this.shouldStoreInVector(userMessage, metadata)) {
        const docResult = await this.addDocumentToContext(
          companyId,
          userMessage,
          {
            source: "conversation",
            contextType,
            sessionId,
            importance: this.calculateImportance(userMessage, metadata),
            extractedAt: new Date().toISOString(),
          }
        );

        // Track vector document ID in AI context
        if (
          docResult.id &&
          !docResult.id.startsWith("existing_") &&
          !docResult.id.startsWith("fallback_")
        ) {
          if (!aiContext.vectorDocumentIds) {
            aiContext.vectorDocumentIds = [];
          }
          aiContext.vectorDocumentIds.push(docResult.id);
          // Keep only last 20 document IDs
          if (aiContext.vectorDocumentIds.length > 20) {
            aiContext.vectorDocumentIds =
              aiContext.vectorDocumentIds.slice(-20);
          }
        }
      }

      // Update business context patterns
      await this.extractBusinessPatterns(aiContext, userMessage, aiResponse);

      return aiContext;
    } catch (error) {
      logger.error("Error updating context from interaction:", error);
      throw error;
    }
  }

  shouldStoreInVector(message, metadata) {
    // Store in vector if message contains business information
    const businessKeywords = [
      "product",
      "service",
      "customer",
      "price",
      "feature",
      "problem",
      "solution",
      "goal",
      "target",
      "audience",
      "competitor",
      "brand",
    ];

    const messageWords = message.toLowerCase().split(" ");
    const hasBusinessContent = businessKeywords.some((keyword) =>
      messageWords.some((word) => word.includes(keyword))
    );

    return hasBusinessContent || message.length > 50; // Store longer messages
  }

  calculateImportance(message, metadata) {
    let importance = 5; // Base importance

    // Increase for business-related content
    const businessKeywords = [
      "strategy",
      "goal",
      "customer",
      "problem",
      "solution",
    ];
    const messageWords = message.toLowerCase().split(" ");
    const businessMatches = businessKeywords.filter((keyword) =>
      messageWords.some((word) => word.includes(keyword))
    ).length;

    importance += businessMatches * 2;

    // Increase for longer, detailed messages
    if (message.length > 200) importance += 2;
    if (message.length > 500) importance += 2;

    return Math.min(importance, 10); // Cap at 10
  }

  async extractBusinessPatterns(aiContext, userMessage, aiResponse) {
    try {
      // Enhanced pattern extraction
      const patterns = [];
      const preferences = {};
      const lowerMessage = userMessage.toLowerCase();
      const lowerResponse = aiResponse.toLowerCase();

      // Extract product/service mentions
      const productMentions = userMessage.match(
        /(?:our|my|the|sell|offer|provide)\s+(product|service|offering|solution)s?\s*(\w*)/gi
      );
      if (productMentions) {
        patterns.push({
          pattern: "product_mention",
          context: productMentions.join(", "),
        });
      }

      // Extract customer pain points
      const painPoints = userMessage.match(
        /(?:problem|issue|challenge|difficulty|struggle|trouble|concern|worry)\s+(?:with|about)?\s*(\w+)/gi
      );
      if (painPoints) {
        patterns.push({
          pattern: "pain_point",
          context: painPoints.join(", "),
        });
      }

      // Extract goals and objectives
      const goals = userMessage.match(
        /(?:want to|need to|goal is to|objective is to|trying to|looking to|plan to|hope to)\s+([\w\s]+?)(?:\.|,|$)/gi
      );
      if (goals) {
        patterns.push({
          pattern: "business_goal",
          context: goals.join(", "),
        });
      }

      // Extract pricing mentions
      const priceMentions = userMessage.match(
        /(?:price|cost|budget|afford|expensive|cheap|\$\d+|\d+\s*(?:dollars|USD))/gi
      );
      if (priceMentions) {
        patterns.push({
          pattern: "pricing_interest",
          context: priceMentions.join(", "),
        });
      }

      // Extract competitor mentions
      const competitorMentions = userMessage.match(
        /(?:competitor|competition|alternative|compared to|instead of|vs|versus)\s+([\w\s]+?)(?:\.|,|$)/gi
      );
      if (competitorMentions) {
        patterns.push({
          pattern: "competitor_mention",
          context: competitorMentions.join(", "),
        });
      }

      // Extract topic preferences from messages (not just questions)
      const topics = [];
      if (
        lowerMessage.includes("price") ||
        lowerMessage.includes("cost") ||
        lowerMessage.includes("pricing")
      )
        topics.push("pricing");
      if (lowerMessage.includes("service") || lowerMessage.includes("product"))
        topics.push("offerings");
      if (
        lowerMessage.includes("support") ||
        lowerMessage.includes("help") ||
        lowerMessage.includes("team")
      )
        topics.push("support");
      if (
        lowerMessage.includes("feature") ||
        lowerMessage.includes("capability")
      )
        topics.push("features");
      if (
        lowerMessage.includes("deliver") ||
        lowerMessage.includes("ship") ||
        lowerMessage.includes("slow")
      )
        topics.push("delivery");
      if (
        lowerMessage.includes("quality") ||
        lowerMessage.includes("good") ||
        lowerMessage.includes("bad")
      )
        topics.push("quality");
      if (
        lowerMessage.includes("sale") ||
        lowerMessage.includes("buy") ||
        lowerMessage.includes("purchase")
      )
        topics.push("sales");

      if (topics.length > 0) {
        preferences.topicsOfInterest = topics;
      }

      // Detect sentiment from message
      const positiveWords = (
        lowerMessage.match(
          /\b(great|good|excellent|love|amazing|wonderful|perfect|best|happy|satisfied)\b/g
        ) || []
      ).length;
      const negativeWords = (
        lowerMessage.match(
          /\b(bad|poor|terrible|hate|awful|worst|unhappy|disappointed|frustrated|angry)\b/g
        ) || []
      ).length;

      if (positiveWords > 0 || negativeWords > 0) {
        preferences.lastSentiment =
          positiveWords > negativeWords
            ? "positive"
            : negativeWords > positiveWords
            ? "negative"
            : "neutral";
        preferences.sentimentScore = positiveWords - negativeWords;
      }

      // Update business context with extracted patterns and preferences
      if (patterns.length > 0 || Object.keys(preferences).length > 0) {
        await aiContext.updateBusinessContext({
          learnedPatterns: patterns,
          extractedPreferences: preferences,
        });
        logger.info(
          `Extracted ${patterns.length} patterns and ${
            Object.keys(preferences).length
          } preferences for context`
        );
      }
    } catch (error) {
      logger.error("Error extracting business patterns:", error);
    }
  }

  async seedCompanyContext(companyId, initialData) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Check if context already exists to prevent duplicates
      const existingCollection = await this.getOrCreateCollection(companyId);
      if (
        existingCollection.documents &&
        existingCollection.documents.length > 0
      ) {
        // Check if we have the company name document to verify this is proper seeding
        const hasCompanyName = existingCollection.documents.some((doc) =>
          doc.includes(`Company Name: ${initialData.companyName}`)
        );

        if (hasCompanyName) {
          logger.info(
            `Context already exists for company ${companyId}, skipping seeding`
          );
          return 0; // Return 0 documents added
        } else {
          // Clear incomplete/corrupted data
          await memoryVectorStore.deleteCollection(companyId);
          logger.info(
            `Cleared incomplete context for company ${companyId}, reseeding`
          );
        }
      }

      const documents = [];

      // Add company name and basic info
      if (initialData.companyName) {
        documents.push({
          content: `Company Name: ${initialData.companyName}`,
          metadata: {
            source: "business_info",
            type: "company_name",
            importance: 10,
          },
        });
      }

      // Add business type
      if (initialData.businessType) {
        documents.push({
          content: `Business Type: ${initialData.businessType}`,
          metadata: {
            source: "business_info",
            type: "business_type",
            importance: 9,
          },
        });
      }

      // Add company basic info
      if (initialData.businessDescription) {
        documents.push({
          content: `Company Description: ${initialData.businessDescription}`,
          metadata: {
            source: "business_info",
            type: "company_description",
            importance: 9,
          },
        });
      }

      // Add target audience info (only once!)
      if (initialData.targetAudience) {
        documents.push({
          content: `Target Audience: ${initialData.targetAudience}`,
          metadata: {
            source: "business_info",
            type: "target_audience",
            importance: 8,
          },
        });
      }

      // Add preferences info
      if (
        initialData.preferences &&
        Object.keys(initialData.preferences).length > 0
      ) {
        const preferencesText = Object.entries(initialData.preferences)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ");
        documents.push({
          content: `Company Preferences: ${preferencesText}`,
          metadata: {
            source: "business_info",
            type: "preferences",
            importance: 7,
          },
        });
      }

      // Add products/services
      if (
        initialData.productServices &&
        initialData.productServices.length > 0
      ) {
        const servicesText = initialData.productServices
          .map((service) => `${service.name}: ${service.description}`)
          .join("\n");
        documents.push({
          content: `Products and Services:\n${servicesText}`,
          metadata: {
            source: "business_info",
            type: "products_services",
            importance: 8,
          },
        });
      }

      // Add AI context profile info
      if (initialData.businessPersonality) {
        documents.push({
          content: `Business Personality: ${initialData.businessPersonality}`,
          metadata: {
            source: "business_info",
            type: "business_personality",
            importance: 7,
          },
        });
      }

      if (initialData.brandVoice) {
        documents.push({
          content: `Brand Voice: ${initialData.brandVoice}`,
          metadata: {
            source: "business_info",
            type: "brand_voice",
            importance: 7,
          },
        });
      }

      // Add key messages
      if (initialData.keyMessages && initialData.keyMessages.length > 0) {
        documents.push({
          content: `Key Messages: ${initialData.keyMessages.join(". ")}`,
          metadata: {
            source: "business_info",
            type: "key_messages",
            importance: 8,
          },
        });
      }

      // Store all documents in batch to reduce API calls
      if (documents.length > 0) {
        for (const doc of documents) {
          await this.addDocumentToContext(companyId, doc.content, doc.metadata);
        }

        // Update MongoDB VectorStore with correct document count
        try {
          await VectorStore.updateOne(
            { companyId },
            {
              $set: {
                "indexMetrics.totalDocuments": documents.length,
                lastUpdated: new Date(),
                indexStatus: "ready",
              },
            },
            { upsert: true }
          );
          logger.info(
            `Updated VectorStore totalDocuments to ${documents.length} for company ${companyId}`
          );
        } catch (dbError) {
          logger.warn(
            `Failed to update VectorStore totalDocuments: ${dbError.message}`
          );
        }
      }

      logger.info(
        `Seeded context for company ${companyId} with ${documents.length} documents`
      );
      return documents.length;
    } catch (error) {
      logger.error("Error seeding company context:", error);
      throw error;
    }
  }

  async getContextForPrompt(
    companyId,
    userQuery,
    contextType = "general",
    sessionId = null
  ) {
    try {
      // Lazy initialization: seed context if not exists
      await this.ensureCompanyContextExists(companyId);

      // Get relevant context with optimized search
      const context = await this.getCompanyContext(
        companyId,
        contextType,
        sessionId
      );

      // For queries longer than 10 chars, get additional query-specific context
      // Combine with general context search to reduce API calls
      let queryContext = [];
      if (userQuery && userQuery.length > 10) {
        // Use a more specific search that builds on the general context
        queryContext = await this.searchContext(companyId, userQuery, {
          limit: 3,
          threshold: 0.6, // Slightly lower threshold for better recall
          excludeTypes: ["company_name", "business_type"], // Avoid duplicating basic info
        });
      }

      // Format context for prompt injection with deduplication
      const contextText = this.formatContextForPrompt(context, queryContext);

      return contextText;
    } catch (error) {
      logger.error("Error getting context for prompt:", error);
      return ""; // Return empty string on error to not break AI generation
    }
  }

  async ensureCompanyContextExists(companyId) {
    try {
      // Check if context already exists
      const collection = await this.getOrCreateCollection(companyId);
      if (collection.documents && collection.documents.length > 0) {
        return; // Context already exists
      }

      // Seed context lazily with comprehensive company data
      const Company = require("../../models/Company");
      const company = await Company.findById(companyId).select(
        "companyName businessType businessDescription targetAudience preferences aiContextProfile"
      );

      if (company) {
        await this.seedCompanyContext(companyId, {
          companyName: company.companyName,
          businessType: company.businessType,
          businessDescription: company.businessDescription,
          targetAudience: company.targetAudience,
          preferences: company.preferences,
          productServices: company.aiContextProfile?.productServices,
          keyMessages: company.aiContextProfile?.keyMessages,
          businessPersonality: company.aiContextProfile?.businessPersonality,
          brandVoice: company.aiContextProfile?.brandVoice,
        });
        logger.info(`Lazily seeded context for company ${companyId}`);
      }
    } catch (error) {
      logger.warn(
        `Failed to ensure context exists for company ${companyId}: ${error.message}`
      );
    }
  }

  formatContextForPrompt(fullContext, queryContext) {
    const sections = [];

    // Company information - Make this very prominent for chatbot
    if (fullContext.companyInfo) {
      const company = fullContext.companyInfo;
      let companySection = `=== COMPANY INFORMATION ===
Company Name: ${company.name || "Unknown Company"}
Business Type: ${company.businessType || "General Business"}`;

      if (company.description && company.description !== "undefined") {
        companySection += `
Business Description: ${company.description}`;
      }

      if (company.targetAudience && company.targetAudience !== "undefined") {
        companySection += `
Target Audience: ${company.targetAudience}`;
      }

      if (company.preferences?.communicationTone) {
        companySection += `
Communication Tone: ${company.preferences.communicationTone}`;
      }

      if (company.preferences?.brandStyle) {
        companySection += `
Brand Style: ${company.preferences.brandStyle}`;
      }

      if (company.preferences?.colorScheme) {
        companySection += `
Preferred Colors: ${company.preferences.colorScheme}`;
      }

      // Add AI context profile information
      if (company.aiProfile?.businessPersonality) {
        companySection += `
Business Personality: ${company.aiProfile.businessPersonality}`;
      }

      if (company.aiProfile?.keyMessages?.length > 0) {
        companySection += `
Key Messages: ${company.aiProfile.keyMessages.join(", ")}`;
      }

      if (company.aiProfile?.brandVoice) {
        companySection += `
Brand Voice: ${company.aiProfile.brandVoice}`;
      }

      if (company.aiProfile?.productServices?.length > 0) {
        const services = company.aiProfile.productServices
          .map((service) => `${service.name}: ${service.description}`)
          .join(", ");
        companySection += `
Products/Services: ${services}`;
      }

      sections.push(companySection);
    }

    // Relevant business context from vector store (with deduplication)
    if (queryContext && queryContext.length > 0) {
      const seenContent = new Set();
      const relevantInfo = queryContext
        .filter((doc) => {
          if (!doc.content || !doc.content.trim()) return false;

          // Simple deduplication based on content similarity
          const contentKey = doc.content.toLowerCase().substring(0, 50);
          if (seenContent.has(contentKey)) return false;

          seenContent.add(contentKey);
          return true;
        })
        .map((doc) => doc.content)
        .join("\n");
      if (relevantInfo.trim()) {
        sections.push(`=== RELEVANT BUSINESS CONTEXT ===\n${relevantInfo}`);
      }
    }

    // Recent conversation context
    if (
      fullContext.conversationContext &&
      fullContext.conversationContext.messages.length > 0
    ) {
      const recentMessages = fullContext.conversationContext.messages
        .slice(-4) // Last 4 messages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");
      sections.push(`=== RECENT CONVERSATION ===\n${recentMessages}`);
    }

    return sections.join("\n\n");
  }

  async deleteCompanyContext(companyId) {
    try {
      const collectionName = `company_${companyId}`;

      // Delete from ChromaDB
      await this.chromaClient.deleteCollection({ name: collectionName });

      // Remove from cache
      this.collections.delete(collectionName);

      // Delete MongoDB records
      await VectorStore.deleteOne({ companyId });
      const AIContext = require("../../models/AIContext");
      await AIContext.deleteMany({ companyId });

      logger.info(`Deleted all context for company ${companyId}`);
    } catch (error) {
      logger.error("Error deleting company context:", error);
      throw error;
    }
  }
}

// Create singleton instance
const vectorContextService = new VectorContextService();

module.exports = {
  VectorContextService,
  vectorContextService,
};
