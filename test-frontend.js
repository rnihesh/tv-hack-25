// Test script to simulate website generation
const testWebsiteGeneration = async () => {
  const formData = {
    prompt:
      "We are a modern coffee shop that serves artisanal coffee and pastries",
    templateType: "business",
    style: "modern",
    colorScheme: "blue",
    sections: [],
    requirements: "",
    siteName: "",
    autoDeploy: false,
  };

  try {
    const response = await fetch(
      "http://localhost:3000/api/websites/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer dummy-jwt-token-for-testing",
        },
        body: JSON.stringify(formData),
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Website generation successful!");
      console.log("Website ID:", data.data.websiteId);
      console.log("Credits used:", data.data.creditsUsed);
      console.log("Remaining credits:", data.data.remainingCredits);
      console.log("HTML content length:", data.data.htmlContent.length);
    } else {
      console.error("❌ Website generation failed:", data.message);
    }
  } catch (error) {
    console.error("❌ Network error:", error.message);
  }
};

console.log("🧪 Testing website generation...");
testWebsiteGeneration();
