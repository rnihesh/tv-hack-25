const { validationResult } = require("express-validator");
const Company = require("../models/Company");
const GeneratedContent = require("../models/Media");
const {
  EmailMarketingChain,
} = require("../services/langchain/contextualChains");
const { businessLogger, aiLogger } = require("../utils/logger");

// Credit costs for different email operations
const CREDIT_COSTS = {
  email_generation: 3,
  email_campaign: 5,
  email_sequence: 8,
};

// @desc    Generate marketing email using AI with context
// @route   POST /api/email/generate
// @access  Private
const generateEmail = async (req, res) => {
  try {
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Validation failed",
    //     errors: errors.array(),
    //   });
    // }

    const {
      emailType,
      targetAudience,
      campaignGoal,
      productService,
      tone,
      callToAction,
    } = req.body;
    
    // Company data is populated by checkCredits middleware
    const company = req.companyData;

    // Initialize the email marketing chain with context
    const emailChain = new EmailMarketingChain(company._id);

    // Generate email content with contextual awareness
    const result = await emailChain.generateEmail({
      emailType,
      targetAudience,
      campaignGoal,
      productService,
      tone: tone || company.preferences?.communicationTone,
      callToAction,
    });

    // Create generated content record
    const generatedContent = new GeneratedContent({
      companyId: company._id,
      contentType: "email",
      prompt: `${emailType} email for ${targetAudience} with goal: ${campaignGoal}`,
      generatedContent: {
        emailContent: result.emailContent,
        metadata: {
          emailType,
          targetAudience,
          campaignGoal,
          tone: result.emailContent.tone,
          model: result.modelUsed,
          tokensUsed: result.metrics.tokenUsage.total,
          contextUsed: result.contextUsed,
        },
      },
      aiModel: result.modelUsed,
      version: 1,
      isActive: true,
    });

    await generatedContent.save();

    // Deduct credits and update usage
    const requiredCredits = CREDIT_COSTS.email_generation;
    await company.deductCredits(
      requiredCredits,
      "email_gen",
      "Email generation"
    );
    company.usage.emailsGenerated = (company.usage.emailsGenerated || 0) + 1;
    await company.save();

    // Log business activity
    businessLogger.contentGeneration(company.email, "email", true, {
      emailType,
      targetAudience,
      model: result.modelUsed,
      creditsUsed: requiredCredits,
    });

    res.status(201).json({
      success: true,
      message: "Email generated successfully",
      data: {
        contentId: generatedContent._id,
        email: result.emailContent,
        contextInsights: result.contextInsights,
        metadata: {
          emailType,
          targetAudience,
          campaignGoal,
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
      "email",
      false,
      { error: error.message }
    );

    console.error("Email generation error:", error);
    res.status(500).json({
      success: false,
      message: "Error generating email",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Generate email campaign sequence
// @route   POST /api/email/campaign
// @access  Private
const generateEmailCampaign = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const {
      campaignType,
      sequenceLength,
      targetAudience,
      campaignGoal,
      productService,
      tone,
    } = req.body;
    
    // Company data is populated by checkCredits middleware
    const company = req.companyData;

    // Initialize the email marketing chain with context
    const emailChain = new EmailMarketingChain(company._id);

    // Generate email campaign with contextual awareness
    const result = await emailChain.generateEmailCampaign({
      campaignType,
      sequenceLength: sequenceLength || 3,
      targetAudience,
      campaignGoal,
      productService,
      tone: tone || company.preferences?.communicationTone,
    });

    // Create generated content record for each email in sequence
    const contentRecords = await Promise.all(
      result.emailSequence.map(async (emailContent, index) => {
        const generatedContent = new GeneratedContent({
          companyId: company._id,
          contentType: "email_campaign",
          prompt: `${campaignType} campaign email ${index + 1} for ${targetAudience}`,
          generatedContent: {
            emailContent,
            campaignInfo: {
              campaignType,
              sequencePosition: index + 1,
              totalEmails: sequenceLength,
              targetAudience,
              campaignGoal,
            },
            metadata: {
              model: result.modelUsed,
              tokensUsed:
                result.metrics.tokenUsage.total / result.emailSequence.length,
              contextUsed: result.contextUsed,
            },
          },
          aiModel: result.modelUsed,
          version: 1,
          isActive: true,
        });
        return await generatedContent.save();
      })
    );

    // Deduct credits and update usage
    const requiredCredits = CREDIT_COSTS.email_campaign;
    await company.deductCredits(
      requiredCredits,
      "email_campaign",
      "Email campaign generation"
    );
    company.usage.campaignsGenerated =
      (company.usage.campaignsGenerated || 0) + 1;
    await company.save();

    // Log business activity
    businessLogger.contentGeneration(company.email, "email_campaign", true, {
      campaignType,
      sequenceLength,
      targetAudience,
      model: result.modelUsed,
      creditsUsed: requiredCredits,
    });

    res.status(201).json({
      success: true,
      message: "Email campaign generated successfully",
      data: {
        campaignId: contentRecords[0]._id, // Use first email's ID as campaign ID
        emailSequence: result.emailSequence,
        campaignStrategy: result.campaignStrategy,
        contextInsights: result.contextInsights,
        metadata: {
          campaignType,
          sequenceLength,
          targetAudience,
          campaignGoal,
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
      "email_campaign",
      false,
      { error: error.message }
    );

    console.error("Email campaign generation error:", error);
    res.status(500).json({
      success: false,
      message: "Error generating email campaign",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

module.exports = {
  generateEmail,
  generateEmailCampaign,
};
