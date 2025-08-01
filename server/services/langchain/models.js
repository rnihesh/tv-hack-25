try {
  const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
  const { Ollama } = require("@langchain/community/llms/ollama");
  const config = require("../../config/env-config");
  const { logger } = require("../../utils/logger");

  // Simplified model configurations - just two basic models
  const MODEL_CONFIGS = {
    "gemini-pro": {
      provider: "google",
      model: "gemini-2.5-flash",
      costPer1kTokens: 0.0005,
    },
    "ollama-llama3": {
      provider: "ollama",
      model: "llama3",
      costPer1kTokens: 0,
    }
  };

  class ModelManager {
    constructor() {
      this.models = new Map();
      this.initializeModels();
    }

    initializeModels() {
      try {
        // Initialize Google Gemini model
        if (config.geminiApiKey) {
          this.models.set(
            "gemini-pro",
            new ChatGoogleGenerativeAI({
              apiKey: config.geminiApiKey,
              modelName: "gemini-pro",
            })
          );
          logger.info("Google Gemini model initialized");
        } else {
          logger.warn("Google Gemini API key not found, skipping Gemini model");
        }

        // Initialize Ollama llama3 model
        if (config.ollamaUrl) {
          this.models.set(
            "ollama-llama3",
            new Ollama({
              baseUrl: config.ollamaUrl,
              model: "llama3",
            })
          );
          logger.info("Ollama llama3 model initialized");
        } else {
          logger.warn("Ollama URL not found, skipping Ollama model");
        }
      } catch (error) {
        logger.error("Error initializing models:", error);
      }
    }

    getModel(modelName) {
      if (!this.models.has(modelName)) {
        throw new Error(`Model ${modelName} not found or not initialized`);
      }
      return this.models.get(modelName);
    }

    getModelConfig(modelName) {
      return MODEL_CONFIGS[modelName];
    }

    getAvailableModels() {
      return Array.from(this.models.keys());
    }

    async testModel(modelName) {
      try {
        const model = this.getModel(modelName);
        const testPrompt = 'Hello, please respond with "Model is working correctly"';
        
        const start = Date.now();
        const response = await model.invoke(testPrompt);
        const duration = Date.now() - start;
        
        return {
          success: true,
          model: modelName,
          response: response.content || response,
          responseTime: duration,
        };
      } catch (error) {
        return {
          success: false,
          model: modelName,
          error: error.message,
        };
      }
    }

    async invokeWithMetrics(modelName, prompt, options = {}) {
      const model = this.getModel(modelName);
      try {
        const response = await model.invoke(prompt);
        return {
          content: response.content || response,
          rawResponse: response,
        };
      } catch (error) {
        throw error;
      }
    }

    async streamWithMetrics(modelName, prompt, options = {}) {
      const model = this.getModel(modelName);
      try {
        const stream = await model.stream(prompt);
        return stream;
      } catch (error) {
        throw error;
      }
    }

    getModelStats() {
      return {
        totalModels: this.models.size,
        availableModels: this.getAvailableModels(),
      };
    }

    // Health check for all models
    async healthCheck() {
      const results = {};
      const availableModels = this.getAvailableModels();

      for (const modelName of availableModels) {
        try {
          const result = await this.testModel(modelName);
          results[modelName] = {
            status: result.success ? "healthy" : "unhealthy",
            responseTime: result.responseTime,
            error: result.error || null,
          };
        } catch (error) {
          results[modelName] = {
            status: "error",
            error: error.message,
          };
        }
      }

      return results;
    }
  }

  // Create singleton instance
  const modelManager = new ModelManager();

  module.exports = {
    ModelManager,
    modelManager,
    MODEL_CONFIGS,
  };
} catch (error) {
  console.error("CRITICAL ERROR IN LANGCHAIN INITIALIZATION:", error);
  // Continue execution but disable AI features
  module.exports = {
    initializeAIModels: () => console.warn("AI models disabled due to initialization error"),
    modelManager: {
      getAvailableModels: () => [],
      getModel: () => null,
    }
  };
}
