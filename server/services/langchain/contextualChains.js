const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { RunnableSequence } = require("@langchain/core/runnables");
const { modelManager } = require("./models");
const { vectorContextService } = require("./vectorContext");
const { logger, aiLogger } = require("../../utils/logger");

class ContextAwareChain {
  constructor(contextType = "general") {
    this.contextType = contextType;
    this.outputParser = new StringOutputParser();
  }

  async createContextualPrompt(
    basePrompt,
    companyId,
    userQuery,
    sessionId = null
  ) {
    try {
      // Get contextual information
      const contextText = await vectorContextService.getContextForPrompt(
        companyId,
        userQuery,
        this.contextType,
        sessionId
      );

      // Create enhanced prompt template
      const enhancedPrompt = ChatPromptTemplate.fromTemplate(`
{context}

{base_instructions}

User Query: {user_query}

Please provide a response that:
1. Takes into account the company's specific context and preferences
2. Maintains consistency with the company's brand voice and communication tone
3. References relevant business information when appropriate
4. Provides actionable and relevant advice

Response:`);

      return enhancedPrompt.format({
        context: contextText,
        base_instructions: basePrompt,
        user_query: userQuery,
      });
    } catch (error) {
      logger.error("Error creating contextual prompt:", error);
      // Fallback to base prompt
      return ChatPromptTemplate.fromTemplate(basePrompt).format({
        user_query: userQuery,
      });
    }
  }

  async invoke(companyId, userQuery, options = {}) {
    try {
      const {
        basePrompt = "You are a helpful AI assistant for small businesses.",
        sessionId = null,
        modelName = null,
        saveContext = true,
        ...modelOptions
      } = options;

      // Get the best model for this task
      const selectedModel =
        modelName || modelManager.getBestModelForTask(this.contextType);

      // Create contextual prompt
      const contextualPrompt = await this.createContextualPrompt(
        basePrompt,
        companyId,
        userQuery,
        sessionId
      );

      // Invoke the model
      const response = await modelManager.invokeWithMetrics(
        selectedModel,
        contextualPrompt,
        modelOptions
      );

      // Update context with this interaction
      if (saveContext && sessionId) {
        await vectorContextService.updateContextFromInteraction(
          companyId,
          this.contextType,
          sessionId,
          userQuery,
          response.content,
          {
            model: selectedModel,
            tokenCount: response.metrics.tokenUsage.total,
            processingTime: response.metrics.duration,
          }
        );
      }

      return {
        content: response.content,
        metrics: response.metrics,
        contextUsed: contextualPrompt.length > basePrompt.length,
      };
    } catch (error) {
      aiLogger.error("contextual_chain", selectedModel || "unknown", error, {
        companyId,
        contextType: this.contextType,
      });
      throw error;
    }
  }

  async stream(companyId, userQuery, options = {}) {
    try {
      const {
        basePrompt = "You are a helpful AI assistant for small businesses.",
        sessionId = null,
        modelName = null,
        ...modelOptions
      } = options;

      const selectedModel =
        modelName || modelManager.getBestModelForTask(this.contextType);

      const contextualPrompt = await this.createContextualPrompt(
        basePrompt,
        companyId,
        userQuery,
        sessionId
      );

      return await modelManager.streamWithMetrics(
        selectedModel,
        contextualPrompt,
        modelOptions
      );
    } catch (error) {
      aiLogger.error("contextual_stream", selectedModel || "unknown", error, {
        companyId,
        contextType: this.contextType,
      });
      throw error;
    }
  }
}

// Specialized chains for different business functions
class WebsiteGenerationChain extends ContextAwareChain {
  constructor() {
    super("website_generation");
  }

  async generateWebsite(companyId, prompt, options = {}) {
    const basePrompt = `
You are an expert web designer and content creator specializing in small business websites.

Create a comprehensive website structure based on the user's requirements and the company's specific context.

The website should:
- Reflect the company's brand voice and communication style
- Address the target audience appropriately  
- Include relevant business information and services
- Follow modern web design best practices
- Be optimized for the company's business type

Provide the response in a structured JSON format with sections for header, hero, about, services, testimonials, contact, and footer.`;

    return await this.invoke(companyId, prompt, {
      basePrompt,
      ...options,
    });
  }
}

class EmailMarketingChain extends ContextAwareChain {
  constructor() {
    super("email_generation");
  }

  async generateEmail(companyId, prompt, emailType, options = {}) {
    const basePrompt = `
You are an expert email marketing specialist focused on small business communications.

Create a compelling ${emailType} email that:
- Matches the company's communication tone and brand voice
- Addresses the target audience appropriately
- Includes relevant business information and context
- Follows email marketing best practices
- Has a clear call-to-action

Consider the company's products/services, customer base, and business goals when crafting the email.

Provide the response with a clear subject line and email body.`;

    return await this.invoke(companyId, prompt, {
      basePrompt,
      ...options,
    });
  }
}

class ChatbotChain extends ContextAwareChain {
  constructor() {
    super("chatbot");
  }

  async processMessage(companyId, userMessage, sessionId, options = {}) {
    const basePrompt = `
You are a helpful customer service chatbot for this company.

Your responses should:
- Be helpful, friendly, and professional
- Match the company's communication style
- Provide accurate information about the company's products/services
- Handle common customer queries effectively
- Escalate complex issues when appropriate
- Maintain context from previous conversation

Always stay in character as a representative of this specific company.`;

    return await this.invoke(companyId, userMessage, {
      basePrompt,
      sessionId,
      ...options,
    });
  }
}

class ImageGenerationChain extends ContextAwareChain {
  constructor() {
    super("image_generation");
  }

  async generateImagePrompt(companyId, userPrompt, options = {}) {
    const basePrompt = `
You are an expert at creating detailed image generation prompts for small business marketing materials.

Based on the user's request and the company's brand style, create a detailed image generation prompt that:
- Reflects the company's brand colors and style preferences
- Is appropriate for the business type and target audience
- Includes specific visual elements that align with the company's identity
- Follows best practices for AI image generation prompts

Provide a detailed, specific prompt that can be used with image generation AI models.`;

    return await this.invoke(companyId, userPrompt, {
      basePrompt,
      ...options,
    });
  }
}

// Factory function to create appropriate chain
function createChain(contextType) {
  switch (contextType) {
    case "website_generation":
      return new WebsiteGenerationChain();
    case "email_generation":
      return new EmailMarketingChain();
    case "chatbot":
      return new ChatbotChain();
    case "image_generation":
      return new ImageGenerationChain();
    default:
      return new ContextAwareChain(contextType);
  }
}

// Helper function to initialize company context
async function initializeCompanyContext(companyId, companyData) {
  try {
    await vectorContextService.seedCompanyContext(companyId, {
      businessDescription: companyData.businessDescription,
      targetAudience: companyData.targetAudience,
      productServices: companyData.aiContextProfile?.productServices || [],
      keyMessages: companyData.aiContextProfile?.keyMessages || [],
      businessPersonality: companyData.aiContextProfile?.businessPersonality,
      brandVoice: companyData.aiContextProfile?.brandVoice,
    });

    logger.info(`Initialized context for company ${companyId}`);
    return true;
  } catch (error) {
    logger.error(
      `Failed to initialize context for company ${companyId}:`,
      error
    );
    return false;
  }
}

module.exports = {
  ContextAwareChain,
  WebsiteGenerationChain,
  EmailMarketingChain,
  ChatbotChain,
  ImageGenerationChain,
  createChain,
  initializeCompanyContext,
};
