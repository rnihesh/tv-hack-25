const mongoose = require("mongoose");
const Company = require("../models/Company");
const {
  WebsiteGenerationChain,
} = require("../services/langchain/contextualChains");
const { vectorContextService } = require("../services/langchain/vectorContext");
require("dotenv").config();

async function testWebsiteGeneration() {
  try {
    await mongoose.connect(process.env.DBURL || process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Initialize vector context service
    await vectorContextService.initialize();
    console.log("Vector context service initialized");

    // Get the first 3 companies to test
    const companies = await Company.find({}).limit(3);
    console.log(
      `\n🧪 Testing website generation for ${companies.length} companies:`
    );

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      console.log(
        `\n${i + 1}. Testing: ${company.companyName} (${company.businessType})`
      );

      try {
        // Test the context first
        const context = await vectorContextService.getCompanyContext(
          company._id
        );
        console.log(
          `   📋 Context company name: "${context.companyInfo.name}"`
        );
        console.log(
          `   📋 Context business type: "${context.companyInfo.businessType}"`
        );

        // Generate a simple website
        const websiteChain = new WebsiteGenerationChain();
        const prompt =
          "Create a professional website for our business with home, about, and contact sections";

        console.log(`   🚀 Generating website...`);
        const startTime = Date.now();

        const result = await websiteChain.generateWebsite(company._id, prompt, {
          templateType: "business",
          style: company.preferences?.brandStyle || "modern",
          colorScheme: company.preferences?.colorScheme || "blue",
          sections: ["hero", "about", "services", "contact"],
        });

        const duration = Date.now() - startTime;
        console.log(`   ⏱️ Generation took: ${duration}ms`);
        console.log(`   📊 Model used: ${result.modelUsed}`);
        console.log(
          `   📊 Content length: ${result.content.length} characters`
        );
        console.log(`   📊 Context used: ${result.contextUsed ? "Yes" : "No"}`);

        // Check for company name in the generated content
        const companyNameInContent = result.content
          .toLowerCase()
          .includes(company.companyName.toLowerCase());
        const pizzaInContent = result.content
          .toLowerCase()
          .includes("nihesh pizza");

        console.log(
          `   ✅ Company name "${company.companyName}" found in content: ${companyNameInContent}`
        );
        if (pizzaInContent && company.companyName !== "Nihesh Pizza") {
          console.log(`   ❌ ERROR: "Nihesh Pizza" contamination detected!`);
        } else {
          console.log(`   ✅ No cross-contamination detected`);
        }

        // Show a snippet of the generated content (first 200 chars)
        const snippet = result.content.substring(0, 200).replace(/\n/g, " ");
        console.log(`   📖 Content preview: ${snippet}...`);
      } catch (error) {
        console.error(
          `   ❌ Error testing ${company.companyName}:`,
          error.message
        );
      }
    }

    console.log("\n🎯 Website generation test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

testWebsiteGeneration().catch(console.error);
