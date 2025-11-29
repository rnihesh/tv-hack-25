const fs = require("fs");
const csv = require("csv-parser");
const { sendMarketingEmail } = require("../services/emailService");

async function sendEmailToCsvRecipients() {
  try {
    console.log("📧 Sending emails to CSV recipients...\n");

    // Read emails from CSV file
    const emails = [];
    const csvPath = "../cust.csv"; // Path to your CSV file

    if (!fs.existsSync(csvPath)) {
      console.log("❌ CSV file not found at:", csvPath);
      console.log(
        "Please make sure the CSV file exists and contains email addresses."
      );
      return;
    }

    // Parse CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on("data", (row) => {
          // Assuming the CSV has an 'email' column
          if (row.email && row.email.includes("@")) {
            emails.push(row.email.trim());
          }
        })
        .on("end", () => {
          console.log(`📋 Found ${emails.length} email addresses in CSV`);
          resolve();
        })
        .on("error", reject);
    });

    if (emails.length === 0) {
      console.log("❌ No valid email addresses found in CSV file");
      return;
    }

    console.log("📧 Email addresses found:");
    emails.forEach((email, index) => {
      console.log(`   ${index + 1}. ${email}`);
    });

    // Sample email content
    const subject =
      "Welcome to TechnoVista AI Toolkit - Transform Your Business!";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to TechnoVista AI Toolkit</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .feature { margin: 15px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 Welcome to TechnoVista AI Toolkit</h1>
              <p>Transform Your Business with AI-Powered Solutions</p>
            </div>
            
            <div class="content">
              <h2>Hello there! 👋</h2>
              
              <p>We're excited to introduce you to <strong>TechnoVista AI Toolkit</strong> - your all-in-one solution for AI-powered business automation!</p>
              
              <div class="feature">
                <h3>🤖 AI-Powered Chatbots</h3>
                <p>Create intelligent chatbots that understand your business and engage customers 24/7.</p>
              </div>
              
              <div class="feature">
                <h3>📧 Smart Email Marketing</h3>
                <p>Generate compelling marketing emails with AI assistance and reach your audience effectively.</p>
              </div>
              
              <div class="feature">
                <h3>🌐 Website Generation</h3>
                <p>Build professional websites in minutes with our AI-driven website generator.</p>
              </div>
              
              <p>Ready to revolutionize your business operations?</p>
              
              <div style="text-align: center;">
                <a href="#" class="cta-button">Get Started Today →</a>
              </div>
              
              <p>If you have any questions, feel free to reach out to our support team. We're here to help you succeed!</p>
              
              <p>Best regards,<br>
              <strong>The TechnoVista Team</strong></p>
            </div>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} TechnoVista AI Toolkit. All rights reserved.</p>
              <p>This email was sent as part of our demo. You can unsubscribe at any time.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `
Welcome to TechnoVista AI Toolkit!

Hello there!

We're excited to introduce you to TechnoVista AI Toolkit - your all-in-one solution for AI-powered business automation!

🤖 AI-Powered Chatbots
Create intelligent chatbots that understand your business and engage customers 24/7.

📧 Smart Email Marketing  
Generate compelling marketing emails with AI assistance and reach your audience effectively.

🌐 Website Generation
Build professional websites in minutes with our AI-driven website generator.

Ready to revolutionize your business operations? Get started today!

If you have any questions, feel free to reach out to our support team. We're here to help you succeed!

Best regards,
The TechnoVista Team

© ${new Date().getFullYear()} TechnoVista AI Toolkit. All rights reserved.
This email was sent as part of our demo. You can unsubscribe at any time.
    `;

    const mockCompany = {
      companyName: "TechnoVista AI Toolkit",
      email: "demo@technovista.com",
    };

    console.log("\n📤 Sending emails...");

    // Send emails
    const results = await sendMarketingEmail(
      subject,
      htmlContent,
      textContent,
      emails,
      mockCompany
    );

    console.log("\n📊 Email Sending Results:");
    console.log(`✅ Successfully sent: ${results.sent}`);
    console.log(`❌ Failed to send: ${results.failed}`);
    console.log(`📅 Campaign ID: ${results.campaignId}`);
    console.log(`⏰ Timestamp: ${results.timestamp}`);

    if (results.errors && results.errors.length > 0) {
      console.log("\n❌ Errors encountered:");
      results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.email}: ${error.error}`);
      });
    }

    console.log("\n🎉 Email campaign completed!");
  } catch (error) {
    console.error("❌ Error sending emails:", error);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  console.log("📬 TechnoVista Email Campaign Demo");
  console.log("=================================\n");

  sendEmailToCsvRecipients().catch(console.error);
}

module.exports = { sendEmailToCsvRecipients };
