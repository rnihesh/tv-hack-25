const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { OllamaEmbeddings } = require("@langchain/community/embeddings/ollama");
const config = require("../../config/env-config");
const { logger } = require("../../utils/logger");

class FeedbackVectorStore {
  constructor() {
    this.embeddings = null;
    this.vectorStore = null;
    this.textSplitter = null;
    this.initialized = false;
    this.feedbackIndex = new Map(); // In-memory index for feedback documents
  }

  async initialize() {
    try {
      // Initialize embeddings with fallback logic
      let embeddingsInitialized = false;

      // Try Ollama first
      if (config.ollamaUrl) {
        try {
          const fetch = require("node-fetch");
          const response = await fetch(`${config.ollamaUrl}/api/tags`, {
            method: "GET",
            timeout: 3000,
          });

          if (response.ok) {
            this.embeddings = new OllamaEmbeddings({
              baseUrl: config.ollamaUrl,
              model: "mxbai-embed-large",
            });

            // Skip test embeddings to save API calls
            logger.info(
              "Feedback vector store initialized with Ollama embeddings"
            );
            embeddingsInitialized = true;
          }
        } catch (ollamaError) {
          logger.warn(`Ollama not available: ${ollamaError.message}`);
        }
      }

      // Fallback to Google
      if (!embeddingsInitialized && config.geminiApiKey) {
        try {
          this.embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: config.geminiApiKey,
            model: "text-embedding-004",
          });

          // Skip test embeddings to save API calls
          logger.info(
            "Feedback vector store initialized with Google embeddings"
          );
          embeddingsInitialized = true;
        } catch (geminiError) {
          logger.error(`Google embeddings failed: ${geminiError.message}`);
        }
      }

      if (!embeddingsInitialized) {
        throw new Error("No embedding service available");
      }

      // Initialize vector store
      this.vectorStore = new MemoryVectorStore(this.embeddings);

      // Initialize text splitter for large feedback texts
      this.textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 50,
      });

      this.initialized = true;
      logger.info("Feedback vector store fully initialized");
      return true;
    } catch (error) {
      logger.error("Failed to initialize feedback vector store:", error);
      throw error;
    }
  }

  async addFeedback(feedback) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const feedbackId =
        feedback.id ||
        `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create document content
      const content = `
Feedback: ${feedback.text}
Sentiment: ${feedback.sentiment || "unknown"}
Source: ${feedback.source || "unknown"}
Date: ${feedback.date || new Date().toISOString()}
Location: ${feedback.location || "unknown"}
Confidence: ${feedback.confidence || "unknown"}
User: ${feedback.userId || "anonymous"}
      `.trim();

      // Split text if needed
      const docs = await this.textSplitter.createDocuments(
        [content],
        [
          {
            feedbackId,
            originalText: feedback.text,
            sentiment: feedback.sentiment,
            source: feedback.source,
            date: feedback.date,
            location: feedback.location,
            confidence: feedback.confidence,
            userId: feedback.userId,
            type: "feedback",
          },
        ]
      );

      // Add to vector store
      await this.vectorStore.addDocuments(docs);

      // Add to our index for quick lookup
      this.feedbackIndex.set(feedbackId, {
        ...feedback,
        id: feedbackId,
        addedAt: new Date(),
      });

      logger.info(`Added feedback ${feedbackId} to vector store`);
      return feedbackId;
    } catch (error) {
      logger.error("Error adding feedback to vector store:", error);
      throw error;
    }
  }

  async searchSimilarFeedback(query, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const { limit = 5, filter = {}, similarityThreshold = 0.6 } = options;

      // Search for similar feedback
      const results = await this.vectorStore.similaritySearchWithScore(
        query,
        limit
      );

      // Filter results by similarity threshold and any additional filters
      const filteredResults = results
        .filter(([doc, score]) => score >= similarityThreshold)
        .map(([doc, score]) => ({
          content: doc.pageContent,
          metadata: doc.metadata,
          similarity: score,
          feedbackId: doc.metadata.feedbackId,
        }));

      // Apply additional filters if provided
      let finalResults = filteredResults;
      if (Object.keys(filter).length > 0) {
        finalResults = filteredResults.filter((result) => {
          return Object.entries(filter).every(
            ([key, value]) => result.metadata[key] === value
          );
        });
      }

      return finalResults;
    } catch (error) {
      logger.error("Error searching similar feedback:", error);
      return [];
    }
  }

  async getFeedbackById(feedbackId) {
    return this.feedbackIndex.get(feedbackId) || null;
  }

  async getAllFeedback() {
    return Array.from(this.feedbackIndex.values());
  }

  async getFeedbackByFilter(filter) {
    const allFeedback = Array.from(this.feedbackIndex.values());
    return allFeedback.filter((feedback) => {
      return Object.entries(filter).every(
        ([key, value]) => feedback[key] === value
      );
    });
  }

  async getStats() {
    const allFeedback = Array.from(this.feedbackIndex.values());

    const sentimentCounts = allFeedback.reduce((acc, feedback) => {
      const sentiment = feedback.sentiment || "unknown";
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {});

    const sourceCounts = allFeedback.reduce((acc, feedback) => {
      const source = feedback.source || "unknown";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    return {
      totalFeedback: allFeedback.length,
      sentimentDistribution: sentimentCounts,
      sourceDistribution: sourceCounts,
      dateRange: {
        earliest:
          allFeedback.length > 0
            ? Math.min(
                ...allFeedback.map((f) =>
                  new Date(f.date || f.addedAt).getTime()
                )
              )
            : null,
        latest:
          allFeedback.length > 0
            ? Math.max(
                ...allFeedback.map((f) =>
                  new Date(f.date || f.addedAt).getTime()
                )
              )
            : null,
      },
    };
  }

  async clearStore() {
    this.feedbackIndex.clear();
    if (this.vectorStore) {
      this.vectorStore = new MemoryVectorStore(this.embeddings);
    }
    logger.info("Feedback vector store cleared");
  }
}

// Create singleton instance
const feedbackVectorStore = new FeedbackVectorStore();

module.exports = {
  FeedbackVectorStore,
  feedbackVectorStore,
};
