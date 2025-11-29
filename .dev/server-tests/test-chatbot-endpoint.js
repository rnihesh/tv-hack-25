const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const config = require("../config/env-config");

// Import the chatbot routes and middleware
const chatbotRoutes = require("../routes/chatbotRoutes");

async function testChatbotEndpoint() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(config.mongoUri);
    console.log("Connected successfully");

    // Create a simple express app for testing
    const app = express();
    app.use(bodyParser.json());
    app.use("/api/chatbot", chatbotRoutes);

    const port = 3001; // Different port to avoid conflicts
    const server = app.listen(port, () => {
      console.log(`Test server running on port ${port}`);
    });

    // Give the server a moment to start
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test the chatbot endpoint
    const testMessage = {
      message: "Hello, can you tell me about your services?",
      sessionId: "test-session-123",
    };

    console.log("Testing chatbot endpoint...");
    console.log("Sending message:", testMessage);

    // Use fetch to test the endpoint
    const response = await fetch(
      `http://localhost:${port}/api/chatbot/message`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testMessage),
      }
    );

    const result = await response.json();
    console.log("Response status:", response.status);
    console.log("Response:", JSON.stringify(result, null, 2));

    // Close the server
    server.close();
    await mongoose.connection.close();
    console.log("Test completed");
  } catch (error) {
    console.error("Test failed:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

testChatbotEndpoint();
