const mongoose = require("mongoose");
const config = require("../config/env-config");
const { modelManager } = require("../services/langchain/models");

async function testOllamaFallback() {
  try {
    console.log("🔧 Testing Ollama to Gemini fallback mechanism...\n");

    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    console.log("✅ Connected to MongoDB");

    // Check available models
    const availableModels = modelManager.getAvailableModels();
    console.log("📋 Available models:", availableModels);

    if (availableModels.length === 0) {
      console.log("❌ No models available - check your API keys and services");
      return;
    }

    // Test model health
    console.log("\n🏥 Running health checks on all models:");
    const healthResults = await modelManager.healthCheck();

    for (const [model, result] of Object.entries(healthResults)) {
      const status = result.status === "healthy" ? "✅" : "❌";
      console.log(`${status} ${model}: ${result.status}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.responseTime) {
        console.log(`   Response time: ${result.responseTime}ms`);
      }
    }

    // Test fallback logic for different task types
    console.log("\n🎯 Testing task-specific model selection (basic):");
    const taskTypes = [
      "website_generation",
      "email_generation",
      "chatbot",
      "general",
    ];

    for (const taskType of taskTypes) {
      try {
        const selectedModel = modelManager.getBestModelForTask(taskType);
        console.log(`📝 ${taskType}: Selected model = ${selectedModel}`);

        // Test if the selected model actually works
        const testResult = await modelManager.testModel(selectedModel);
        const status = testResult.success ? "✅" : "❌";
        console.log(
          `   ${status} Test result: ${
            testResult.success ? "Working" : testResult.error
          }`
        );
      } catch (error) {
        console.log(`❌ ${taskType}: Error selecting model - ${error.message}`);
      }
    }

    // Test enhanced fallback logic with health checking
    console.log("\n🎯 Testing enhanced model selection (with health checks):");

    for (const taskType of taskTypes) {
      try {
        const selectedModel = await modelManager.getBestWorkingModelForTask(
          taskType
        );
        console.log(`📝 ${taskType}: Working model = ${selectedModel}`);
      } catch (error) {
        console.log(
          `❌ ${taskType}: No working model found - ${error.message}`
        );
      }
    }

    // Test actual invocation with enhanced fallback
    console.log("\n🚀 Testing actual model invocation with fallback:");

    try {
      // Try to get best working model for website generation
      const bestModel = await modelManager.getBestWorkingModelForTask(
        "website_generation"
      );
      console.log(`🎯 Using working model: ${bestModel}`);

      const response = await modelManager.invokeWithMetrics(
        bestModel,
        "Hello, please respond with a simple greeting.",
        {}
      );

      console.log("✅ Model invocation successful:");
      console.log(`   Model used: ${response.modelUsed}`);
      console.log(
        `   Original requested: ${response.originalModelRequested || "N/A"}`
      );
      console.log(`   Fallback used: ${response.fallbackUsed ? "Yes" : "No"}`);
      console.log(
        `   Emergency fallback: ${
          response.emergencyFallbackUsed ? "Yes" : "No"
        }`
      );
      console.log(`   Response: ${response.content}`);
      console.log(`   Duration: ${response.metrics.duration}ms`);
      console.log(`   Tokens: ${response.metrics.tokenUsage.total}`);
    } catch (error) {
      console.log(`❌ Model invocation failed: ${error.message}`);
    }

    // Test fallback behavior by requesting a model that might not work
    console.log(
      "\n🔄 Testing fallback by requesting potentially unavailable model:"
    );

    try {
      const response = await modelManager.invokeWithMetrics(
        "ollama-llama3", // This might fail if Ollama is down
        "Test prompt for fallback mechanism",
        {}
      );

      console.log("✅ Model invocation result:");
      console.log(`   Model used: ${response.modelUsed}`);
      console.log(
        `   Original requested: ${response.originalModelRequested || "N/A"}`
      );
      console.log(`   Fallback used: ${response.fallbackUsed ? "Yes" : "No"}`);
      console.log(
        `   Emergency fallback: ${
          response.emergencyFallbackUsed ? "Yes" : "No"
        }`
      );
      console.log(`   Response: ${response.content.substring(0, 100)}...`);
    } catch (error) {
      console.log(`❌ Even with fallback, invocation failed: ${error.message}`);
    }

    // Check environment configuration
    console.log("\n🔧 Environment Configuration:");
    console.log(`   Ollama URL: ${config.ollamaUrl}`);
    console.log(
      `   Gemini API Key: ${
        config.geminiApiKey ? "✅ Configured" : "❌ Missing"
      }`
    );

    // Test Ollama connectivity
    console.log("\n🔌 Testing Ollama connectivity:");
    try {
      const fetch = require("node-fetch");
      const response = await fetch(`${config.ollamaUrl}/api/tags`, {
        method: "GET",
        timeout: 5000,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Ollama is running and accessible");
        console.log(
          `   Available models: ${
            data.models?.map((m) => m.name).join(", ") || "None"
          }`
        );
      } else {
        console.log(`❌ Ollama responded with status: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Ollama not accessible: ${error.message}`);
      console.log("   This should trigger fallback to Gemini");
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

// Check if Ollama service is actually running
async function checkOllamaStatus() {
  console.log("🔍 Checking if Ollama service is running...");

  try {
    const { exec } = require("child_process");
    const util = require("util");
    const execPromise = util.promisify(exec);

    // Check if Ollama process is running
    const { stdout } = await execPromise("ps aux | grep ollama | grep -v grep");

    if (stdout.trim()) {
      console.log("✅ Ollama process is running");
      return true;
    } else {
      console.log("❌ Ollama process is not running");
      return false;
    }
  } catch (error) {
    console.log("❌ Ollama process is not running");
    return false;
  }
}

async function main() {
  console.log("🧪 Ollama Fallback Test Suite");
  console.log("=============================\n");

  await checkOllamaStatus();
  await testOllamaFallback();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testOllamaFallback, checkOllamaStatus };
