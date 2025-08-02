const { validationResult } = require("express-validator");
const Company = require("../models/Company");
const GeneratedContent = require("../models/Media");
const csv = require("csv-parser");
const fs = require("fs");
const {
  EmailMarketingChain,
} = require("../services/langchain/contextualChains");
const { businessLogger, aiLogger } = require("../utils/logger");
const {
  sendMarketingEmail,
  sendSingleEmail,
  sendVerificationEmail: sendVerifyEmail,
  generateVerifyCode,
  setVerifyCodeExpiry,
  setNextResendTime,
  canResendOTP,
} = require("../services/emailService");

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
          prompt: `${campaignType} campaign email ${
            index + 1
          } for ${targetAudience}`,
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

// @desc    Add emails to company's email list
// @route   POST /api/email/emails
// @access  Private
const addEmails = async (req, res) => {
  try {
    const company = await Company.findById(req.company.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found5",
      });
    }

    let newEmails = [];

    // Handle file upload (CSV)
    if (req.file) {
      const results = [];
      fs.createReadStream(req.file.path)
        .pipe(csv({ headers: false }))
        .on("data", (data) => {
          // Get the first column value (assuming email is in first column)
          const email = Object.values(data)[0];
          if (email && email.includes("@")) {
            results.push(email.trim().toLowerCase());
          }
        })
        .on("end", async () => {
          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          // Filter out duplicates and invalid emails
          const validEmails = results.filter((email) => {
            const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
            return emailRegex.test(email) && !company.emailList.includes(email);
          });

          // Add to company's email list
          company.emailList.push(...validEmails);
          await company.save();

          res.status(200).json({
            success: true,
            message: `${validEmails.length} emails added successfully`,
            data: {
              addedEmails: validEmails.length,
              totalEmails: company.emailList.length,
              duplicatesSkipped: results.length - validEmails.length,
            },
          });
        })
        .on("error", (error) => {
          // Clean up uploaded file on error
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }

          res.status(400).json({
            success: false,
            message: "Error processing CSV file",
            error: error.message,
          });
        });
    }
    // Handle manual email input
    else if (req.body.emails) {
      const emailArray = Array.isArray(req.body.emails)
        ? req.body.emails
        : [req.body.emails];

      const validEmails = emailArray.filter((email) => {
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        return emailRegex.test(email) && !company.emailList.includes(email);
      });

      company.emailList.push(...validEmails);
      await company.save();

      res.status(200).json({
        success: true,
        message: `${validEmails.length} emails added successfully`,
        data: {
          addedEmails: validEmails.length,
          totalEmails: company.emailList.length,
          duplicatesSkipped: emailArray.length - validEmails.length,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: "No emails provided. Send either a CSV file or emails array",
      });
    }
  } catch (error) {
    console.error("Add emails error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding emails",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Get company's email list
// @route   GET /api/email/emails
// @access  Private
const getEmails = async (req, res) => {
  try {
    const company = await Company.findById(req.company.id).select("emailList");
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found6",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        emails: company.emailList,
        totalEmails: company.emailList.length,
      },
    });
  } catch (error) {
    console.error("Get emails error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving emails",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Replace company's email list
// @route   PUT /api/email/emails
// @access  Private
const updateEmails = async (req, res) => {
  try {
    const company = await Company.findById(req.company.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found7",
      });
    }

    let newEmails = [];

    // Handle file upload (CSV)
    if (req.file) {
      const results = [];
      fs.createReadStream(req.file.path)
        .pipe(csv({ headers: false }))
        .on("data", (data) => {
          const email = Object.values(data)[0];
          if (email && email.includes("@")) {
            results.push(email.trim().toLowerCase());
          }
        })
        .on("end", async () => {
          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          // Filter valid emails and remove duplicates
          const validEmails = [
            ...new Set(
              results.filter((email) => {
                const emailRegex =
                  /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
                return emailRegex.test(email);
              })
            ),
          ];

          // Replace company's email list
          company.emailList = validEmails;
          await company.save();

          res.status(200).json({
            success: true,
            message: "Email list updated successfully",
            data: {
              totalEmails: company.emailList.length,
              invalidEmailsSkipped: results.length - validEmails.length,
            },
          });
        })
        .on("error", (error) => {
          // Clean up uploaded file on error
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }

          res.status(400).json({
            success: false,
            message: "Error processing CSV file",
            error: error.message,
          });
        });
    }
    // Handle manual email input
    else if (req.body.emails) {
      const emailArray = Array.isArray(req.body.emails)
        ? req.body.emails
        : [req.body.emails];

      const validEmails = [
        ...new Set(
          emailArray.filter((email) => {
            const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
            return emailRegex.test(email);
          })
        ),
      ];

      company.emailList = validEmails;
      await company.save();

      res.status(200).json({
        success: true,
        message: "Email list updated successfully",
        data: {
          totalEmails: company.emailList.length,
          invalidEmailsSkipped: emailArray.length - validEmails.length,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: "No emails provided. Send either a CSV file or emails array",
      });
    }
  } catch (error) {
    console.error("Update emails error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating emails",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Send email immediately
// @route   POST /api/email/send
// @access  Private
const sendEmail = async (req, res) => {
  try {
    const { subject, message, recipients, htmlContent } = req.body;

    if (!subject || !message || !recipients || !Array.isArray(recipients)) {
      return res.status(400).json({
        success: false,
        message: "Subject, message, and recipients array are required",
      });
    }

    // Get company data
    const company = await Company.findById(req.company.id);

    try {
      // Send emails using Gmail OAuth2 service
      const results = await sendMarketingEmail(
        subject,
        htmlContent ||
          `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${message.replace(
            /\n/g,
            "<br>"
          )}</div>`,
        message,
        recipients,
        company
      );

      // Update company usage statistics
      company.usage.emailsSent = (company.usage.emailsSent || 0) + results.sent;
      await company.save();

      businessLogger.contentGeneration(company.email, "email_send", true, {
        recipientCount: results.sent,
        failedCount: results.failed,
        subject: subject,
      });

      res.status(200).json({
        success: true,
        message: `Emails sent: ${results.sent}, Failed: ${results.failed}`,
        data: {
          ...results,
          totalRecipients: recipients.length,
        },
      });
    } catch (emailError) {
      // If email service fails, still log the attempt but don't update usage
      businessLogger.contentGeneration(company.email, "email_send", false, {
        recipientCount: recipients.length,
        subject: subject,
        error: emailError.message,
      });

      res.status(500).json({
        success: false,
        message: "Failed to send emails",
        error: emailError,
      });
    }
  } catch (error) {
    console.error("Send email error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing email request",
      error: error,
    });
  }
};

// @desc    Schedule email for later
// @route   POST /api/email/schedule
// @access  Private
const scheduleEmail = async (req, res) => {
  try {
    const { subject, message, recipients, scheduledFor } = req.body;

    if (
      !subject ||
      !message ||
      !recipients ||
      !Array.isArray(recipients) ||
      !scheduledFor
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Subject, message, recipients array, and scheduledFor are required",
      });
    }

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Scheduled time must be in the future",
      });
    }

    // Here you would integrate with your email scheduling service
    // For now, we'll simulate the scheduling process

    const results = {
      scheduled: recipients.length,
      campaignId: `scheduled_${Date.now()}`,
      scheduledFor: scheduledDate.toISOString(),
      timestamp: new Date().toISOString(),
    };

    const company = await Company.findById(req.company.id);
    businessLogger.contentGeneration(company.email, "email_schedule", true, {
      recipientCount: recipients.length,
      subject: subject,
      scheduledFor: scheduledDate.toISOString(),
    });

    res.status(200).json({
      success: true,
      message: "Email scheduled successfully",
      data: results,
    });
  } catch (error) {
    console.error("Schedule email error:", error);
    res.status(500).json({
      success: false,
      message: "Error scheduling email",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Enhance email content with AI
// @route   POST /api/email/enhance
// @access  Private
const enhanceEmail = async (req, res) => {
  try {
    const { description, subject } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        message: "Description is required",
      });
    }

    const company = await Company.findById(req.company.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found8",
      });
    }

    // Initialize the email marketing chain with context
    const emailChain = new EmailMarketingChain(company._id);

    // Generate enhanced email content
    const result = await emailChain.generateEmail({
      emailType: "general",
      targetAudience: company.targetAudience || "customers",
      campaignGoal: description,
      productService: company.businessDescription || "our services",
      tone: company.preferences?.communicationTone || "professional",
      callToAction: "Learn more",
    });

    console.log("AI Chain Result:", JSON.stringify(result, null, 2));

    // Parse the AI response to extract proper content
    let enhancedContent = description;
    let enhancedSubject = subject || "Email Subject"; // Provide fallback if subject is empty

    if (result?.emailContent) {
      console.log(
        "EmailContent found:",
        JSON.stringify(result.emailContent, null, 2)
      );

      // The emailContent should already be properly structured from the chain
      enhancedContent = result.emailContent.body || description;
      enhancedSubject = result.emailContent.subject || enhancedSubject;

      // Additional check: if the body contains JSON-like structure, try to extract it
      if (
        typeof enhancedContent === "string" &&
        enhancedContent.trim().startsWith("{")
      ) {
        try {
          const parsedContent = JSON.parse(enhancedContent);
          enhancedContent = parsedContent.body || enhancedContent;
          enhancedSubject = parsedContent.subject || enhancedSubject;
          console.log("Successfully parsed nested JSON content");
        } catch (parseError) {
          console.warn(
            "Failed to parse JSON content, using as-is:",
            parseError.message
          );
        }
      }

      // Additional check: if the subject contains JSON-like structure, try to extract it
      if (
        typeof enhancedSubject === "string" &&
        enhancedSubject.trim().startsWith("{")
      ) {
        try {
          const parsedSubject = JSON.parse(enhancedSubject);
          enhancedSubject = parsedSubject.subject || enhancedSubject;
          console.log("Successfully parsed nested JSON subject");
        } catch (parseError) {
          console.warn(
            "Failed to parse JSON subject, using as-is:",
            parseError.message
          );
        }
      }
    } else {
      console.log("No emailContent found in result, using fallback values");
    }

    console.log("Final enhanced content:", {
      enhancedContent: enhancedContent.substring(0, 100) + "...",
      enhancedSubject,
    });

    res.status(200).json({
      success: true,
      message: "Email enhanced successfully",
      data: {
        enhancedMessage: enhancedContent,
        subject: enhancedSubject,
        suggestions: [
          "Consider adding a clear call-to-action button",
          "Personalize with customer names using merge tags",
          "Test different subject lines for better open rates",
          "Include social media links in the footer",
        ],
      },
    });
  } catch (error) {
    console.error("Enhance email error:", error);
    res.status(500).json({
      success: false,
      message: "Error enhancing email content",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Send verification email
// @route   POST /api/email/send-verification
// @access  Private
const sendVerificationEmail = async (req, res) => {
  try {
    const { userEmail, userName, userId } = req.body;

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: "User email is required",
      });
    }

    // Get company data
    const company = await Company.findById(req.company.id);

    // Generate verification code
    const verifyCode = generateVerifyCode();

    // Create user object for email template
    const user = {
      email: userEmail,
      firstName: userName || "User",
      id: userId,
    };

    try {
      // Send verification email
      const result = await sendVerifyEmail(user, verifyCode, company);

      if (result.success) {
        // You would typically save the verification code to your database here
        // along with expiry time for the user

        businessLogger.contentGeneration(
          company.email,
          "verification_email_send",
          true,
          {
            recipientEmail: userEmail,
            verificationCode: verifyCode, // Note: In production, don't log the actual code
          }
        );

        res.status(200).json({
          success: true,
          message: "Verification email sent successfully",
          data: {
            verificationCode: verifyCode, // In production, don't return this
            expiryTime: setVerifyCodeExpiry(),
            nextResendTime: setNextResendTime(),
          },
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
          error: result.error,
        });
      }
    } catch (emailError) {
      businessLogger.contentGeneration(
        company.email,
        "verification_email_send",
        false,
        {
          recipientEmail: userEmail,
          error: emailError.message,
        }
      );

      res.status(500).json({
        success: false,
        message: "Failed to send verification email",
        error:
          process.env.NODE_ENV === "development"
            ? emailError.message
            : "Email service error",
      });
    }
  } catch (error) {
    console.error("Send verification email error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing verification email request",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Test email configuration
// @route   POST /api/email/test
// @access  Private
const testEmailConfig = async (req, res) => {
  try {
    const company = await Company.findById(req.company.id);

    // Send a test email to the company's own email
    const testResult = await sendSingleEmail(
      company.email,
      "Email Configuration Test - TechnoVista AI Toolkit",
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #e85f5c;">Email Configuration Test</h2>
          <p>Hello ${company.companyName || "there"},</p>
          <p>This is a test email to verify that your email configuration is working correctly.</p>
          <p>If you're reading this, your Gmail OAuth2 setup is successful!</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Test Details:</strong><br>
            Company: ${company.companyName}<br>
            Email: ${company.email}<br>
            Timestamp: ${new Date().toISOString()}
          </div>
          <p>Best regards,<br>TechnoVista AI Toolkit Team</p>
        </div>
      `,
      `Email Configuration Test\n\nHello ${
        company.companyName || "there"
      },\n\nThis is a test email to verify that your email configuration is working correctly.\n\nIf you're reading this, your Gmail OAuth2 setup is successful!\n\nTest Details:\nCompany: ${
        company.companyName
      }\nEmail: ${
        company.email
      }\nTimestamp: ${new Date().toISOString()}\n\nBest regards,\nTechnoVista AI Toolkit Team`,
      company
    );

    businessLogger.contentGeneration(company.email, "email_config_test", true, {
      testResult: testResult,
    });

    res.status(200).json({
      success: true,
      message: "Test email sent successfully",
      data: {
        messageId: testResult.messageId,
        timestamp: testResult.timestamp,
        recipient: company.email,
      },
    });
  } catch (error) {
    console.error("Test email error:", error);

    const company = await Company.findById(req.company.id);
    businessLogger.contentGeneration(
      company.email,
      "email_config_test",
      false,
      {
        error: error.message,
      }
    );

    res.status(500).json({
      success: false,
      message: "Failed to send test email",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Email configuration error",
      troubleshooting: [
        "Check your Gmail OAuth2 credentials in environment variables",
        "Ensure Gmail API is enabled in Google Cloud Console",
        "Verify refresh token is still valid",
        "Check if 2-factor authentication is enabled on Gmail account",
      ],
    });
  }
};

module.exports = {
  generateEmail,
  generateEmailCampaign,
  addEmails,
  getEmails,
  updateEmails,
  sendEmail,
  scheduleEmail,
  enhanceEmail,
  sendVerificationEmail,
  testEmailConfig,
};
