// Test script to verify CSV analysis endpoint works
const axios = require("axios");

async function testQuickCSVAnalysis() {
  try {
    console.log("⚡ Testing QUICK CSV analysis endpoint...");

    const startTime = Date.now();

    // Test the quick analyze endpoint
    const response = await axios.post(
      "http://localhost:3000/api/csv-feedback/quick-analyze",
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    console.log("✅ Response received:");
    console.log("Status:", response.status);
    console.log("⏱️ Processing Time:", processingTime + "ms");
    console.log("📊 Analysis Preview:");
    console.log(response.data.data.analysis.substring(0, 500) + "...");
    console.log("\n📈 Metrics:", response.data.data.metrics);
  } catch (error) {
    console.error("❌ Error testing quick CSV analysis:");

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.message);
    } else {
      console.error("Request error:", error.message);
    }
  }
}

async function testCSVAnalysis() {
  try {
    console.log("🧪 Testing FULL CSV analysis endpoint...");

    // Test the analyze public CSV endpoint
    const response = await axios.post(
      "http://localhost:3000/api/csv-feedback/analyze-public-csv",
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Response received:");
    console.log("Status:", response.status);
    console.log("Data:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("❌ Error testing CSV analysis:");

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.message);
    } else {
      console.error("Request error:", error.message);
    }
  }
}

// Test if server is running
async function testServerHealth() {
  try {
    const response = await axios.get("http://localhost:3000/health");
    console.log("✅ Server is running");
    return true;
  } catch (error) {
    console.log("❌ Server is not running or no health endpoint");
    return false;
  }
}

async function main() {
  console.log("🚀 Starting CSV analysis performance test...\n");

  const serverRunning = await testServerHealth();
  if (!serverRunning) {
    console.log("Please start the server first with: npm start");
    return;
  }

  console.log("🏃‍♂️ Testing QUICK analysis (for presentations):");
  await testQuickCSVAnalysis();

  console.log("\n" + "=".repeat(50));
  console.log("🐌 Testing FULL analysis (with LLM processing):");
  console.log("Note: This will be much slower...");
  // Uncomment to test full analysis
  // await testCSVAnalysis();
}

main();
