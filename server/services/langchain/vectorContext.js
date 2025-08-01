const { ChromaClient } = require("chromadb");
const { OllamaEmbeddings } = require("@langchain/community/embeddings/ollama");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { Document } = require("@langchain/core/documents");
const { VectorStore } = require("../../models/VectorStore");
const { AIContext } = require("../../models/AIContext");
const config = require("../../config/env-config");
const { logger, aiLogger } = require("../../utils/logger");

class VectorContextService {
  constructor() {
    this.chromaClient = null;
    this.embeddings = null;
    this.collections = new Map(); // Cache for collection instances
    this.initialize();
  }

  async initialize() {
    try {
      // Initialize ChromaDB client
      this.chromaClient = new ChromaClient({
        path: config.chromaUrl || "http://localhost:8000",
      });

      // Initialize embeddings - prefer Ollama for local, fallback to Google
      if (config.ollamaUrl) {
        this.embeddings = new OllamaEmbeddings({
          baseUrl: config.ollamaUrl,
          model: "mxbai-embed-large", // Good embedding model
        });
        logger.info("Vector service initialized with Ollama embeddings");
      } else if (config.geminiApiKey) {
        this.embeddings = new GoogleGenerativeAIEmbeddings({
          apiKey: config.geminiApiKey,
          model: "embedding-001",
        });
        logger.info("Vector service initialized with Google embeddings");
      } else {
        throw new Error(
          "No embedding service available. Configure OLLAMA_URL or GEMINI_API_KEY"
        );
      }

      // Test connection
      await this.chromaClient.heartbeat();
      logger.info("ChromaDB connection established successfully");
    } catch (error) {
      logger.error("Failed to initialize vector context service:", error);
      throw error;
    }
  }

  async getOrCreateCollection(companyId) {
    const collectionName = `company_${companyId}`;

    try {
      // Check if collection exists in cache
      if (this.collections.has(collectionName)) {
        return this.collections.get(collectionName);
      }

      // Try to get existing collection
      let collection;
      try {
        collection = await this.chromaClient.getCollection({
          name: collectionName,
        });
        logger.info(`Retrieved existing collection: ${collectionName}`);
      } catch (error) {
        // Collection doesn't exist, create it
        collection = await this.chromaClient.createCollection({
          name: collectionName,
          metadata: {
            companyId: companyId.toString(),
            createdAt: new Date().toISOString(),
          },
        });
        logger.info(`Created new collection: ${collectionName}`);
      }

      // Cache the collection
      this.collections.set(collectionName, collection);
      return collection;
    } catch (error) {
      logger.error(
        `Error managing collection for company ${companyId}:`,
        error
      );
      throw error;
    }
  }

  async addDocumentToContext(companyId, content, metadata = {}) {
    try {
      const collection = await this.getOrCreateCollection(companyId);

      // Generate embedding
      const embedding = await this.embeddings.embedQuery(content);

      // Create unique document ID
      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Add to ChromaDB
      await collection.add({
        ids: [documentId],
        embeddings: [embedding],
        documents: [content],
        metadatas: [
          {
            ...metadata,
            timestamp: new Date().toISOString(),
            companyId: companyId.toString(),
          },
        ],
      });

      // Update MongoDB record
      let vectorStore = await VectorStore.findOne({ companyId });
      if (!vectorStore) {
        vectorStore = await VectorStore.createForCompany(
          companyId,
          metadata.businessType || "general"
        );
      }

      vectorStore.addDocument(content, metadata);
      await vectorStore.save();

      aiLogger.request("vector_add", "chroma", content, {
        documentId,
        companyId,
      });

      return documentId;
    } catch (error) {
      aiLogger.error("vector_add", "chroma", error, {
        companyId,
        content: content.substring(0, 100),
      });
      throw error;
    }
  }

  async searchContext(companyId, query, options = {}) {
    try {
      const collection = await this.getOrCreateCollection(companyId);

      // Generate query embedding
      const queryEmbedding = await this.embeddings.embedQuery(query);

      // Search in ChromaDB
      const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: options.limit || 5,
        where: options.filter || {},
        include: ["documents", "metadatas", "distances"],
      });

      // Format results
      const contextDocuments = results.documents[0].map((doc, index) => ({
        content: doc,
        metadata: results.metadatas[0][index],
        score: 1 - results.distances[0][index], // Convert distance to similarity
        id: results.ids[0][index],
      }));

      // Filter by relevance threshold
      const threshold = options.threshold || 0.7;
      const relevantDocs = contextDocuments.filter(
        (doc) => doc.score >= threshold
      );

      aiLogger.response("vector_search", "chroma", query, {
        companyId,
        resultsCount: relevantDocs.length,
        avgScore:
          relevantDocs.reduce((sum, doc) => sum + doc.score, 0) /
          relevantDocs.length,
      });

      return relevantDocs;
    } catch (error) {
      aiLogger.error("vector_search", "chroma", error, { companyId, query });
      throw error;
    }
  }

  async getCompanyContext(
    companyId,
    contextType = "general",
    sessionId = null
  ) {
    try {
      // Get vector context
      const vectorResults = await this.searchContext(companyId, "", {
        filter: { source: "business_info" },
        limit: 3,
      });

      // Get AI conversation context
      let aiContext = null;
      if (sessionId) {
        aiContext = await AIContext.findOrCreateContext(
          companyId,
          contextType,
          sessionId
        );
      }

      // Get company data
      const Company = require("../../models/Company");
      const company = await Company.findById(companyId);

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
        await this.addDocumentToContext(companyId, userMessage, {
          source: "conversation",
          contextType,
          sessionId,
          importance: this.calculateImportance(userMessage, metadata),
          extractedAt: new Date().toISOString(),
        });
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
      // Simple pattern extraction (can be enhanced with NLP)
      const patterns = [];

      // Extract product/service mentions
      const productMentions = userMessage.match(
        /(?:our|my|the)\s+(product|service|offering)s?\s+(\w+)/gi
      );
      if (productMentions) {
        patterns.push({
          pattern: "product_mention",
          context: productMentions.join(", "),
        });
      }

      // Extract customer pain points
      const painPoints = userMessage.match(
        /(?:problem|issue|challenge|difficulty|struggle)\s+with\s+(\w+)/gi
      );
      if (painPoints) {
        patterns.push({
          pattern: "pain_point",
          context: painPoints.join(", "),
        });
      }

      // Extract goals and objectives
      const goals = userMessage.match(
        /(?:want to|need to|goal is to|objective is to)\s+(\w+)/gi
      );
      if (goals) {
        patterns.push({
          pattern: "business_goal",
          context: goals.join(", "),
        });
      }

      // Update business context with extracted patterns
      if (patterns.length > 0) {
        await aiContext.updateBusinessContext({ learnedPatterns: patterns });
      }
    } catch (error) {
      logger.error("Error extracting business patterns:", error);
    }
  }

  async seedCompanyContext(companyId, initialData) {
    try {
      const documents = [];

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

      // Add target audience info
      if (initialData.targetAudience) {
        documents.push({
          content: `Target Audience: ${initialData.targetAudience}`,
          metadata: {
            source: "business_info",
            type: "target_audience",
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

      // Store all documents
      for (const doc of documents) {
        await this.addDocumentToContext(companyId, doc.content, doc.metadata);
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
      // Get relevant context
      const context = await this.getCompanyContext(
        companyId,
        contextType,
        sessionId
      );

      // Search for query-specific context
      const queryContext = await this.searchContext(companyId, userQuery, {
        limit: 3,
        threshold: 0.6,
      });

      // Format context for prompt injection
      const contextText = this.formatContextForPrompt(context, queryContext);

      return contextText;
    } catch (error) {
      logger.error("Error getting context for prompt:", error);
      return ""; // Return empty string on error to not break AI generation
    }
  }

  formatContextForPrompt(fullContext, queryContext) {
    const sections = [];

    // Company information
    if (fullContext.companyInfo) {
      const company = fullContext.companyInfo;
      sections.push(`Company: ${company.name}
Business Type: ${company.businessType}
Description: ${company.description || "Not provided"}
Target Audience: ${company.targetAudience || "General audience"}
Communication Tone: ${company.preferences?.communicationTone || "professional"}`);
    }

    // Relevant business context
    if (queryContext.length > 0) {
      const relevantInfo = queryContext.map((doc) => doc.content).join("\n");
      sections.push(`Relevant Business Context:\n${relevantInfo}`);
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
      sections.push(`Recent Conversation:\n${recentMessages}`);
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
