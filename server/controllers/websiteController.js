const { validationResult } = require("express-validator");
const Company = require("../models/Company");
const Website = require("../models/Website");
const {
  WebsiteGenerationChain,
} = require("../services/langchain/contextualChains");
const businessLogger = require("../utils/logger").businessLogger;

// Credit costs for website operations
const CREDIT_COSTS = {
  website_generation: 5,
};

// Generate website with AI
exports.generateWebsite = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { prompt, templateType = "business", style, colorScheme, sections } = req.body;
    const company = req.companyData;

    // Generate website using AI
    const websiteChain = new WebsiteGenerationChain();
    const result = await websiteChain.generateWebsite(company._id, prompt, {
      templateType,
      style: style || company.preferences?.brandStyle,
      colorScheme: colorScheme || company.preferences?.colorScheme,
      sections,
    });

    // Create website record
    const newWebsite = new Website({
      companyId: company._id,
      templateName: `AI Generated ${templateType} Website`,
      industry: company.businessType || "technology",
      structure: {
        sections: [
          {
            type: "about",
            content: result.content,
            customData: {
              prompt: prompt,
              templateType,
              style: style || company.preferences?.brandStyle,
              colorScheme: colorScheme || company.preferences?.colorScheme,
              sections,
              model: result.modelUsed,
              tokensUsed: result.metrics.tokenUsage.total,
              contextUsed: result.contextUsed,
            }
          }
        ]
      },
      generationPrompt: prompt,
      aiModel: result.modelUsed,
      isPublished: false,
    });

    await newWebsite.save();

    // Deduct credits and update usage
    const requiredCredits = CREDIT_COSTS.website_generation;
    await company.deductCredits(
      requiredCredits,
      "website_gen",
      "Website generation"
    );
    company.usage.websitesGenerated = (company.usage.websitesGenerated || 0) + 1;
    await company.save();

    // Log business activity
    businessLogger.contentGeneration(company.email, "website", true, {
      templateType,
      style: style || company.preferences?.brandStyle,
      model: result.modelUsed,
      creditsUsed: requiredCredits,
    });

    res.status(201).json({
      success: true,
      message: "Website generated successfully",
      data: {
        websiteId: newWebsite._id,
        htmlContent: result.content,
        contextInsights: result.contextInsights,
        metadata: {
          templateType,
          style: style || company.preferences?.brandStyle,
          colorScheme: colorScheme || company.preferences?.colorScheme,
          tokensUsed: result.metrics.tokenUsage.total,
          processingTime: result.metrics.duration,
          contextSources: result.contextUsed,
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

// Get all websites for the authenticated company
exports.getMyWebsites = async (req, res) => {
  try {
    const company = req.companyData;
    const websites = await Website.find({ companyId: company._id })
      .sort({ createdAt: -1 })
      .select("-structure.sections.content"); // Exclude large content field for listing

    res.json({
      success: true,
      data: websites,
    });
  } catch (error) {
    console.error("Get websites error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching websites",
    });
  }
};

// Get a specific website
exports.getWebsite = async (req, res) => {
  try {
    const { id } = req.params;
    const company = req.companyData;

    const website = await Website.findOne({
      _id: id,
      companyId: company._id,
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found",
      });
    }

    res.json({
      success: true,
      data: website,
    });
  } catch (error) {
    console.error("Get website error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching website",
    });
  }
};

// Get generation status (placeholder for real-time updates)
exports.getGenerationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const company = req.companyData;

    const website = await Website.findOne({
      _id: id,
      companyId: company._id,
    }).select("isPublished createdAt");

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found",
      });
    }

    res.json({
      success: true,
      data: {
        status: website.isPublished ? "published" : "draft",
        createdAt: website.createdAt,
      },
    });
  } catch (error) {
    console.error("Get generation status error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching generation status",
    });
  }
};

// Get company profile for website generation
exports.getCompanyProfile = async (req, res) => {
  try {
    const company = req.companyData;

    res.json({
      success: true,
      data: {
        name: company.name,
        businessType: company.businessType,
        description: company.description,
        preferences: company.preferences,
        productServices: company.productServices || [],
      },
    });
  } catch (error) {
    console.error("Get company profile error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching company profile",
    });
  }
};

// Update a website
exports.updateWebsite = async (req, res) => {
  try {
    const { id } = req.params;
    const company = req.companyData;
    const updates = req.body;

    const website = await Website.findOne({
      _id: id,
      companyId: company._id,
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found",
      });
    }

    // Update allowed fields
    if (updates.templateName) website.templateName = updates.templateName;
    if (updates.isPublished !== undefined) website.isPublished = updates.isPublished;
    if (updates.structure) website.structure = { ...website.structure, ...updates.structure };

    await website.save();

    res.json({
      success: true,
      message: "Website updated successfully",
      data: website,
    });
  } catch (error) {
    console.error("Update website error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating website",
    });
  }
};

// Delete a website
exports.deleteWebsite = async (req, res) => {
  try {
    const { id } = req.params;
    const company = req.companyData;

    const website = await Website.findOneAndDelete({
      _id: id,
      companyId: company._id,
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found",
      });
    }

    res.json({
      success: true,
      message: "Website deleted successfully",
    });
  } catch (error) {
    console.error("Delete website error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting website",
    });
  }
};

// Deploy/publish a website
exports.deployWebsite = async (req, res) => {
  try {
    const { id } = req.params;
    const company = req.companyData;

    const website = await Website.findOne({
      _id: id,
      companyId: company._id,
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found",
      });
    }

    website.isPublished = true;
    await website.save();

    res.json({
      success: true,
      message: "Website deployed successfully",
      data: {
        websiteId: website._id,
        isPublished: website.isPublished,
        deployedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Deploy website error:", error);
    res.status(500).json({
      success: false,
      message: "Error deploying website",
    });
  }
};
