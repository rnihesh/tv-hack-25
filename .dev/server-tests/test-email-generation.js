const {
  EmailMarketingChain,
} = require("../services/langchain/contextualChains");

async function testEmailGeneration() {
  try {
    console.log("Testing EmailMarketingChain...");

    // Create a test company ID
    const testCompanyId = "507f1f77bcf86cd799439011";

    // Initialize the email chain
    const emailChain = new EmailMarketingChain(testCompanyId);

    console.log("EmailMarketingChain initialized successfully");

    // Test the generateEmail method
    const testParams = {
      emailType: "promotional",
      targetAudience: "small business owners",
      campaignGoal: "increase sales",
      productService: "AI business toolkit",
      tone: "professional",
      callToAction: "Sign up for free trial",
    };

    console.log("Testing generateEmail with params:", testParams);

    const result = await emailChain.generateEmail(testParams);

    console.log("Email generation successful!");
    console.log("Result structure:", {
      hasEmailContent: !!result.emailContent,
      hasModelUsed: !!result.modelUsed,
      hasMetrics: !!result.metrics,
      hasContextUsed: result.hasOwnProperty("contextUsed"),
      hasContextInsights: !!result.contextInsights,
    });

    if (result.emailContent) {
      console.log("Generated email content:", result.emailContent);
    }
  } catch (error) {
    console.error("Test failed:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

// Run the test
testEmailGeneration();
