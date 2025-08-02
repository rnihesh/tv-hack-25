const { validationResult } = require("express-validator");
const Company = require("../models/Company");
const Website = require("../models/Website");
const axios = require('axios')
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
    console.log('=== Website Generation Request ===');
    console.log('Request body:', req.body);
    console.log('Company data:', req.companyData ? 'Present' : 'Missing');
    console.log('CREDIT_COSTS:', CREDIT_COSTS);
    
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

    if (!company) {
      console.error('Company data is missing from request');
      return res.status(401).json({
        success: false,
        message: "Company data not found",
      });
    }

    console.log('Company ID:', company._id);
    console.log('Generation prompt:', prompt);

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
    if (!CREDIT_COSTS) {
      console.error('CREDIT_COSTS is undefined!');
      throw new Error('CREDIT_COSTS configuration is missing');
    }
    const requiredCredits = CREDIT_COSTS.website_generation || 5; // fallback to 5 credits
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
    // const company = req.companyData;

    const website = await Website.findOne({
      _id: id,
      // companyId: company._id,
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found",
      });
    }

    // Use htmlContent if available, else fallback to first section content
    let htmlContent = website.htmlContent;
    if (!htmlContent && website.structure && website.structure.sections && website.structure.sections.length > 0) {
      htmlContent = website.structure.sections[0].content;
    }
    if (!htmlContent) {
      htmlContent = "<html><body>No content</body></html>";
    }
    // Ensure htmlContent is a full HTML document
    const isFullHtml = /<html[\s>]/i.test(htmlContent) || /<!DOCTYPE html>/i.test(htmlContent);
    if (!isFullHtml) {
      htmlContent = `<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"UTF-8\">\n  <title>AI Generated Website</title>\n</head>\n<body>\n${htmlContent}\n</body>\n</html>`;
    }

    // Log the HTML content for debugging
    console.log('HTML content to deploy:', htmlContent);

    // If the HTML is escaped (e.g., &lt;html&gt;), decode it
    if (/&lt;|&gt;|&amp;|&quot;|&#39;/.test(htmlContent)) {
      const he = require('he');
      htmlContent = he.decode(htmlContent);
      console.log('Decoded HTML content:', htmlContent);
    }

    // Step 1: Create a site (let Netlify auto-generate a unique name)
    const siteResponse = await axios.post(
      'https://api.netlify.com/api/v1/sites',
      {},
      {
        headers: {
          Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
        },
      }
    );

    const siteId = siteResponse.data.id;

    // Step 2: Deploy index.html using Netlify's file digest flow
    const crypto = require('crypto');
    const sha1 = crypto.createHash('sha1').update(htmlContent).digest('hex');
    // 1. Create a new deploy with file digest
    const deployInit = await axios.post(
      `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
      {
        files: {
          "/index.html": sha1
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
        },
      }
    );
    const deployId = deployInit.data.id;
    const required = deployInit.data.required || [];
    // 2. Only upload if required
    if (required.includes(sha1)) {
      await axios.put(
        `https://api.netlify.com/api/v1/deploys/${deployId}/files/index.html`,
        Buffer.from(htmlContent, 'utf8'),
        {
          headers: {
            'Content-Type': 'text/html',
            Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );
    }
    // 3. Poll for deploy status
    let deployResponse;
    for (let i = 0; i < 10; i++) {
      deployResponse = await axios.get(
        `https://api.netlify.com/api/v1/deploys/${deployId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
          },
        }
      );
      if (deployResponse.data.state === 'ready') break;
      await new Promise(r => setTimeout(r, 2000));
    }

    const websiteUrl = deployResponse.data.deploy_ssl_url || deployResponse.data.deploy_url;
    // Update DB
    website.isPublished = true;
    website.deploymentUrl = websiteUrl;
    website.deployedAt = new Date();
    await website.save();

    // businessLogger.contentGeneration(company.email, "website_deploy", true, {
    //   websiteId: website._id,
    //   deploymentUrl: websiteUrl,
    // });

    return res.json({
      success: true,
      message: "Website deployed successfully to Netlify",
      data: {
        websiteId: website._id,
        websiteUrl,
        isPublished: website.isPublished,
        deployedAt: website.deployedAt,
      },
    });
  } catch (error) {
    console.error("Deploy website error:", error);
    res.status(500).json({
      success: false,
      message: "Error deploying website",
    });
  }
}
