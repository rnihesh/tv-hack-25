const { GoogleGenerativeAI } = require("@google/generative-ai");
const { OllamaLLMs } = require("@langchain/community/llms/ollama");
const { ChatOllama } = require("@langchain/community/chat_models/ollama");
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const config = require("../../config/env-config");
const { logger } = require("../../utils/logger");

class FeedbackLLMService {
  constructor() {
    this.primaryModel = null;
    this.fallbackModel = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      let primaryInitialized = false;

      // Try Ollama first if available
      if (config.ollamaUrl) {
        try {
          const fetch = require("node-fetch");
          const response = await fetch(`${config.ollamaUrl}/api/tags`, {
            method: "GET",
            timeout: 3000,
          });

          if (response.ok) {
            this.primaryModel = new ChatOllama({
              baseUrl: config.ollamaUrl,
              model: "llama3", // Good for analysis tasks
              temperature: 0.3, // Lower temperature for consistent analysis
            });

            // Test the model
            await this.primaryModel.invoke("Test message");

            logger.info("Feedback LLM service initialized with Ollama");
            primaryInitialized = true;
          }
        } catch (ollamaError) {
          logger.warn(`Ollama not available: ${ollamaError.message}`);
        }
      }

      // Fallback to Google Gemini
      if (!primaryInitialized && config.geminiApiKey) {
        try {
          this.primaryModel = new ChatGoogleGenerativeAI({
            apiKey: config.geminiApiKey,
            model: "gemini-2.5-flash",
            temperature: 0.3,
            maxOutputTokens: 2048,
          });

          // Test the model
          await this.primaryModel.invoke("Test message");

          logger.info("Feedback LLM service initialized with Google Gemini");
          primaryInitialized = true;
        } catch (geminiError) {
          logger.error(`Google Gemini failed: ${geminiError.message}`);
        }
      }

      if (!primaryInitialized) {
        throw new Error("No LLM service available for feedback analysis");
      }

      this.initialized = true;
      return true;
    } catch (error) {
      logger.error("Failed to initialize feedback LLM service:", error);
      throw error;
    }
  }

  async generateResponse(messages, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Handle both string and array inputs
      let input;
      if (typeof messages === "string") {
        input = messages;
      } else if (Array.isArray(messages) && messages.length > 0) {
        // Extract content from message array format
        input = messages.map((msg) => msg.content || msg).join("\n");
      } else {
        throw new Error("Invalid message format");
      }

      const response = await this.primaryModel.invoke(input);
      return response.content || response;
    } catch (error) {
      logger.error("Error generating LLM response:", error);
      throw error;
    }
  }

  async analyzeText(text, analysisType = "sentiment") {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      let prompt = "";

      switch (analysisType) {
        case "sentiment":
          prompt = `Analyze the sentiment of the following text. Respond with only a JSON object containing:
{
  "sentiment": "positive|negative|neutral",
  "confidence": number between 0-1,
  "reasoning": "brief explanation"
}

Text: "${text}"`;
          break;

        case "emotion":
          prompt = `Analyze the emotions in the following text. Respond with only a JSON object containing:
{
  "primary_emotion": "joy|sadness|anger|fear|surprise|disgust|neutral",
  "emotions": ["array", "of", "detected", "emotions"],
  "intensity": number between 0-1,
  "reasoning": "brief explanation"
}

Text: "${text}"`;
          break;

        case "themes":
          prompt = `Extract the main themes and topics from the following text. Respond with only a JSON object containing:
{
  "themes": ["array", "of", "main", "themes"],
  "topics": ["specific", "topics", "mentioned"],
  "categories": ["business_categories"],
  "key_phrases": ["important", "phrases"]
}

Text: "${text}"`;
          break;

        default:
          throw new Error(`Unknown analysis type: ${analysisType}`);
      }

      const response = await this.generateResponse(prompt);

      // Try to parse JSON response
      try {
        // Clean up the response to extract JSON
        let cleanResponse = response.trim();

        // Look for JSON within the response
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanResponse = jsonMatch[0];
        }

        return JSON.parse(cleanResponse);
      } catch (parseError) {
        logger.warn("Failed to parse LLM JSON response, returning raw text");
        return { raw_response: response };
      }
    } catch (error) {
      logger.error(`Error in ${analysisType} analysis:`, error);
      throw error;
    }
  }
}

// Create singleton instance
const feedbackLLMService = new FeedbackLLMService();

module.exports = {
  FeedbackLLMService,
  feedbackLLMService,
};
