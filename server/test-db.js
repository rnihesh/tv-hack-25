const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Try to find .env in parent directory if not in current directory
if (!process.env.DBURL && !process.env.MONGO_URI) {
  const parentEnvPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(parentEnvPath)) {
    require("dotenv").config({ path: parentEnvPath });
    console.log("Loaded .env from parent directory");
  }
}

const mongoUri = process.env.DBURL || process.env.MONGO_URI;

if (!mongoUri) {
  console.error("ERROR: MongoDB connection string not found!");
  console.error(
    "Please make sure you have either DBURL or MONGO_URI defined in your .env file."
  );
  console.error("\nExample .env entries:");
  console.error("DBURL=mongodb://localhost:27017/ai-business-toolkit");
  console.error("# or");
  console.error("MONGO_URI=mongodb://localhost:27017/ai-business-toolkit");
  process.exit(1);
}

console.log(
  "Testing MongoDB connection to:",
  mongoUri.replace(
    /mongodb(\+srv)?:\/\/([^:]+:)?([^@]+@)?([^/]+)\/(.+)/,
    "mongodb$1://user:****@$4/$5"
  )
);

mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log("MongoDB connected successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
