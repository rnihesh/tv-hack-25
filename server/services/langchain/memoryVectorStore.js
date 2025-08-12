const { logger } = require("../../utils/logger");

/**
 * Simple in-memory vector store implementation
 * Replaces ChromaDB with basic functionality for development
 */
class MemoryVectorStore {
  constructor() {
    this.collections = new Map();
    logger.info("In-memory vector store initialized");
  }

  // Create a collection for a company
  createCollection(companyId) {
    const collectionName = `company_${companyId}`;
    if (!this.collections.has(collectionName)) {
      this.collections.set(collectionName, {
        documents: [],
        metadatas: [],
        embeddings: [],
        ids: [],
      });
      logger.info(`Created memory collection for company ${companyId}`);
    }
    return this.collections.get(collectionName);
  }

  // Get or create a collection
  getCollection(companyId) {
    const collectionName = `company_${companyId}`;
    return this.collections.has(collectionName)
      ? this.collections.get(collectionName)
      : this.createCollection(companyId);
  }

  // Add documents to collection with duplicate checking
  async addDocuments(companyId, documents, metadatas, embeddings, ids) {
    const collection = this.getCollection(companyId);

    // Validate input arrays
    const MAX_DOCS = 100;
    if (
      !Array.isArray(documents) ||
      !Array.isArray(metadatas) ||
      !Array.isArray(embeddings) ||
      !Array.isArray(ids) ||
      documents.length > MAX_DOCS ||
      metadatas.length > MAX_DOCS ||
      embeddings.length > MAX_DOCS ||
      ids.length > MAX_DOCS
    ) {
      logger.warn(
        `Rejected addDocuments: invalid input arrays or too many documents (max ${MAX_DOCS}) for company ${companyId}`
      );
      return { success: false, error: "Invalid input arrays or too many documents" };
    }

    // Check for duplicates by content
    const newDocuments = [];
    const newMetadatas = [];
    const newEmbeddings = [];
    const newIds = [];

    for (let i = 0; i < documents.length; i++) {
      const documentContent = documents[i];
      const isDuplicate = collection.documents.some(
        (existingDoc) =>
          existingDoc === documentContent ||
          existingDoc.includes(documentContent.substring(0, 50)) // Check first 50 chars
      );

      if (!isDuplicate) {
        newDocuments.push(documentContent);
        newMetadatas.push(metadatas[i]);
        newEmbeddings.push(embeddings[i]);
        newIds.push(ids[i]);
      }
    }

    // Add only new documents
    for (let i = 0; i < newDocuments.length; i++) {
      collection.documents.push(newDocuments[i]);
      collection.metadatas.push(newMetadatas[i]);
      collection.embeddings.push(newEmbeddings[i]);
      collection.ids.push(newIds[i]);
    }

    logger.info(
      `Added ${newDocuments.length} new documents (skipped ${
        documents.length - newDocuments.length
      } duplicates) to company ${companyId} memory store`
    );
    return { success: true, addedCount: newDocuments.length };
  }

  // Query the collection
  async queryCollection(companyId, queryEmbedding, options = {}) {
    const collection = this.getCollection(companyId);
    const limit = options.limit || 5;

    // For development, just return the most recent documents
    const results = {
      documents: [collection.documents.slice(-limit)],
      metadatas: [collection.metadatas.slice(-limit)],
      distances: [
        [...Array(Math.min(limit, collection.documents.length))].map(() => 0.1),
      ],
      ids: [collection.ids.slice(-limit)],
    };

    logger.info(
      `Queried memory store for company ${companyId}, returning ${results.documents[0].length} results`
    );
    return results;
  }

  // Delete a collection
  async deleteCollection(companyId) {
    const collectionName = `company_${companyId}`;
    this.collections.delete(collectionName);
    logger.info(`Deleted memory collection for company ${companyId}`);
    return { success: true };
  }
}

// Create singleton instance
const memoryVectorStore = new MemoryVectorStore();

module.exports = {
  MemoryVectorStore,
  memoryVectorStore,
};
