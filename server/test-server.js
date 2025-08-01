const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Basic middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
}));

app.use(express.json());

// Simple auth middleware bypass for testing
const mockAuthMiddleware = (req, res, next) => {
  req.companyData = {
    _id: "test-company-id",
    email: "test@company.com",
    businessInfo: {
      businessName: "Test Company",
      businessType: "Technology",
      description: "Test company for development"
    },
    preferences: {
      communicationTone: "professional"
    },
    credits: {
      currentCredits: 100
    },
    usage: {},
    hasCredits: () => true,
    deductCredits: async () => true,
    save: async () => true
  };
  next();
};

// Import email routes with mock auth
const emailRoutes = require("./routes/testEmailRoutes");

// Replace auth middleware with mock for all email routes
app.use("/api/email", emailRoutes);

// Test endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    message: "Server is running for email testing",
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Test Server running on port ${PORT}`);
  console.log(`📧 Email endpoints available at http://localhost:${PORT}/api/email`);
});

module.exports = app;
