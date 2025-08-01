const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const cookieParser = require("cookie-parser");

// Internal imports
const connectDB = require("./config/db");
const config = require("./config/env-config");
const errorHandler = require("./middlewares/errorHandler");
const { httpLogger, logger } = require("./utils/logger");

// Route imports
const authRoutes = require("./routes/authRoutes");
const websiteRoutes = require("./routes/websiteRoutes");
const marketingRoutes = require("./routes/marketingRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");

const app = express();

// Connect to MongoDB
connectDB();

// Trust proxy (for rate limiting behind reverse proxy)
app.set("trust proxy", 1);

// HTTP request logging
app.use(httpLogger);

// Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS Configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, postman, etc.)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        config.corsOrigin,
        "http://localhost:3000",
        "http://localhost:5173",
        "https://localhost:5173",
      ];

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs || 15 * 60 * 1000, // 15 minutes
  max: config.rateLimitMax || 100, // 100 requests per window
  message: {
    success: false,
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);

// Body parsing middleware
app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: config.nodeEnv,
    version: process.env.npm_package_version || "1.0.0",
  });
});

// API status endpoint
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    message: "AI Digital Toolkit API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// API status endpoint
app.get("/api/status", (req, res) => {
  res.status(200).json({
    message: "AI Business Toolkit API is running",
    version: "1.0.0",
    environment: config.nodeEnv,
    features: {
      websiteGeneration: true,
      emailMarketing: true,
      imageGeneration: true,
      chatbot: true,
      feedbackAnalysis: true,
      vectorSearch: true,
    },
    models: {
      gemini: !!config.geminiApiKey,
      ollama: true, // Assuming local Ollama installation
    },
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/websites", websiteRoutes);
app.use("/api/marketing", marketingRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/feedback", feedbackRoutes);

// Stripe webhook endpoint (before JSON parsing middleware)
app.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  (req, res) => {
    // Stripe webhook handler will be implemented in payment controller
    console.log("Stripe webhook received");
    res.status(200).send("OK");
  }
);

// 404 handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: [
      "GET /api/status",
      "POST /api/auth/register",
      "POST /api/auth/login",
      "GET /api/websites",
      "POST /api/websites/generate",
      "GET /api/marketing/campaigns",
      "POST /api/marketing/email/generate",
      "POST /api/media/generate",
      "GET /api/chatbot/config",
      "POST /api/chatbot/chat",
      "POST /api/feedback/analyze",
    ],
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to AI-Driven Digital Toolkit API",
    documentation: "/api/status",
    version: "1.0.0",
  });
});

// Global error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.error("Unhandled Promise Rejection:", err.message);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
  process.exit(1);
});

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`
🚀 AI Business Toolkit Server is running!
📡 Port: ${PORT}
🌍 Environment: ${config.nodeEnv}
🗄️  Database: ${config.mongoUri.includes("localhost") ? "Local MongoDB" : "MongoDB Atlas"}
⚡ Features: Website Gen, Email Marketing, Image Gen, Chatbot, Analytics
🤖 AI Models: ${config.geminiApiKey ? "Gemini" : "Disabled"}, Ollama
📊 Vector Store: Chroma
🔒 Security: Helmet, CORS, Rate Limiting, Data Sanitization
  `);
});

module.exports = app;
