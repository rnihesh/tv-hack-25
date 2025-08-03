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
5. Avoids generic responses, no matter how common the query is, and tailors answers to the specific business context.

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
        throw new Error(
          "No AI models are currently available. Please check your model configuration."
        );
      }

      // Get the best working model for this task (with health checking)
      if (modelName) {
        selectedModel = modelName;
      } else {
        try {
          // Use the enhanced method that tests model health
          selectedModel = await modelManager.getBestWorkingModelForTask(
            this.contextType
          );
        } catch (error) {
          // Fallback to the basic selection if health checking fails
          selectedModel = modelManager.getBestModelForTask(this.contextType);
        }
      }

      // Create contextual prompt
      const contextualPrompt = await this.createContextualPrompt(
        basePrompt,
        companyId,
        userQuery,
        sessionId
      );

      // Invoke the model with automatic fallback
      const response = await modelManager.invokeWithMetrics(
        selectedModel,
        contextualPrompt,
        modelOptions
      );

      // Log if fallback was used
      if (response.fallbackUsed) {
        logger.info(
          `Fallback used: ${response.originalModelRequested} -> ${response.modelUsed}`
        );
      }
      if (response.emergencyFallbackUsed) {
        logger.warn(
          `Emergency fallback used: ${response.originalModelRequested} -> ${response.modelUsed}`
        );
      }

      // Update context with this interaction
      if (saveContext && sessionId) {
        await vectorContextService.updateContextFromInteraction(
          companyId,
          this.contextType,
          sessionId,
          userQuery,
          response.content,
          {
            model: response.modelUsed,
            originalModel: response.originalModelRequested,
            fallbackUsed: response.fallbackUsed || false,
            tokenCount: response.metrics.tokenUsage.total,
            processingTime: response.metrics.duration,
          }
        );
      }

      return {
        content: response.content,
        metrics: response.metrics,
        contextUsed: contextualPrompt.length > basePrompt.length,
        modelUsed: response.modelUsed,
        fallbackUsed: response.fallbackUsed || false,
        emergencyFallbackUsed: response.emergencyFallbackUsed || false,
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

    // Create a unique session ID for this website generation
    const sessionId = `website_gen_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 15)}`;

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

    // Generate website without storing intermediate context
    const result = await this.invoke(companyId, websitePrompt, {
      basePrompt,
      sessionId, // Pass the session ID to enable context saving
      saveContext: false, // Disable automatic context saving to reduce noise
      ...invokeOptions,
    });

    // Clean up the HTML content by removing any markdown formatting
    let htmlContent = result.content;
    htmlContent = htmlContent.replace(/```html\s*|```/g, "").trim();

    // If the content doesn't start with <!DOCTYPE or <html>, it might be wrapped incorrectly
    if (
      !htmlContent.toLowerCase().startsWith("<!doctype") &&
      !htmlContent.toLowerCase().startsWith("<html")
    ) {
      // Try to extract HTML from the response
      const htmlMatch = htmlContent.match(/<!DOCTYPE[\s\S]*<\/html>/i);
      if (htmlMatch) {
        htmlContent = htmlMatch[0];
      }
    }

    // Store only successful results for future reference (not every generation)
    if (htmlContent.length > 1000) {
      // Only store substantial content
      try {
        const generationSummary = `Successfully generated a ${templateType} website with ${style} style and ${colorScheme} color scheme. Website includes sections: ${sections.join(
          ", "
        )}.`;

        await vectorContextService.addDocumentToContext(
          companyId,
          generationSummary,
          {
            source: "website_generation_success",
            templateType,
            style,
            colorScheme,
            sections: sections.join(", "),
            modelUsed: result.modelUsed,
            timestamp: new Date().toISOString(),
            importance: 6, // Lower importance to reduce clutter
            sessionId,
          }
        );

        logger.info(
          `Stored successful website generation summary for company ${companyId}`
        );
      } catch (contextError) {
        logger.warn(
          `Failed to store generation result in context: ${contextError.message}`
        );
      }
    }

    return {
      content: htmlContent,
      modelUsed: result.modelUsed || "ollama-llama3",
      metrics: result.metrics || { tokenUsage: { total: 0 }, duration: 0 },
      contextUsed: result.contextUsed || false,
      contextInsights: "Website generated with company context",
      sessionId, // Return session ID for tracking
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

IMPORTANT: Return ONLY a valid JSON object with this exact structure:
{
  "subject": "Email subject line",
  "body": "Email body content with proper line breaks using \\n for new lines",
  "tone": "actual tone used",
  "callToAction": "the call to action used"
}

Make sure the JSON is valid and properly formatted. Use \\n for line breaks in the body text. Do not include any markdown formatting, code blocks, or explanations. Just the raw JSON object.`;

    const result = await this.invoke(this.companyId, prompt, {
      basePrompt,
      ...invokeOptions,
    });

    // Try to parse JSON response, fallback to structured object
    let emailContent;
    try {
      // Clean the response content before parsing
      let cleanContent = result.content.trim();

      // Remove markdown code blocks if present
      const codeBlockMatch = cleanContent.match(
        /```(?:json)?\s*([\s\S]*?)\s*```/
      );
      if (codeBlockMatch) {
        cleanContent = codeBlockMatch[1].trim();
      }

      // Try to parse as JSON
      emailContent = JSON.parse(cleanContent);

      // Validate required fields
      if (!emailContent.subject || !emailContent.body) {
        throw new Error("Missing required fields in JSON response");
      }
    } catch (e) {
      console.warn(
        "Failed to parse AI response as JSON, trying alternative parsing:",
        e.message
      );

      // Try to extract subject and body from the malformed JSON-like text
      try {
        const subjectMatch =
          result.content.match(/"subject":\s*"([^"]*)"/) ||
          result.content.match(/'subject':\s*'([^']*)'/) ||
          result.content.match(/subject:\s*"([^"]*)"/) ||
          result.content.match(/subject:\s*'([^']*)'/) ||
          result.content.match(/subject:\s*([^\n,}]*)/);

        const bodyMatch =
          result.content.match(/"body":\s*"([\s\S]*?)"(?:\s*,|\s*})/) ||
          result.content.match(/'body':\s*'([\s\S]*?)'(?:\s*,|\s*})/) ||
          result.content.match(/body:\s*"([\s\S]*?)"(?:\s*,|\s*})/) ||
          result.content.match(/body:\s*'([\s\S]*?)'(?:\s*,|\s*})/);

        if (subjectMatch && bodyMatch) {
          emailContent = {
            subject: subjectMatch[1].trim(),
            body: bodyMatch[1].replace(/\\n/g, "\n").trim(),
            tone: tone,
            callToAction: callToAction,
          };
          console.log("Successfully extracted content using regex parsing");
        } else {
          throw new Error("Could not extract subject and body from response");
        }
      } catch (regexError) {
        console.warn(
          "Regex parsing also failed, using complete fallback:",
          regexError.message
        );
        // Complete fallback if both parsing methods fail
        emailContent = {
          subject: `${
            emailType.charAt(0).toUpperCase() + emailType.slice(1)
          } - ${campaignGoal}`,
          body: result.content,
          tone: tone,
          callToAction: callToAction,
        };
      }
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
          purpose:
            i === 1
              ? "Introduction"
              : i === sequenceLength
              ? "Conversion"
              : "Nurturing",
        });
      }
      campaignData = {
        emailSequence: emails,
        campaignStrategy: `${campaignType} campaign for ${targetAudience}`,
      };
    }

    return {
      emailSequence: campaignData.emailSequence || [],
      campaignStrategy:
        campaignData.campaignStrategy || "Email campaign strategy",
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
