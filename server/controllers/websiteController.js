const { validationResult } = require("express-validator");
const Company = require("../models/Company");
const WebsiteTemplate = require("../models/Website");
const { VectorStore } = require("../models/VectorStore");
const { modelManager } = require("../services/langchain/models");
const { logger, businessLogger, aiLogger } = require("../utils/logger");

// Credit costs for different operations
const CREDIT_COSTS = {
  website_generation: 5,
  template_customization: 2,
  website_update: 3,
};

// @desc    Generate website content using AI
// @route   POST /api/website/generate
// @access  Private
const generateWebsite = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { prompt, templateType, style, colorScheme, sections } = req.body;
    const company = req.companyData; // From middleware

    // Check and deduct credits
    const requiredCredits = CREDIT_COSTS.website_generation;
    if (!company.hasCredits(requiredCredits)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient credits",
        requiredCredits,
        currentCredits: company.credits.currentCredits,
      });
    }

    // Initialize the website generation chain with context
    const websiteChain = new WebsiteGenerationChain(company._id);

    // Generate website content with contextual awareness
    const result = await websiteChain.generateWebsite({
      businessDescription: prompt,
      templateType,
      style,
      colorScheme,
      sections,
    });

    const websiteContent = result.websiteContent;
    const aiResponse = {
      content: JSON.stringify(websiteContent),
      metrics: result.metrics,
    };

    // Create website template record
    const websiteTemplate = new WebsiteTemplate({
      companyId: company._id,
      templateName: `Generated Website - ${Date.now()}`,
      industry: company.businessType,
      structure: websiteContent,
      aiGenerated: true,
      customizations: {
        style: style || company.preferences.brandStyle,
        colorScheme: colorScheme || company.preferences.colorScheme,
        communicationTone: company.preferences.communicationTone,
      },
    });

    await websiteTemplate.save();

    // Create generated content record
    const generatedContent = new GeneratedContent({
      companyId: company._id,
      contentType: "website",
      prompt,
      generatedContent: {
        websiteId: websiteTemplate._id,
        structure: websiteContent,
        metadata: {
          templateType,
          style,
          colorScheme,
          model: result.modelUsed,
          tokensUsed: result.metrics.tokenUsage.total,
        },
      },
      aiModel: result.modelUsed,
      version: 1,
      isActive: true,
    });

    await generatedContent.save();

    // Deduct credits and update usage
    await company.deductCredits(
      requiredCredits,
      "website_gen",
      "Website generation"
    );
    company.usage.websitesGenerated += 1;
    await company.save();

    // Log business activity
    businessLogger.contentGeneration(company.email, "website", true, {
      templateType,
      style,
      model: result.modelUsed,
      creditsUsed: requiredCredits,
    });

    res.status(201).json({
      success: true,
      message: "Website generated successfully",
      data: {
        websiteId: websiteTemplate._id,
        contentId: generatedContent._id,
        website: websiteContent,
        metadata: {
          templateType,
          style,
          colorScheme,
          tokensUsed: result.metrics.tokenUsage.total,
          processingTime: result.metrics.duration,
        },
        creditsUsed: requiredCredits,
        remainingCredits: company.credits.currentCredits,
      },
    });
  } catch (error) {
    businessLogger.contentGeneration(
      req.company?.email || "unknown",
      "website",
      false,
      { error: error.message }
    );

    console.error("Website generation error:", error);
    res.status(500).json({
      success: false,
      message: "Error generating website",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Get user's generated websites
// @route   GET /api/website/my-websites
// @access  Private
const getMyWebsites = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;
    const skip = (page - 1) * limit;

    const websites = await WebsiteTemplate.find({
      companyId: req.company.id,
      isPublished: { $ne: false },
    })
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("generatedContentId");

    const total = await WebsiteTemplate.countDocuments({
      companyId: req.company.id,
      isPublished: { $ne: false },
    });

    res.json({
      success: true,
      data: {
        websites,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get websites error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching websites",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Get specific website
// @route   GET /api/website/:id
// @access  Private
const getWebsite = async (req, res) => {
  try {
    const website = await WebsiteTemplate.findOne({
      _id: req.params.id,
      companyId: req.company.id,
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found",
      });
    }

    res.json({
      success: true,
      data: { website },
    });
  } catch (error) {
    console.error("Get website error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching website",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Update website
// @route   PUT /api/website/:id
// @access  Private
const updateWebsite = async (req, res) => {
  try {
    const { structure, customizations, templateName } = req.body;

    const website = await WebsiteTemplate.findOne({
      _id: req.params.id,
      companyId: req.company.id,
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found",
      });
    }

    // Update fields
    if (structure) website.structure = structure;
    if (customizations)
      website.customizations = { ...website.customizations, ...customizations };
    if (templateName) website.templateName = templateName;

    await website.save();

    res.json({
      success: true,
      message: "Website updated successfully",
      data: { website },
    });
  } catch (error) {
    console.error("Update website error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating website",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Delete website
// @route   DELETE /api/website/:id
// @access  Private
const deleteWebsite = async (req, res) => {
  try {
    const website = await WebsiteTemplate.findOne({
      _id: req.params.id,
      companyId: req.company.id,
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found",
      });
    }

    await WebsiteTemplate.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Website deleted successfully",
    });
  } catch (error) {
    console.error("Delete website error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting website",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Helper function to build AI prompt for website generation
function buildWebsitePrompt(
  company,
  userPrompt,
  templateType,
  style,
  businessContext
) {
  const prompt = `
You are an expert web designer and content creator. Generate a complete website structure for a ${company.businessType} business.

Company Information:
- Company Name: ${company.companyName}
- Business Type: ${company.businessType}
- Target Audience: ${company.targetAudience || "General audience"}
- Business Description: ${company.businessDescription || "Not provided"}
- Communication Tone: ${company.preferences.communicationTone}
- Brand Style: ${company.preferences.brandStyle}

${businessContext ? `Additional Business Context:\n${businessContext}` : ""}

User Request: ${userPrompt}
Template Type: ${templateType || "business"}
Style Preference: ${style || company.preferences.brandStyle}

Generate a complete website structure with the following components:
1. Header (navigation, logo placement, contact info)
2. Hero Section (compelling headline, subheadline, call-to-action)
3. About Section (company story, mission, values)
4. Services/Products Section (key offerings with descriptions)
5. Testimonials Section (placeholder structure for customer reviews)
6. Contact Section (contact form, location, contact details)
7. Footer (links, social media, copyright)

For each section, provide:
- Section title
- Content (text, headings, paragraphs)
- Layout suggestions
- Image/media suggestions
- Call-to-action buttons

Return the response in the following JSON format:
{
  "header": {
    "navigation": ["Home", "About", "Services", "Contact"],
    "logo": "Logo placement suggestion",
    "contactInfo": "Phone/Email display"
  },
  "hero": {
    "headline": "Main headline",
    "subheadline": "Supporting text",
    "cta": "Call to action text",
    "backgroundImage": "Image description"
  },
  "about": {
    "title": "Section title",
    "content": "About content",
    "mission": "Mission statement",
    "values": ["Value 1", "Value 2", "Value 3"]
  },
  "services": {
    "title": "Services section title",
    "services": [
      {
        "name": "Service name",
        "description": "Service description",
        "features": ["Feature 1", "Feature 2"]
      }
    ]
  },
  "testimonials": {
    "title": "Testimonials section title",
    "structure": "Layout description"
  },
  "contact": {
    "title": "Contact section title",
    "form": ["Name", "Email", "Message"],
    "contactDetails": {
      "address": "Address placeholder",
      "phone": "Phone placeholder",
      "email": "Email placeholder"
    }
  },
  "footer": {
    "links": ["Privacy Policy", "Terms of Service"],
    "socialMedia": ["Facebook", "Twitter", "LinkedIn"],
    "copyright": "Copyright text"
  },
  "styling": {
    "colorScheme": "Color recommendations",
    "typography": "Font recommendations",
    "layout": "Layout style description"
  }
}`;

  return prompt;
}

// Helper function to parse AI response
function parseWebsiteResponse(aiResponse) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // If no valid JSON found, create a basic structure
    return {
      header: { navigation: ["Home", "About", "Services", "Contact"] },
      hero: {
        headline: "Welcome to Our Business",
        subheadline: "We provide excellent services",
        cta: "Get Started",
      },
      about: {
        title: "About Us",
        content: "We are a professional business committed to excellence.",
      },
      services: {
        title: "Our Services",
        services: [
          {
            name: "Service 1",
            description: "Professional service description",
          },
        ],
      },
      contact: {
        title: "Contact Us",
        form: ["Name", "Email", "Message"],
      },
      footer: {
        links: ["Privacy Policy", "Terms of Service"],
        copyright: "© 2024 Company Name. All rights reserved.",
      },
    };
  } catch (error) {
    console.error("Error parsing AI response:", error);
    // Return basic structure on parse error
    return {
      error: "Failed to parse AI response",
      rawResponse: aiResponse,
    };
  }
}

module.exports = {
  generateWebsite,
  getMyWebsites,
  getWebsite,
  updateWebsite,
  deleteWebsite,
};
