const mongoose = require("mongoose");
const config = require("./config/env-config");
const { generateWebsite } = require("./controllers/websiteController");

async function testWebsiteGeneration() {
  try {
    console.log("🧪 Testing website generation with Ollama fallback...\n");

    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    console.log("✅ Connected to MongoDB");

    // Find test company
    const Company = require("./models/Company");
    const testCompanyId = "688cc1359378d060eb3d18dd";
    const company = await Company.findById(testCompanyId);

    if (!company) {
      console.log("❌ Test company not found");
      return;
    }

    console.log(`📊 Company: ${company.companyName} (${company.businessType})`);
    console.log(`💰 Credits available: ${company.credits}`);

    // Test website generation request with proper middleware simulation
    const testRequest = {
      body: {
        prompt:
          "Create a modern coffee shop website with menu and contact info",
        templateType: "business",
        style: "modern",
        colorScheme: "warm",
        sections: ["hero", "menu", "contact"],
      },
      company: {
        id: testCompanyId,
      },
      companyData: company, // This is what the controller expects
    };

    const testResponse = {
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        console.log(`\n📤 Response (${this.statusCode}):`);
        console.log(JSON.stringify(data, null, 2));
        return this;
      },
    };

    console.log("\n🚀 Starting website generation...");
    console.log("Request prompt:", testRequest.body.prompt);

    await generateWebsite(testRequest, testResponse);

    // Check company credits after generation
    const updatedCompany = await Company.findById(testCompanyId);
    console.log(`\n💰 Credits after generation: ${updatedCompany.credits}`);
    console.log(
      `📊 Credit usage: ${company.credits - updatedCompany.credits} credits`
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

if (require.main === module) {
  testWebsiteGeneration().catch(console.error);
}

module.exports = { testWebsiteGeneration };
