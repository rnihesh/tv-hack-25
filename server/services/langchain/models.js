const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { Ollama } = require("@langchain/community/llms/ollama");
const config = require("../../config/env-config");
const { logger, aiLogger } = require("../../utils/logger");

// Model configurations
const MODEL_CONFIGS = {
  "gemini-pro": {
    provider: "google",
    model: "gemini-pro",
    temperature: 0.7,
    maxTokens: 4096,
    costPer1kTokens: 0.0005, // Approximate cost
    supportsFunctions: true,
    supportsVision: false,
  },
  "gemini-pro-vision": {
    provider: "google",
    model: "gemini-pro-vision",
    temperature: 0.7,
    maxTokens: 4096,
    costPer1kTokens: 0.0005,
    supportsFunctions: false,
    supportsVision: true,
  },
  "ollama-llama3": {
    provider: "ollama",
    model: "llama3",
    temperature: 0.7,
    maxTokens: 4096,
    costPer1kTokens: 0, // Local model, no cost
    supportsFunctions: false,
    supportsVision: false,
  },
  "ollama-mistral": {
    provider: "ollama",
    model: "mistral",
    temperature: 0.7,
    maxTokens: 4096,
    costPer1kTokens: 0,
    supportsFunctions: false,
    supportsVision: false,
  },
  "ollama-codellama": {
    provider: "ollama",
    model: "codellama",
    temperature: 0.3,
    maxTokens: 4096,
    costPer1kTokens: 0,
    supportsFunctions: false,
    supportsVision: false,
  },
};

class ModelManager {
  constructor() {
    this.models = new Map();
    this.initializeModels();
  }

  initializeModels() {
    try {
      // Initialize Google Gemini models
      if (config.geminiApiKey) {
        this.models.set(
          "gemini-pro",
          new ChatGoogleGenerativeAI({
            apiKey: config.geminiApiKey,
            modelName: "gemini-pro",
            temperature: 0.7,
            maxOutputTokens: 4096,
          })
        );

        this.models.set(
          "gemini-pro-vision",
          new ChatGoogleGenerativeAI({
            apiKey: config.geminiApiKey,
            modelName: "gemini-pro-vision",
            temperature: 0.7,
            maxOutputTokens: 4096,
          })
        );

        logger.info("Google Gemini models initialized");
      } else {
        logger.warn("Google Gemini API key not found, skipping Gemini models");
      }

      // Initialize Ollama models
      if (config.ollamaUrl) {
        this.models.set(
          "ollama-llama3",
          new Ollama({
            baseUrl: config.ollamaUrl,
            model: "llama3",
            temperature: 0.7,
          })
        );

        this.models.set(
          "ollama-mistral",
          new Ollama({
            baseUrl: config.ollamaUrl,
            model: "mistral",
            temperature: 0.7,
          })
        );

        this.models.set(
          "ollama-codellama",
          new Ollama({
            baseUrl: config.ollamaUrl,
            model: "codellama",
            temperature: 0.3,
          })
        );

        logger.info("Ollama models initialized");
      } else {
        logger.warn("Ollama URL not found, skipping Ollama models");
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
      const testPrompt =
        'Hello, please respond with "Model is working correctly"';

      const start = Date.now();
      const response = await model.invoke(testPrompt);
      const duration = Date.now() - start;

      aiLogger.request("model_test", modelName, testPrompt, { test: true });
      aiLogger.response("model_test", modelName, response.content || response, {
        duration: `${duration}ms`,
        test: true,
      });

      return {
        success: true,
        model: modelName,
        response: response.content || response,
        responseTime: duration,
      };
    } catch (error) {
      aiLogger.error("model_test", modelName, error, { test: true });
      return {
        success: false,
        model: modelName,
        error: error.message,
      };
    }
  }

  async invokeWithMetrics(modelName, prompt, options = {}) {
    const startTime = Date.now();
    const model = this.getModel(modelName);
    const config = this.getModelConfig(modelName);

    try {
      // Log the request
      aiLogger.request("model_invoke", modelName, prompt, options);

      // Prepare model options
      const modelOptions = {
        temperature: options.temperature || config.temperature,
        maxTokens: options.maxTokens || config.maxTokens,
        ...options,
      };

      // Apply options to model if supported
      if (model.temperature !== undefined) {
        model.temperature = modelOptions.temperature;
      }

      let response;
      if (typeof prompt === "string") {
        response = await model.invoke(prompt);
      } else {
        // Handle structured messages
        response = await model.invoke(prompt);
      }

      const duration = Date.now() - startTime;
      const responseText = response.content || response;

      // Calculate approximate token usage and cost
      const promptTokens = Math.ceil(prompt.length / 4); // Rough estimation
      const responseTokens = Math.ceil(responseText.length / 4);
      const totalTokens = promptTokens + responseTokens;
      const estimatedCost = (totalTokens / 1000) * config.costPer1kTokens;

      const metrics = {
        duration: `${duration}ms`,
        tokenUsage: {
          prompt: promptTokens,
          response: responseTokens,
          total: totalTokens,
        },
        cost: estimatedCost,
        model: modelName,
      };

      // Log the response
      aiLogger.response("model_invoke", modelName, responseText, metrics);

      return {
        content: responseText,
        metrics,
        rawResponse: response,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      aiLogger.error("model_invoke", modelName, error, {
        duration: `${duration}ms`,
        prompt: prompt.substring(0, 100) + "...",
      });
      throw error;
    }
  }

  async streamWithMetrics(modelName, prompt, options = {}) {
    const model = this.getModel(modelName);
    const config = this.getModelConfig(modelName);

    try {
      aiLogger.request("model_stream", modelName, prompt, options);

      // Apply options
      if (model.temperature !== undefined) {
        model.temperature = options.temperature || config.temperature;
      }

      const stream = await model.stream(prompt);
      return stream;
    } catch (error) {
      aiLogger.error("model_stream", modelName, error, {
        prompt: prompt.substring(0, 100) + "...",
      });
      throw error;
    }
  }

  getModelStats() {
    const stats = {
      totalModels: this.models.size,
      availableModels: this.getAvailableModels(),
      modelConfigs: MODEL_CONFIGS,
    };

    return stats;
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

  // Get the best model for a specific task
  getBestModelForTask(task) {
    const modelPreferences = {
      website_generation: ["gemini-pro", "ollama-llama3"],
      email_generation: ["gemini-pro", "ollama-mistral"],
      chatbot: ["gemini-pro", "ollama-llama3"],
      code_generation: ["ollama-codellama", "gemini-pro"],
      image_analysis: ["gemini-pro-vision"],
      general: ["gemini-pro", "ollama-llama3"],
    };

    const preferredModels = modelPreferences[task] || modelPreferences.general;

    // Return the first available model from the preferred list
    for (const modelName of preferredModels) {
      if (this.models.has(modelName)) {
        return modelName;
      }
    }

    // Fallback to any available model
    const availableModels = this.getAvailableModels();
    if (availableModels.length > 0) {
      return availableModels[0];
    }

    throw new Error("No models available");
  }

  // Update model configuration
  updateModelConfig(modelName, newConfig) {
    if (MODEL_CONFIGS[modelName]) {
      MODEL_CONFIGS[modelName] = { ...MODEL_CONFIGS[modelName], ...newConfig };

      // Update the actual model instance if needed
      if (this.models.has(modelName)) {
        const model = this.models.get(modelName);
        if (
          model.temperature !== undefined &&
          newConfig.temperature !== undefined
        ) {
          model.temperature = newConfig.temperature;
        }
      }

      return true;
    }
    return false;
  }
}

// Create singleton instance
const modelManager = new ModelManager();

module.exports = {
  ModelManager,
  modelManager,
  MODEL_CONFIGS,
};
