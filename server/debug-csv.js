// Quick test to debug CSV parsing
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

async function testCSVParsing() {
  console.log("🔍 Testing CSV parsing...");

  const csvPath = path.join(__dirname, "../client/public/feedback.csv");
  console.log("📁 CSV Path:", csvPath);
  console.log("📝 File exists:", fs.existsSync(csvPath));

  if (!fs.existsSync(csvPath)) {
    console.log("❌ CSV file not found!");
    return;
  }

  const feedbackData = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(
        csv({
          skipEmptyLines: true,
          skipLinesWithError: true,
          separator: ", ",
          headers: false,
        })
      )
      .on("data", (row) => {
        console.log("📊 Raw row:", row);

        // Skip the header row
        if (row["0"] && row["0"].includes("Text, Sentiment, Source")) {
          console.log("⏭️ Skipping header row");
          return;
        }

        // Parse the malformed CSV manually
        const rowText = Object.values(row).join(", ");
        console.log("🔧 Combined text:", rowText);

        if (!rowText || rowText.length < 10) return;

        // Use regex to extract components from the combined string
        const match = rowText.match(
          /^"([^"]+)",\s*(\w+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([0-9.]+)/
        );

        if (match) {
          const [
            ,
            text,
            sentiment,
            source,
            datetime,
            userid,
            location,
            confidence,
          ] = match;

          const cleanRow = {
            text: text.trim(),
            sentiment: sentiment.toLowerCase().trim(),
            source: source.trim(),
            date: datetime.trim(),
            confidence: parseFloat(confidence),
            location: location.trim(),
          };

          console.log("✅ Cleaned row:", cleanRow);
          feedbackData.push(cleanRow);
        } else {
          console.log("❌ No match found for:", rowText.substring(0, 100));
        }

        // Stop after first few rows for debugging
        if (feedbackData.length >= 5) {
          console.log("🛑 Stopping after 5 rows for debugging");
          resolve();
        }
      })
      .on("end", () => {
        console.log("📋 Total rows processed:", feedbackData.length);
        resolve();
      })
      .on("error", (error) => {
        console.error("❌ CSV parsing error:", error);
        reject(error);
      });
  });

  console.log("📊 Final data sample:");
  console.log(JSON.stringify(feedbackData.slice(0, 3), null, 2));

  // Test sentiment distribution
  const sentimentDist = feedbackData.reduce((acc, item) => {
    acc[item.sentiment] = (acc[item.sentiment] || 0) + 1;
    return acc;
  }, {});

  console.log("📈 Sentiment distribution:", sentimentDist);
}

testCSVParsing().catch(console.error);
