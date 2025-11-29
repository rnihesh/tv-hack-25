const mongoose = require("mongoose");
const config = require("../config/env-config");
const Company = require("../models/Company");

async function updateCompanyData() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("✅ Connected to MongoDB");

    // Get company ID from command line args or use default
    const companyId = process.argv[2] || "688cc1359378d060eb3d18dd";
    console.log(`Looking for company with ID: ${companyId}`);

    const company = await Company.findById(companyId);

    if (!company) {
      console.log("❌ Company not found");
      return;
    }

    console.log(`📋 Found company: ${company.companyName} (${company.email})`);
    console.log(
      `Current description: ${company.businessDescription || "undefined"}`
    );
    console.log(
      `Current target audience: ${company.targetAudience || "undefined"}`
    );

    // Only update if description is missing or placeholder
    if (
      !company.businessDescription ||
      company.businessDescription.length < 10
    ) {
      // Generate generic description based on business type
      const businessTypeDescriptions = {
        restaurant: `${company.companyName} is a modern ${company.businessType} offering high-quality dining experience with exceptional customer service.`,
        technology: `${company.companyName} is a technology company providing innovative solutions and exceptional service to our clients.`,
        retail: `${company.companyName} is a retail business committed to providing quality products and excellent customer service.`,
        service: `${company.companyName} is a service company dedicated to delivering professional solutions and outstanding customer experience.`,
        healthcare: `${company.companyName} is a healthcare provider committed to delivering quality care and exceptional patient service.`,
        education: `${company.companyName} is an educational institution dedicated to providing quality learning experiences.`,
        consulting: `${company.companyName} is a consulting firm providing expert advice and professional services to our clients.`,
        manufacturing: `${company.companyName} is a manufacturing company producing quality products with attention to detail.`,
        real_estate: `${company.companyName} is a real estate company helping clients with property needs and professional service.`,
        other: `${company.companyName} is a business committed to providing quality products/services and exceptional customer experience.`,
      };

      company.businessDescription =
        businessTypeDescriptions[company.businessType] ||
        businessTypeDescriptions.other;
    }

    // Only update if target audience is missing
    if (!company.targetAudience || company.targetAudience.length < 5) {
      company.targetAudience =
        "Individuals and businesses looking for quality products and services with professional expertise and excellent customer support.";
    }

    // Ensure preferences object exists with defaults
    if (!company.preferences) {
      company.preferences = {};
    }

    // Only set defaults if not already set
    if (!company.preferences.colorScheme)
      company.preferences.colorScheme = "blue";
    if (!company.preferences.brandStyle)
      company.preferences.brandStyle = "modern";
    if (!company.preferences.communicationTone)
      company.preferences.communicationTone = "professional";
    if (!company.preferences.contentStyle)
      company.preferences.contentStyle = "informative";

    // Update AI context profile with defaults
    if (!company.aiContextProfile) {
      company.aiContextProfile = {};
    }

    if (!company.aiContextProfile.businessPersonality) {
      company.aiContextProfile.businessPersonality = `Professional, reliable, and customer-focused. We take pride in our work and are committed to delivering quality ${company.businessType} services.`;
    }

    if (
      !company.aiContextProfile.keyMessages ||
      company.aiContextProfile.keyMessages.length === 0
    ) {
      company.aiContextProfile.keyMessages = [
        "Quality products/services",
        "Professional expertise",
        "Exceptional customer service",
        "Reliable and trustworthy",
        "Customer satisfaction focused",
      ];
    }

    if (!company.aiContextProfile.brandVoice) {
      company.aiContextProfile.brandVoice =
        "Professional, friendly, and knowledgeable - like talking to an expert who genuinely cares about helping you.";
    }

    await company.save();

    console.log("✅ Company data updated successfully!");
    console.log(`New description: ${company.businessDescription}`);
    console.log(`New target audience: ${company.targetAudience}`);
    console.log(`Preferences: ${JSON.stringify(company.preferences, null, 2)}`);
  } catch (error) {
    console.error("❌ Error updating company:", error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log("📤 Disconnected from MongoDB");
  }
}

updateCompanyData().catch(console.error);
