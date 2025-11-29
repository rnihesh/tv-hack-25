const mongoose = require("mongoose");
const config = require("../config/env-config");
const { processMessage } = require("../controllers/chatbotController");
const demoAuth = require("../middlewares/demoAuth");

async function testFullChatbotFlow() {
  try {
    console.log("🤖 Testing full chatbot flow...");
    await mongoose.connect(config.mongoUri);
    console.log("✅ Connected to MongoDB");

    // Simulate a complete request/response cycle
    const req = {
      body: {
        message: "Hello, can you tell me about your services?",
        sessionId: "test-session-" + Date.now(),
      },
    };

    let responseData = null;
    let statusCode = 200;

    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            responseData = data;
            console.log(`📤 Response ${code}:`, JSON.stringify(data, null, 2));
            return res;
          },
        };
      },
      json: (data) => {
        responseData = data;
        console.log("📤 Response 200:", JSON.stringify(data, null, 2));
        return res;
      },
    };

    // Apply demoAuth middleware
    demoAuth(req, res, () => {
      console.log("✅ demoAuth middleware applied");
    });

    console.log("📋 Request data:");
    console.log(`- Message: ${req.body.message}`);
    console.log(`- Session ID: ${req.body.sessionId}`);
    console.log(`- Company ID: ${req.company.id}`);

    // Call the processMessage controller
    console.log("🔄 Processing chatbot message...");
    await processMessage(req, res);

    if (statusCode === 200 && responseData?.success) {
      console.log("🎉 Chatbot flow completed successfully!");
    } else {
      console.log("❌ Chatbot flow failed");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await mongoose.disconnect();
    console.log("📤 Disconnected from MongoDB");
  }
}

testFullChatbotFlow().catch(console.error);
