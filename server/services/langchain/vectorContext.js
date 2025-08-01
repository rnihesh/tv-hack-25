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
            
            // Test with a simple embedding
            await this.embeddings.embedQuery("test");
            
            logger.info("Vector service initialized with Ollama embeddings");
            embeddingsInitialized = true;
          } else {
            logger.warn(`Ollama responded with status ${response.status}, falling back to Google`);
          }
        } catch (ollamaError) {
          logger.warn(`Ollama not accessible (${ollamaError.message}), falling back to Google embeddings`);
        }
      }
      
      // Fallback to Google if Ollama failed or not configured
      if (!embeddingsInitialized && config.geminiApiKey) {
        try {
          this.embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: config.geminiApiKey,
            model: "text-embedding-004", // Updated to latest model
          });
          
          // Test with a simple embedding
          await this.embeddings.embedQuery("test");
          
          logger.info("Vector service initialized with Google embeddings (fallback)");
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
      if (process.env.NODE_ENV === 'development') {
        logger.warn("Continuing without vector context service in development mode");
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
            throw new Error("No embeddings service available after re-initialization");
          }
        } catch (retryError) {
          logger.error(`Failed to generate embedding on retry: ${retryError.message}`);
          return { id: `fallback_${Date.now()}` };
        }
      }
      
      // Generate unique ID
      const id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
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
            $inc: { documentCount: 1 },
            $set: { lastUpdated: new Date() }
          },
          { upsert: true }
        );
      } catch (dbError) {
        logger.warn(`MongoDB update failed, but document was added to memory store: ${dbError.message}`);
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
        logger.warn("No embeddings service available, returning empty search results");
        return [];
      }
      
      // Generate query embedding with error handling
      let queryEmbedding;
      try {
        queryEmbedding = await this.embeddings.embedQuery(query);
      } catch (embeddingError) {
        logger.error(`Failed to generate query embedding: ${embeddingError.message}`);
        // Try to re-initialize and retry once
        try {
          await this.initialize();
          if (this.embeddings) {
            queryEmbedding = await this.embeddings.embedQuery(query);
          } else {
            throw new Error("No embeddings service available after re-initialization");
          }
        } catch (retryError) {
          logger.error(`Failed to generate query embedding on retry: ${retryError.message}`);
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
      // Get vector context - search with a general business query instead of empty string
      const vectorResults = await this.searchContext(companyId, "business information company profile services", {
        filter: { source: "business_info" },
        limit: 3,
      });

      // Get AI conversation context
      let aiContext = null;
      if (sessionId) {
        const AIContext = require("../../models/AIContext");
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
      if (!this.initialized) {
        await this.initialize();
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

      // Add target audience info
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
      if (initialData.preferences) {
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
      let companySection = `Company: ${company.name || "Unknown Company"}
Business Type: ${company.businessType || "General Business"}`;
      
      if (company.description && company.description !== "undefined") {
        companySection += `\nDescription: ${company.description}`;
      }
      
      if (company.targetAudience && company.targetAudience !== "undefined") {
        companySection += `\nTarget Audience: ${company.targetAudience}`;
      }
      
      if (company.preferences?.communicationTone) {
        companySection += `\nCommunication Tone: ${company.preferences.communicationTone}`;
      }
      
      if (company.preferences?.brandStyle) {
        companySection += `\nBrand Style: ${company.preferences.brandStyle}`;
      }
      
      if (company.preferences?.colorScheme) {
        companySection += `\nPreferred Colors: ${company.preferences.colorScheme}`;
      }
      
      // Add AI context profile information
      if (company.aiProfile?.businessPersonality) {
        companySection += `\nBusiness Personality: ${company.aiProfile.businessPersonality}`;
      }
      
      if (company.aiProfile?.keyMessages?.length > 0) {
        companySection += `\nKey Messages: ${company.aiProfile.keyMessages.join(", ")}`;
      }
      
      if (company.aiProfile?.brandVoice) {
        companySection += `\nBrand Voice: ${company.aiProfile.brandVoice}`;
      }
      
      sections.push(companySection);
    }

    // Relevant business context from vector store
    if (queryContext && queryContext.length > 0) {
      const relevantInfo = queryContext
        .filter(doc => doc.content && doc.content.trim()) // Filter out empty content
        .map((doc) => doc.content)
        .join("\n");
      if (relevantInfo.trim()) {
        sections.push(`Relevant Business Context:\n${relevantInfo}`);
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
