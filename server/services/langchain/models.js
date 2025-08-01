try {
  const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
  const { Ollama } = require("@langchain/community/llms/ollama");
  const config = require("../../config/env-config");
  const { logger } = require("../../utils/logger");

  // Simplified model configurations - just two basic models
  const MODEL_CONFIGS = {
    "gemini-2.5-flash": {
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
          try {
            this.models.set(
              "gemini-2.5-flash",
              new ChatGoogleGenerativeAI({
                apiKey: config.geminiApiKey,
                modelName: "gemini-2.5-flash",
              })
            );
            logger.info("Google Gemini model initialized");
          } catch (error) {
            logger.error("Failed to initialize Gemini model:", error.message);
          }
        } else {
          logger.warn("Google Gemini API key not found, skipping Gemini model");
        }

        // Initialize Ollama llama3 model with connectivity check
        if (config.ollamaUrl) {
          try {
            this.models.set(
              "ollama-llama3",
              new Ollama({
                baseUrl: config.ollamaUrl,
                model: "llama3",
              })
            );
            logger.info("Ollama llama3 model initialized (connectivity will be tested on first use)");
          } catch (error) {
            logger.error("Failed to initialize Ollama model:", error.message);
          }
        } else {
          logger.warn("Ollama URL not found, skipping Ollama model");
        }

        // Log final status
        const initializedCount = this.models.size;
        if (initializedCount === 0) {
          logger.error("No AI models could be initialized! Check your API keys and service configurations.");
        } else {
          logger.info(`Successfully initialized ${initializedCount} AI models: ${this.getAvailableModels().join(', ')}`);
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
      let model;
      let actualModelUsed = modelName;
      
      try {
        model = this.getModel(modelName);
      } catch (error) {
        logger.warn(`Model ${modelName} not available, attempting fallback`);
        // Try to find a working fallback model
        const availableModels = this.getAvailableModels();
        if (availableModels.length > 0) {
          actualModelUsed = availableModels[0];
          model = this.getModel(actualModelUsed);
          logger.info(`Using fallback model: ${actualModelUsed}`);
        } else {
          throw new Error("No models available for fallback");
        }
      }
      
      const startTime = Date.now();
      
      try {
        const response = await model.invoke(prompt);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Estimate token usage (rough estimation) with error handling
        const responseContent = response.content || response || "";
        const promptLength = typeof prompt === 'string' ? prompt.length : 0;
        const responseLength = typeof responseContent === 'string' ? responseContent.length : 0;
        
        const tokenCount = Math.ceil((promptLength + responseLength) / 4);
        const promptTokens = Math.ceil(promptLength / 4);
        const completionTokens = Math.ceil(responseLength / 4);
        
        return {
          content: responseContent,
          rawResponse: response,
          modelUsed: actualModelUsed,
          originalModelRequested: modelName,
          fallbackUsed: actualModelUsed !== modelName,
          metrics: {
            duration: duration,
            tokenUsage: {
              total: isNaN(tokenCount) ? 0 : tokenCount,
              prompt: isNaN(promptTokens) ? 0 : promptTokens,
              completion: isNaN(completionTokens) ? 0 : completionTokens
            }
          }
        };
      } catch (error) {
        // If the model fails, try one more fallback
        if (actualModelUsed === modelName) {
          logger.warn(`Model ${modelName} failed, attempting emergency fallback`);
          const availableModels = this.getAvailableModels().filter(m => m !== modelName);
          
          if (availableModels.length > 0) {
            const fallbackModel = availableModels[0];
            logger.info(`Trying emergency fallback model: ${fallbackModel}`);
            
            try {
              const fallbackResponse = await this.invokeWithMetrics(fallbackModel, prompt, options);
              fallbackResponse.emergencyFallbackUsed = true;
              fallbackResponse.originalModelRequested = modelName;
              return fallbackResponse;
            } catch (fallbackError) {
              logger.error(`Emergency fallback also failed: ${fallbackError.message}`);
            }
          }
        }
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

    // Get best model for specific task type with health checking
    getBestModelForTask(taskType) {
      const availableModels = this.getAvailableModels();
      
      if (availableModels.length === 0) {
        throw new Error("No models available");
      }

      // Task-specific model preferences - use Gemini 2.5 Flash for website generation
      const taskPreferences = {
        "email_generation": ["ollama-llama3", "gemini-2.5-flash"],
        "website_generation": ["gemini-2.5-flash", "ollama-llama3"],
        "chatbot": ["ollama-llama3", "gemini-2.5-flash"],
        "image_generation": ["gemini-2.5-flash", "ollama-llama3"],
        "general": ["gemini-2.5-flash", "ollama-llama3"]
      };

      const preferences = taskPreferences[taskType] || taskPreferences["general"];
      
      // Return first available and working model from preferences
      for (const modelName of preferences) {
        if (availableModels.includes(modelName)) {
          // Quick health check for Ollama models (they're more likely to fail)
          if (modelName.startsWith('ollama-')) {
            try {
              // Try to get the model instance - if Ollama is down, this will fail
              this.getModel(modelName);
              return modelName;
            } catch (error) {
              logger.warn(`Model ${modelName} failed health check, trying next option:`, error.message);
              continue;
            }
          } else {
            // For non-Ollama models (like Gemini), assume they're healthy if initialized
            return modelName;
          }
        }
      }

      // Fallback to first available model
      logger.warn(`No preferred models available for task ${taskType}, using fallback`);
      return availableModels[0];
    }

    // Enhanced method to get best working model with actual connectivity test
    async getBestWorkingModelForTask(taskType) {
      const availableModels = this.getAvailableModels();
      
      if (availableModels.length === 0) {
        throw new Error("No models available");
      }

      // Task-specific model preferences
      const taskPreferences = {
        "email_generation": ["ollama-llama3", "gemini-2.5-flash"],
        "website_generation": ["gemini-2.5-flash", "ollama-llama3"],
        "chatbot": ["ollama-llama3", "gemini-2.5-flash"],
        "image_generation": ["gemini-2.5-flash", "ollama-llama3"],
        "general": ["gemini-2.5-flash", "ollama-llama3"]
      };

      const preferences = taskPreferences[taskType] || taskPreferences["general"];
      
      // Test each preferred model in order
      for (const modelName of preferences) {
        if (availableModels.includes(modelName)) {
          try {
            const testResult = await this.testModel(modelName);
            if (testResult.success) {
              logger.info(`Selected working model for ${taskType}: ${modelName}`);
              return modelName;
            } else {
              logger.warn(`Model ${modelName} failed test for ${taskType}:`, testResult.error);
            }
          } catch (error) {
            logger.warn(`Model ${modelName} failed test for ${taskType}:`, error.message);
          }
        }
      }

      // If no preferred model works, test all available models
      for (const modelName of availableModels) {
        try {
          const testResult = await this.testModel(modelName);
          if (testResult.success) {
            logger.warn(`Using fallback model for ${taskType}: ${modelName}`);
            return modelName;
          }
        } catch (error) {
          logger.warn(`Fallback model ${modelName} also failed:`, error.message);
        }
      }

      throw new Error(`No working models available for task ${taskType}`);
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
