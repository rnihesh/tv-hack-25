const mongoose = require("mongoose");
const Company = require("../models/Company");
require("dotenv").config();

const fixFeedbackAnalysisData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Find all companies with feedback_analysis entries
    const companies = await Company.find({
      "credits.creditHistory.service": "feedback_analysis",
    });

    console.log(
      `Found ${companies.length} companies with feedback_analysis entries`
    );

    for (const company of companies) {
      console.log(
        `Processing company: ${company.companyName} (${company.email})`
      );

      // Count feedback_analysis entries before fixing
      const beforeCount = company.credits.creditHistory.filter(
        (entry) => entry.service === "feedback_analysis"
      ).length;

      console.log(`  - Found ${beforeCount} feedback_analysis entries`);

      // Update each feedback_analysis entry to a valid service type
      company.credits.creditHistory.forEach((entry) => {
        if (entry.service === "feedback_analysis") {
          // Change feedback_analysis to chatbot as they're similar services
          entry.service = "chatbot";
          if (entry.description && !entry.description.includes("feedback")) {
            entry.description = `Feedback analysis (${
              entry.description || "processed"
            })`;
          } else if (!entry.description) {
            entry.description = "Feedback analysis";
          }
        }
      });

      // Save the updated company
      await company.save();

      const afterCount = company.credits.creditHistory.filter(
        (entry) => entry.service === "feedback_analysis"
      ).length;

      console.log(
        `  - Fixed! feedback_analysis entries remaining: ${afterCount}`
      );
    }

    console.log("Successfully fixed all feedback_analysis entries");
    process.exit(0);
  } catch (error) {
    console.error("Error fixing feedback_analysis data:", error);
    process.exit(1);
  }
};

// Run the fix
fixFeedbackAnalysisData();
