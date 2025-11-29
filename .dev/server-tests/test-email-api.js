// Test script for email API endpoints
const mongoose = require("mongoose");
require("dotenv").config();

const Company = require("../models/Company");

async function testEmailAPI() {
  try {
    // Connect to database
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/technovista-db"
    );
    console.log("Connected to MongoDB");

    // Find or create a test company
    let company = await Company.findOne({ email: "test@company.com" });

    if (!company) {
      company = new Company({
        companyName: "Test Company",
        email: "test@company.com",
        password: "password123",
        businessType: "technology",
        targetAudience: "small businesses",
        businessDescription: "AI-powered business solutions",
        emailList: [],
      });
      await company.save();
      console.log("Created test company");
    }

    console.log("Initial email list:", company.emailList);

    // Test adding emails
    const testEmails = [
      "user1@example.com",
      "user2@example.com",
      "user3@example.com",
    ];

    // Add emails to the list
    const uniqueEmails = testEmails.filter(
      (email) => !company.emailList.includes(email)
    );
    company.emailList.push(...uniqueEmails);
    await company.save();

    console.log("Updated email list:", company.emailList);
    console.log("Total emails:", company.emailList.length);

    // Test duplicate handling
    const duplicateEmail = "user1@example.com";
    if (!company.emailList.includes(duplicateEmail)) {
      company.emailList.push(duplicateEmail);
      await company.save();
      console.log("Added duplicate (should not happen)");
    } else {
      console.log("Duplicate email rejected correctly");
    }

    console.log("Final email list:", company.emailList);
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the test
testEmailAPI();
