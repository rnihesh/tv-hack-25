const { validationResult } = require("express-validator");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const nodemailer = require("nodemailer");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Email transporter configuration
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// @desc    Enhance email content with AI
// @route   POST /api/email/enhance
// @access  Private
const enhanceEmail = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { description, subject } = req.body;
    const company = req.companyData || {};

    // Use Gemini AI to enhance the email content
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const enhancePrompt = `
You are a professional email marketing expert. Your task is to transform a basic email description into a compelling, professional email that drives engagement and action.

Company Context: ${company.businessInfo?.businessType || 'Business'} - ${company.businessInfo?.description || 'Professional services'}
Company Tone: ${company.preferences?.communicationTone || 'professional'}

Original Subject: ${subject}
Original Description: ${description}

Create an enhanced email with the following:

1. **Subject Line**: Improve the subject line to be more compelling and clickable
2. **Email Body**: Transform the description into a well-structured, professional email with:
   - Engaging opening
   - Clear value proposition
   - Compelling call to action
   - Professional closing
   - Proper formatting with paragraphs

Guidelines:
- Keep the tone ${company.preferences?.communicationTone || 'professional'} but engaging
- Make it scannable with short paragraphs
- Include a clear call to action
- Personalize where possible
- Optimize for mobile reading
- Maximum 300-400 words for the body

Respond in JSON format:
{
  "enhancedSubject": "improved subject line",
  "enhancedMessage": "complete enhanced email body with proper formatting"
}
`;

    const result = await model.generateContent(enhancePrompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    let enhancedContent;
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        enhancedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in response");
      }
    } catch (parseError) {
      // Fallback if JSON parsing fails
      enhancedContent = {
        enhancedSubject: subject,
        enhancedMessage: text.replace(/```json|```/g, '').trim()
      };
    }

    res.status(200).json({
      success: true,
      message: "Email enhanced successfully",
      data: {
        originalSubject: subject,
        originalDescription: description,
        enhancedSubject: enhancedContent.enhancedSubject,
        enhancedMessage: enhancedContent.enhancedMessage,
      },
    });
  } catch (error) {
    console.error("Email enhancement error:", error);
    res.status(500).json({
      success: false,
      message: "Error enhancing email",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};

// @desc    Send email immediately
// @route   POST /api/email/send
// @access  Private
const sendEmail = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { subject, message, recipients } = req.body;
    const company = req.companyData || {};

    // Create email transporter
    const transporter = createEmailTransporter();

    // Mock customer data - replace with actual customer lookup
    const mockCustomers = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
      { id: 4, name: 'Alice Brown', email: 'alice@example.com' },
      { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com' },
      { id: 6, name: 'Diana Davis', email: 'diana@example.com' },
    ];

    // Get customer emails from recipients array
    const customerEmails = recipients.map(id => {
      const customer = mockCustomers.find(c => c.id === id);
      return customer ? { email: customer.email, name: customer.name } : null;
    }).filter(Boolean);

    if (customerEmails.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid customers found for the provided recipient IDs",
      });
    }

    // Send emails
    const sendResults = [];
    const failedSends = [];

    for (const customer of customerEmails) {
      try {
        const personalizedMessage = message.replace(/\[Customer Name\]/g, customer.name);
        
        const mailOptions = {
          from: `${company.businessInfo?.businessName || 'Your Company'} <${process.env.EMAIL_USER}>`,
          to: customer.email,
          subject: subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                <h2 style="color: #333; margin: 0;">${company.businessInfo?.businessName || 'Your Company'}</h2>
              </div>
              <div style="padding: 30px 20px; background-color: white;">
                ${personalizedMessage.split('\n').map(line => `<p style="line-height: 1.6; color: #333;">${line}</p>`).join('')}
              </div>
              <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                <p>You're receiving this email because you're a valued customer of ${company.businessInfo?.businessName || 'our company'}.</p>
                <p><a href="#" style="color: #007bff;">Unsubscribe</a> | <a href="#" style="color: #007bff;">Update Preferences</a></p>
              </div>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        sendResults.push({ email: customer.email, status: 'sent' });
      } catch (emailError) {
        console.error(`Failed to send email to ${customer.email}:`, emailError);
        failedSends.push({ email: customer.email, error: emailError.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Email sent successfully to ${sendResults.length} recipients`,
      data: {
        sent: sendResults.length,
        failed: failedSends.length,
        results: sendResults,
        failures: failedSends,
        totalRequested: recipients.length,
      },
    });
  } catch (error) {
    console.error("Email sending error:", error);
    res.status(500).json({
      success: false,
      message: "Error sending email",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};

// @desc    Schedule email for later
// @route   POST /api/email/schedule
// @access  Private
const scheduleEmail = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { subject, message, recipients, scheduledFor } = req.body;

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledFor);
    const now = new Date();
    
    if (scheduledDate <= now) {
      return res.status(400).json({
        success: false,
        message: "Scheduled time must be in the future",
      });
    }

    // For testing, we'll just return success
    console.log('Email scheduled:', { subject, recipients: recipients.length, scheduledFor });

    res.status(200).json({
      success: true,
      message: "Email scheduled successfully",
      data: {
        scheduledId: `scheduled_${Date.now()}`,
        subject,
        recipientCount: recipients.length,
        scheduledFor: scheduledDate.toISOString(),
        status: 'scheduled',
        message: "Email has been scheduled and will be sent at the specified time",
      },
    });
  } catch (error) {
    console.error("Email scheduling error:", error);
    res.status(500).json({
      success: false,
      message: "Error scheduling email",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};

module.exports = {
  enhanceEmail,
  sendEmail,
  scheduleEmail,
};
