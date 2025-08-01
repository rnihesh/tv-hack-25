/**
 * Vector Context System Testing and Initialization Script
 *
 * This script demonstrates how to:
 * 1. Initialize the vector context system for a company
 * 2. Add business context to the vector store
 * 3. Test contextual AI generation
 * 4. Monitor context usage and effectiveness
 */

const { VectorContextService } = require("../services/langchain/vectorContext");
const {
  WebsiteGenerationChain,
  EmailMarketingChain,
  ChatbotChain,
} = require("../services/langchain/contextualChains");
const Company = require("../models/Company");
const { businessLogger } = require("../utils/logger");

class VectorContextTester {
  constructor() {
    this.vectorService = null;
    this.companyId = null;
  }

  /**
   * Initialize the vector context system for a company
   */
  async initializeForCompany(companyId) {
    try {
      this.companyId = companyId;
      this.vectorService = new VectorContextService(companyId);

      console.log(`🚀 Initializing vector context for company: ${companyId}`);
      await this.vectorService.initialize();

      console.log("✅ Vector context system initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize vector context:", error.message);
      return false;
    }
  }

  /**
   * Add sample business context to demonstrate the system
   */
  async addSampleBusinessContext() {
    try {
      console.log("📝 Adding sample business context...");

      // Add business information
      await this.vectorService.addBusinessContext({
        type: "business_info",
        content: `
          TechStart Solutions is a digital marketing agency specializing in helping small businesses 
          establish their online presence. We offer website development, social media management, 
          and digital advertising services. Our target market includes local businesses, startups, 
          and entrepreneurs looking to grow their digital footprint.
          
          Our unique value proposition is providing enterprise-level digital marketing solutions 
          at affordable prices for small businesses. We focus on ROI-driven strategies and 
          personalized service.
        `,
        importance: 10,
        category: "company_overview",
      });

      // Add customer information
      await this.vectorService.addCustomerContext({
        type: "customer_profile",
        content: `
          Our typical customers are:
          - Small business owners (10-50 employees)
          - Startups in their first 2 years
          - Local service providers (restaurants, salons, consultants)
          - E-commerce businesses starting out
          
          Common pain points:
          - Limited budget for marketing
          - Lack of technical expertise
          - Need for quick results
          - Time constraints
        `,
        importance: 9,
        category: "target_audience",
      });

      // Add product/service information
      await this.vectorService.addProductContext({
        type: "service_catalog",
        content: `
          Services offered:
          1. Website Development ($2,000-$5,000)
             - Responsive design
             - SEO optimization
             - Content management system
             - E-commerce integration
          
          2. Social Media Management ($500-$1,500/month)
             - Content creation
             - Platform management
             - Engagement monitoring
             - Analytics reporting
          
          3. Digital Advertising ($300-$2,000/month + ad spend)
             - Google Ads management
             - Facebook/Instagram ads
             - Campaign optimization
             - Performance tracking
        `,
        importance: 8,
        category: "services",
      });

      // Add conversation history
      await this.vectorService.addConversationContext({
        type: "customer_interaction",
        content: `
          Recent customer feedback:
          "TechStart helped us increase our online visibility by 300% in just 3 months. 
          Their team is responsive and really understands small business needs."
          
          Common questions from prospects:
          - How long does it take to see results?
          - Can you work within our budget?
          - Do you provide ongoing support?
          - What makes you different from other agencies?
        `,
        importance: 7,
        category: "customer_feedback",
      });

      console.log("✅ Sample business context added successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to add business context:", error.message);
      return false;
    }
  }

  /**
   * Test website generation with context
   */
  async testWebsiteGeneration() {
    try {
      console.log("🌐 Testing website generation with context...");

      const websiteChain = new WebsiteGenerationChain(this.companyId);
      const result = await websiteChain.generateWebsite({
        businessDescription:
          "Create a professional website for our digital marketing agency",
        templateType: "business",
        style: "modern",
        colorScheme: "blue-professional",
        sections: ["hero", "services", "about", "contact", "testimonials"],
      });

      console.log("✅ Website generated successfully");
      console.log(
        "📊 Context used:",
        result.contextUsed?.length || 0,
        "sources"
      );
      console.log(
        "🎯 Key insights:",
        result.contextInsights?.slice(0, 2) || []
      );

      return result;
    } catch (error) {
      console.error("❌ Website generation failed:", error.message);
      return null;
    }
  }

  /**
   * Test email generation with context
   */
  async testEmailGeneration() {
    try {
      console.log("📧 Testing email generation with context...");

      const emailChain = new EmailMarketingChain(this.companyId);
      const result = await emailChain.generateEmail({
        emailType: "promotional",
        targetAudience: "small business owners",
        campaignGoal: "promote our website development services",
        productService: "website development",
        tone: "professional",
      });

      console.log("✅ Email generated successfully");
      console.log(
        "📊 Context used:",
        result.contextUsed?.length || 0,
        "sources"
      );
      console.log("🎯 Email subject:", result.emailContent?.subject || "N/A");

      return result;
    } catch (error) {
      console.error("❌ Email generation failed:", error.message);
      return null;
    }
  }

  /**
   * Test chatbot response with context
   */
  async testChatbotResponse() {
    try {
      console.log("🤖 Testing chatbot response with context...");

      const chatbotChain = new ChatbotChain(this.companyId);
      const result = await chatbotChain.generateResponse({
        userMessage: "How much does a website cost and how long does it take?",
        conversationId: "test_conversation_001",
        intent: "inquiry",
      });

      console.log("✅ Chatbot response generated successfully");
      console.log(
        "📊 Context used:",
        result.contextUsed?.length || 0,
        "sources"
      );
      console.log(
        "🎯 Response preview:",
        result.response?.substring(0, 100) + "..." || "N/A"
      );

      return result;
    } catch (error) {
      console.error("❌ Chatbot response failed:", error.message);
      return null;
    }
  }

  /**
   * Analyze context effectiveness
   */
  async analyzeContextEffectiveness() {
    try {
      console.log("📈 Analyzing context effectiveness...");

      const stats = await this.vectorService.getContextStatistics();
      const patterns = await this.vectorService.extractBusinessPatterns();

      console.log("📊 Context Statistics:");
      console.log(`  - Total documents: ${stats.totalDocuments}`);
      console.log(`  - Categories: ${stats.categories?.length || 0}`);
      console.log(
        `  - Average importance: ${stats.averageImportance?.toFixed(2) || "N/A"}`
      );

      console.log("🎯 Business Patterns:");
      patterns.slice(0, 3).forEach((pattern, index) => {
        console.log(
          `  ${index + 1}. ${pattern.pattern} (confidence: ${pattern.confidence?.toFixed(2) || "N/A"})`
        );
      });

      return { stats, patterns };
    } catch (error) {
      console.error("❌ Context analysis failed:", error.message);
      return null;
    }
  }

  /**
   * Run complete test suite
   */
  async runCompleteTest(companyId) {
    console.log("🔬 Starting comprehensive vector context test...\n");

    // Initialize
    const initialized = await this.initializeForCompany(companyId);
    if (!initialized) return false;

    // Add context
    const contextAdded = await this.addSampleBusinessContext();
    if (!contextAdded) return false;

    console.log("\n🧪 Testing AI generation with context...\n");

    // Test all AI functions
    const websiteResult = await this.testWebsiteGeneration();
    console.log("");

    const emailResult = await this.testEmailGeneration();
    console.log("");

    const chatbotResult = await this.testChatbotResponse();
    console.log("");

    // Analyze effectiveness
    const analysis = await this.analyzeContextEffectiveness();
    console.log("");

    console.log("🎉 Vector context system test completed!");
    console.log("📋 Summary:");
    console.log(
      `  ✅ Website generation: ${websiteResult ? "Success" : "Failed"}`
    );
    console.log(`  ✅ Email generation: ${emailResult ? "Success" : "Failed"}`);
    console.log(
      `  ✅ Chatbot response: ${chatbotResult ? "Success" : "Failed"}`
    );
    console.log(`  ✅ Context analysis: ${analysis ? "Success" : "Failed"}`);

    return {
      websiteResult,
      emailResult,
      chatbotResult,
      analysis,
    };
  }
}

/**
 * Example usage and testing functions
 */
async function testWithExistingCompany() {
  // Find an existing company to test with
  const company = await Company.findOne();
  if (!company) {
    console.error("❌ No companies found. Please create a company first.");
    return;
  }

  const tester = new VectorContextTester();
  return await tester.runCompleteTest(company._id);
}

async function testWithNewCompany() {
  // Create a test company
  const testCompany = new Company({
    companyName: "Vector Test Company",
    email: "test@vectortest.com",
    businessType: "Technology",
    preferences: {
      communicationTone: "professional",
      brandStyle: "modern",
      colorScheme: "blue-professional",
    },
  });

  await testCompany.save();
  console.log(`📝 Created test company: ${testCompany._id}`);

  const tester = new VectorContextTester();
  const results = await tester.runCompleteTest(testCompany._id);

  // Clean up test company
  await Company.findByIdAndDelete(testCompany._id);
  console.log("🧹 Test company cleaned up");

  return results;
}

// Export for use in other scripts
module.exports = {
  VectorContextTester,
  testWithExistingCompany,
  testWithNewCompany,
};

// If run directly, execute test
if (require.main === module) {
  testWithExistingCompany().catch(console.error);
}
