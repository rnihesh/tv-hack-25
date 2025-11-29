const mongoose = require("mongoose");
const Company = require("../models/Company");
const { vectorContextService } = require("../services/langchain/vectorContext");
const {
  memoryVectorStore,
} = require("../services/langchain/memoryVectorStore");
require("dotenv").config();

async function cleanupAndReseedContext() {
  try {
    await mongoose.connect(process.env.DBURL || process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // 1. Clear ALL existing vector collections to remove contamination
    console.log("\n🧹 Clearing all existing vector collections...");
    memoryVectorStore.collections.clear();
    console.log("✅ All vector collections cleared");

    // 2. Initialize vector context service
    console.log("\n🔧 Initializing vector context service...");
    await vectorContextService.initialize();
    console.log("✅ Vector context service initialized");

    // 3. Get all companies
    const companies = await Company.find({}).select(
      "companyName businessType businessDescription targetAudience preferences email"
    );
    console.log(`\n📊 Found ${companies.length} companies to re-seed`);

    // 4. Re-seed each company with their ACTUAL data
    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      console.log(
        `\n${i + 1}. Processing: ${company.companyName} (${company.email})`
      );

      try {
        const contextData = {
          companyName: company.companyName,
          businessType: company.businessType,
          businessDescription:
            company.businessDescription ||
            `${company.companyName} is a ${company.businessType} business`,
          targetAudience:
            company.targetAudience ||
            `Customers interested in ${company.businessType} services`,
          preferences: company.preferences || {},
        };

        console.log(
          `   📝 Seeding context with: ${JSON.stringify(contextData, null, 2)}`
        );

        const docCount = await vectorContextService.seedCompanyContext(
          company._id,
          contextData
        );

        console.log(
          `   ✅ Seeded ${docCount} documents for ${company.companyName}`
        );

        // Verify the context was stored correctly
        const verifyContext = await vectorContextService.getCompanyContext(
          company._id
        );
        console.log(
          `   ✔️ Verification: Company name in context = "${verifyContext.companyInfo.name}"`
        );

        if (verifyContext.companyInfo.name !== company.companyName) {
          console.error(
            `   ❌ ERROR: Context name mismatch! Expected "${company.companyName}", got "${verifyContext.companyInfo.name}"`
          );
        }
      } catch (error) {
        console.error(
          `   ❌ Error seeding context for ${company.companyName}:`,
          error.message
        );
      }
    }

    // 5. Final verification - test context isolation
    console.log("\n🔍 Testing context isolation...");
    for (let i = 0; i < Math.min(3, companies.length); i++) {
      const company = companies[i];
      const context = await vectorContextService.getCompanyContext(company._id);
      console.log(
        `   Company: ${company.companyName} -> Context name: "${context.companyInfo.name}"`
      );

      if (context.companyInfo.name !== company.companyName) {
        console.error(`   ❌ ISOLATION FAILURE for ${company.companyName}!`);
      } else {
        console.log(
          `   ✅ Context properly isolated for ${company.companyName}`
        );
      }
    }

    console.log("\n🎉 Context cleanup and re-seeding completed!");

    // Show memory store status
    console.log("\n📋 Final memory store status:");
    console.log(`Total collections: ${memoryVectorStore.collections.size}`);
    for (const [
      collectionName,
      collection,
    ] of memoryVectorStore.collections.entries()) {
      console.log(
        `  ${collectionName}: ${collection.documents.length} documents`
      );
    }
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

cleanupAndReseedContext().catch(console.error);
