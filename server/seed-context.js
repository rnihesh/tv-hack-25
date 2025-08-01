const mongoose = require("mongoose");
const config = require("./config/env-config");
const Company = require("./models/Company");
const { vectorContextService } = require("./services/langchain/vectorContext");

async function seedCompanyContext() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("✅ Connected to MongoDB");

    // Initialize vector service
    await vectorContextService.initialize();
    console.log("✅ Vector context service initialized");

    const companyId = "688cc1359378d060eb3d18dd";
    const company = await Company.findById(companyId);

    if (!company) {
      console.log("❌ Company not found");
      return;
    }

    console.log(`📋 Seeding context for: ${company.companyName}`);

    // Prepare comprehensive business data
    const businessData = {
      companyName: company.companyName,
      businessType: company.businessType,
      businessDescription: company.businessDescription,
      targetAudience: company.targetAudience,
      preferences: company.preferences,
      aiContextProfile: company.aiContextProfile,
    };

    console.log("📝 Seeding business context...");

    // Seed the context with this business data
    const docsAdded = await vectorContextService.seedCompanyContext(
      companyId,
      businessData
    );
    console.log(`✅ Seeded ${docsAdded} documents for company context`);

    // Add additional company-specific context based on business type and services
    if (
      company.aiContextProfile?.productServices &&
      company.aiContextProfile.productServices.length > 0
    ) {
      for (const service of company.aiContextProfile.productServices) {
        await vectorContextService.addDocumentToContext(
          companyId,
          `${company.companyName} offers: ${service.name} - ${service.description}`,
          {
            source: "business_specialties",
            type: "products_services",
            importance: 9,
            timestamp: new Date().toISOString(),
          }
        );
      }
    }

    // Add business processes and methods if available
    if (company.aiContextProfile?.businessPersonality) {
      await vectorContextService.addDocumentToContext(
        companyId,
        `Business approach: ${company.aiContextProfile.businessPersonality}`,
        {
          source: "business_methods",
          type: "business_process",
          importance: 8,
          timestamp: new Date().toISOString(),
        }
      );
    }

    // Add brand voice and communication style
    if (company.aiContextProfile?.brandVoice) {
      await vectorContextService.addDocumentToContext(
        companyId,
        `Communication style: ${company.aiContextProfile.brandVoice}`,
        {
          source: "brand_voice",
          type: "business_environment",
          importance: 7,
          timestamp: new Date().toISOString(),
        }
      );
    }

    console.log("✅ Added additional company-specific context");

    // Test context retrieval
    console.log("🔍 Testing context retrieval...");
    const testContext = await vectorContextService.getContextForPrompt(
      companyId,
      `create a website for our ${company.businessType} business`,
      "website_generation"
    );

    console.log("📄 Retrieved context preview:");
    console.log(testContext.substring(0, 500) + "...");
  } catch (error) {
    console.error("❌ Error seeding context:", error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log("📤 Disconnected from MongoDB");
  }
}

seedCompanyContext().catch(console.error);
