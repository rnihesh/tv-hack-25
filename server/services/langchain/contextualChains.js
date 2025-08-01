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
    let selectedModel = "unknown";
    try {
      const {
        basePrompt = "You are a helpful AI assistant for small businesses.",
        sessionId = null,
        modelName = null,
        saveContext = true,
        ...modelOptions
      } = options;

      // Check if models are available
      const availableModels = modelManager.getAvailableModels();
      if (availableModels.length === 0) {
        throw new Error("No AI models are currently available. Please check your model configuration.");
      }

      // Get the best model for this task
      selectedModel =
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
        modelUsed: selectedModel,
      };
    } catch (error) {
      aiLogger.error("contextual_chain", selectedModel, error, {
        companyId,
        contextType: this.contextType,
      });
      throw error;
    }
  }

  async stream(companyId, userQuery, options = {}) {
    let selectedModel = "unknown";
    try {
      const {
        basePrompt = "You are a helpful AI assistant for small businesses.",
        sessionId = null,
        modelName = null,
        ...modelOptions
      } = options;

      selectedModel =
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
      aiLogger.error("contextual_stream", selectedModel, error, {
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
    const {
      templateType = "business",
      style = "modern",
      colorScheme = "blue",
      sections = ["hero", "about", "services", "contact"],
      ...invokeOptions
    } = options;

    const websitePrompt = `Generate a complete, professional website based on the following requirements:

User Requirements: ${prompt}

Template Type: ${templateType}
Style: ${style}
Color Scheme: ${colorScheme}
Required Sections: ${sections.join(", ")}

IMPORTANT: Return ONLY the complete HTML document with embedded CSS and JavaScript. No explanations, no markdown formatting, no code blocks. Just the raw HTML that can be directly saved as an .html file.

The website should include:
1. Modern, responsive design with CSS Grid/Flexbox
2. Navigation header with company name and menu
3. Hero section with compelling headline and call-to-action
4. About section highlighting the business
5. Services/Products section showcasing offerings
6. Contact section with form
7. Footer with contact information
8. Embedded CSS for styling (${colorScheme} color scheme, ${style} style)
9. Basic JavaScript for interactivity (smooth scrolling, form handling, mobile menu)
10. Mobile-responsive design
11. Semantic HTML5 and good accessibility

Use the company's actual business information, target audience, and brand preferences from the context.`;

    const basePrompt = `
You are an expert web designer and developer specializing in small business websites.

Create a complete, professional HTML website that:
- Reflects the company's brand voice and communication style
- Addresses the target audience appropriately
- Includes relevant business information and services
- Follows modern web design best practices
- Is optimized for the company's business type
- Is mobile-responsive and accessible

Generate clean, semantic HTML5 with embedded CSS and JavaScript. Make it production-ready.`;

    const result = await this.invoke(companyId, websitePrompt, {
      basePrompt,
      ...invokeOptions,
    });

    // Clean up the HTML content by removing any markdown formatting
    let htmlContent = result.content;
    htmlContent = htmlContent.replace(/```html\s*|```/g, '').trim();
    
    // If the content doesn't start with <!DOCTYPE or <html>, it might be wrapped incorrectly
    if (!htmlContent.toLowerCase().startsWith('<!doctype') && !htmlContent.toLowerCase().startsWith('<html')) {
      // Try to extract HTML from the response
      const htmlMatch = htmlContent.match(/<!DOCTYPE[\s\S]*<\/html>/i);
      if (htmlMatch) {
        htmlContent = htmlMatch[0];
      }
    }

    return {
      content: htmlContent,
      modelUsed: result.modelUsed || "ollama-llama3",
      metrics: result.metrics || { tokenUsage: { total: 0 }, duration: 0 },
      contextUsed: result.contextUsed || false,
      contextInsights: "Website generated with company context",
    };
  }
}

class EmailMarketingChain extends ContextAwareChain {
  constructor(companyId) {
    super("email_generation");
    this.companyId = companyId;
  }

  async generateEmail(options = {}) {
    const {
      emailType = "promotional",
      targetAudience = "",
      campaignGoal = "",
      productService = "",
      tone = "professional",
      callToAction = "",
      ...invokeOptions
    } = options;

    const prompt = `Generate a ${emailType} email for ${targetAudience} with the goal of ${campaignGoal}. 
    
    Product/Service: ${productService}
    Tone: ${tone}
    Call to Action: ${callToAction}`;

    const basePrompt = `
You are an expert email marketing specialist focused on small business communications.

Create a compelling ${emailType} email that:
- Matches the company's communication tone and brand voice
- Addresses the target audience appropriately
- Includes relevant business information and context
- Follows email marketing best practices
- Has a clear call-to-action

Consider the company's products/services, customer base, and business goals when crafting the email.

Provide the response in JSON format with the following structure:
{
  "subject": "Email subject line",
  "body": "Email body content",
  "tone": "actual tone used",
  "callToAction": "the call to action used"
}`;

    const result = await this.invoke(this.companyId, prompt, {
      basePrompt,
      ...invokeOptions,
    });

    // Try to parse JSON response, fallback to structured object
    let emailContent;
    try {
      emailContent = JSON.parse(result.content);
    } catch (e) {
      // Fallback if not valid JSON
      emailContent = {
        subject: `${emailType} - ${campaignGoal}`,
        body: result.content,
        tone: tone,
        callToAction: callToAction,
      };
    }

    return {
      emailContent,
      modelUsed: result.modelUsed || "gemini-2.5-flash",
      metrics: result.metrics || { tokenUsage: { total: 0 }, duration: 0 },
      contextUsed: result.contextUsed || false,
      contextInsights: "Email generated with company context",
    };
  }

  async generateEmailCampaign(options = {}) {
    const {
      campaignType = "promotional",
      sequenceLength = 3,
      targetAudience = "",
      campaignGoal = "",
      productService = "",
      tone = "professional",
      ...invokeOptions
    } = options;

    const prompt = `Generate a ${campaignType} email campaign sequence with ${sequenceLength} emails for ${targetAudience} with the goal of ${campaignGoal}.
    
    Product/Service: ${productService}
    Tone: ${tone}`;

    const basePrompt = `
You are an expert email marketing specialist focused on small business communications.

Create a comprehensive ${campaignType} email campaign sequence with ${sequenceLength} emails that:
- Matches the company's communication tone and brand voice
- Addresses the target audience appropriately
- Includes relevant business information and context
- Follows email marketing best practices
- Has clear progression and call-to-actions

Consider the company's products/services, customer base, and business goals when crafting the campaign.

Provide the response in JSON format with the following structure:
{
  "emailSequence": [
    {
      "subject": "Email 1 subject",
      "body": "Email 1 body content",
      "position": 1,
      "purpose": "Introduction/awareness"
    },
    // ... more emails
  ],
  "campaignStrategy": "Overall strategy description"
}`;

    const result = await this.invoke(this.companyId, prompt, {
      basePrompt,
      ...invokeOptions,
    });

    // Try to parse JSON response, fallback to structured object
    let campaignData;
    try {
      campaignData = JSON.parse(result.content);
    } catch (e) {
      // Fallback if not valid JSON
      const emails = [];
      for (let i = 1; i <= sequenceLength; i++) {
        emails.push({
          subject: `${campaignType} Campaign - Email ${i}`,
          body: `Email ${i} content: ${result.content.substring(0, 200)}...`,
          position: i,
          purpose: i === 1 ? "Introduction" : i === sequenceLength ? "Conversion" : "Nurturing",
        });
      }
      campaignData = {
        emailSequence: emails,
        campaignStrategy: `${campaignType} campaign for ${targetAudience}`,
      };
    }

    return {
      emailSequence: campaignData.emailSequence || [],
      campaignStrategy: campaignData.campaignStrategy || "Email campaign strategy",
      modelUsed: result.modelUsed || "gemini-2.5-flash",
      metrics: result.metrics || { tokenUsage: { total: 0 }, duration: 0 },
      contextUsed: result.contextUsed || false,
      contextInsights: "Email campaign generated with company context",
    };
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
