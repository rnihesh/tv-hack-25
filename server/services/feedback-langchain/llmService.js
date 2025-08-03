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

            // Skip test call to save API credits
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

          // Skip test call to save API credits
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
      let systemPrompt = "";
      let userPrompt = "";

      switch (analysisType) {
        case "sentiment":
          systemPrompt = `You are an expert sentiment analyst specializing in customer feedback analysis. Your task is to analyze text and provide accurate sentiment classification with confidence scores and detailed reasoning.

Guidelines:
- Positive: Text expressing satisfaction, happiness, praise, or positive experiences
- Negative: Text expressing dissatisfaction, complaints, criticism, or negative experiences  
- Neutral: Text that is factual, informational, or lacks clear emotional sentiment
- Consider context, sarcasm, and nuanced expressions
- Provide confidence scores based on clarity of sentiment indicators
- Give specific reasoning citing key words/phrases that influenced your decision

Always respond with valid MD only.`;

          userPrompt = `Analyze the sentiment of this customer feedback:

"${text}"

Respond with JSON in this exact format:
{
  "sentiment": "positive|negative|neutral",
  "confidence": 0.85,
  "reasoning": "Detailed explanation of why this sentiment was chosen, citing specific words or phrases",
  "key_indicators": ["specific", "words", "that", "influenced", "decision"],
  "intensity": 0.7
}`;
          break;

        case "emotion":
          systemPrompt = `You are an expert emotion analyst specializing in customer feedback. Analyze emotional content in text using Plutchik's wheel of emotions model.

Primary emotions to detect:
- Joy (happiness, satisfaction, delight)
- Sadness (disappointment, sorrow, regret)
- Anger (frustration, irritation, rage)
- Fear (anxiety, worry, concern)
- Surprise (amazement, shock, wonder)
- Disgust (revulsion, dislike, aversion)
- Trust (confidence, acceptance, approval)
- Anticipation (expectation, hope, interest)

Provide intensity scores and detailed reasoning for emotional detection.`;

          userPrompt = `Analyze the emotions in this customer feedback:

"${text}"

Respond with JSON in this exact format:
{
  "primary_emotion": "joy|sadness|anger|fear|surprise|disgust|trust|anticipation|neutral",
  "emotions": [
    {"emotion": "joy", "intensity": 0.8},
    {"emotion": "trust", "intensity": 0.6}
  ],
  "overall_intensity": 0.7,
  "reasoning": "Detailed explanation of detected emotions and their intensities",
  "emotional_words": ["specific", "words", "that", "convey", "emotion"]
}`;
          break;

        case "themes":
          systemPrompt = `You are an expert business analyst specializing in customer feedback theme extraction. Identify meaningful business themes, topics, and categorize feedback into actionable business areas.

Business categories to consider:
- Product Quality
- Customer Service  
- Pricing
- User Experience
- Delivery/Shipping
- Staff/Personnel
- Facilities
- Technology/Website
- Communication
- Value for Money

Extract specific themes and topics that businesses can act upon.`;

          userPrompt = `Extract themes and topics from this customer feedback:

"${text}"

Respond with JSON in this exact format:
{
  "themes": ["main business themes mentioned"],
  "topics": ["specific topics or features discussed"],
  "categories": ["business_categories", "from", "the", "list", "above"],
  "key_phrases": ["important phrases that represent themes"],
  "business_impact": "brief assessment of potential business impact",
  "actionable_items": ["specific actions business could take"]
}`;
          break;

        default:
          throw new Error(`Unknown analysis type: ${analysisType}`);
      }

      // Combine system and user prompts
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

      const response = await this.generateResponse(fullPrompt);

      // Enhanced JSON parsing with better error handling
      try {
        // Clean up the response to extract JSON
        let cleanResponse = response.trim();

        // Remove markdown code blocks if present
        cleanResponse = cleanResponse
          .replace(/```json\s*/g, "")
          .replace(/```\s*/g, "");

        // Look for JSON within the response
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanResponse = jsonMatch[0];
        }

        const parsedResponse = JSON.parse(cleanResponse);

        // Validate required fields based on analysis type
        if (analysisType === "sentiment" && !parsedResponse.sentiment) {
          throw new Error("Missing required sentiment field");
        }
        if (analysisType === "emotion" && !parsedResponse.primary_emotion) {
          throw new Error("Missing required primary_emotion field");
        }
        if (analysisType === "themes" && !parsedResponse.themes) {
          throw new Error("Missing required themes field");
        }

        return parsedResponse;
      } catch (parseError) {
        logger.warn(
          `Failed to parse LLM JSON response for ${analysisType}: ${parseError.message}`
        );

        // Return fallback structure based on analysis type
        switch (analysisType) {
          case "sentiment":
            return {
              sentiment: "neutral",
              confidence: 0.5,
              reasoning: "Unable to analyze sentiment automatically",
              raw_response: response,
            };
          case "emotion":
            return {
              primary_emotion: "neutral",
              emotions: [],
              intensity: 0.5,
              reasoning: "Unable to analyze emotions automatically",
              raw_response: response,
            };
          case "themes":
            return {
              themes: [],
              topics: [],
              categories: ["general"],
              key_phrases: [],
              raw_response: response,
            };
          default:
            return { raw_response: response };
        }
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
