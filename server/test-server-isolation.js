const fetch = require("node-fetch");

async function testServerContextIsolation() {
  try {
    console.log("🧪 Testing server context isolation...");

    // Test different companies to ensure they get their own content
    const testCases = [
      {
        companyId: "688cc18594cd2eb689bcd31b", // Mahesh - restaurant
        expectedName: "Mahesh",
        type: "restaurant",
      },
      {
        companyId: "688ccb4bb00bbbedae825b93", // Test Company - technology
        expectedName: "Test Company",
        type: "technology",
      },
    ];

    for (const testCase of testCases) {
      console.log(`\n📋 Testing ${testCase.expectedName} (${testCase.type})`);

      const response = await fetch(
        "http://localhost:5000/api/websites/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${testCase.companyId}`, // Mock token
          },
          body: JSON.stringify({
            prompt: `Create a simple business website for our ${testCase.type} company`,
            templateType: "business",
            style: "modern",
            colorScheme: "blue",
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const content = data.data?.htmlContent || "";

        const hasCorrectName = content
          .toLowerCase()
          .includes(testCase.expectedName.toLowerCase());
        const hasNiheshPizza = content.toLowerCase().includes("nihesh pizza");

        console.log(`   ✅ Response received: ${response.status}`);
        console.log(
          `   ✅ Contains "${testCase.expectedName}": ${hasCorrectName}`
        );
        console.log(
          `   ${hasNiheshPizza ? "❌" : "✅"} ${
            hasNiheshPizza
              ? 'Contains "Nihesh Pizza" contamination!'
              : "No contamination detected"
          }`
        );

        if (hasCorrectName && !hasNiheshPizza) {
          console.log(`   🎉 ${testCase.expectedName} test PASSED!`);
        } else {
          console.log(`   ❌ ${testCase.expectedName} test FAILED!`);
        }
      } else {
        console.log(
          `   ❌ Server responded with: ${response.status} ${response.statusText}`
        );
      }
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testServerContextIsolation();
