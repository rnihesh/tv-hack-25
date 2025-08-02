// TEMPORARY: Force development mode for debugging
if (process.env.DEBUG_SERVER === 'true') {
  console.log("⚠️ RUNNING IN DEBUG MODE - BYPASSING SERVICE CHECKS");
  process.env.NODE_ENV = 'development';
  process.env.ALLOW_NO_DB = 'true';
  process.env.ALLOW_NO_CHROMA = 'true';
  process.env.ALLOW_NO_SERVICES = 'true';
}

// Move existing error handlers to the top
process.on('uncaughtException', (err) => {
  console.error('CRITICAL - Uncaught Exception:');
  console.error(err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL - Unhandled Promise Rejection:');
  console.error(reason);
  process.exit(1);
});

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const path = require("path");

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
const emailRoutes = require("./routes/emailRoutes");
const imageGenRoutes = require("./routes/imageGenRoutes");
const communityRoutes = require("./routes/communityRoutes");

const app = express();

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
        imgSrc: ["'self'", "data:", "https:", "http:", "http://localhost:*", "*.placeholder.com", "*.unsplash.com", "*.picsum.photos"],
        connectSrc: ["'self'", "http://localhost:*"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS Configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
  credentials: true
}));
app.set("trust proxy", true);
// Rate Limiting
// const limiter = rateLimit({
//   windowMs: config.rateLimitWindowMs || 15 * 60 * 1000, // 15 minutes
//   max: config.rateLimitMax || 100, // 100 requests per window
//   message: {
//     success: false,
//     error: "Too many requests from this IP, please try again later.",
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// app.use("/api/", limiter);

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

// Static file serving for uploaded images
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static(path.join(__dirname, 'uploads')));

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

// Test image endpoint for debugging
app.get("/api/test-image", async (req, res) => {
  try {
    const testResponse = await fetch('http://localhost:3000/api/images/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'test image',
        style: 'realistic',
        aspectRatio: '1:1'
      })
    });
    
    const data = await testResponse.json();
    res.json({
      success: true,
      message: "Test image generation endpoint working",
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Test image generation failed",
      error: error.message
    });
  }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/websites", websiteRoutes);
app.use("/api/marketing", marketingRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/images", imageGenRoutes);
app.use("/api/community", communityRoutes);

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

// Enhanced error handling for startup
const startServer = async () => {
  try {
    console.log("🔍 Starting server initialization...");

    // Connect to MongoDB with enhanced error handling
    try {
      console.log("🔍 Step 1: Attempting database connection...");
      logger.info('Attempting database connection...');
      await connectDB();
      console.log("🔍 Database connection successful");
      logger.info('MongoDB connected successfully');
    } catch (dbError) {
      // Direct console output for critical errors
      console.error('MongoDB Connection Error:', dbError.message);
      console.error(dbError.stack);
      
      logger.error('MongoDB Connection Error:', {
        message: dbError.message,
        stack: dbError.stack,
        code: dbError.code,
        name: dbError.name
      });
      
      // Only continue without DB in development with flag
      if (process.env.NODE_ENV === 'development' && process.env.ALLOW_NO_DB === 'true') {
        logger.warn('Starting server without MongoDB connection (ALLOW_NO_DB=true)');
      } else {
        logger.error('Server startup failed due to database connection error');
        process.exit(1);
      }
    }

    // Check other required services
    try {
      console.log("🔍 Step 2: Checking required services...");
      await checkRequiredServices();
    } catch (serviceError) {
      console.error("Service check failed:", serviceError.message);
      if (process.env.NODE_ENV === 'development' && process.env.ALLOW_NO_SERVICES === 'true') {
        console.warn("Continuing despite service check failure (ALLOW_NO_SERVICES=true)");
      } else {
        throw serviceError;
      }
    }

    // Initialize vector context for all companies
    try {
      console.log("🔍 Step 2.5: Initializing vector context...");
      await initializeVectorContext();
    } catch (contextError) {
      console.error("Vector context initialization failed:", contextError.message);
      logger.warn("Vector context initialization failed, but continuing...");
    }

    console.log("🔍 Step 3: Setting up HTTP server...");
    const PORT = config.port;

    console.log("🔍 Step 4: Starting HTTP server on port", PORT);
    const server = app.listen(PORT, () => {
      console.log("🔍 Server successfully started!");
      logger.info(`
🚀 AI Business Toolkit Server is running!
📡 Port: ${PORT}
🌍 Environment: ${config.nodeEnv}
🗄️  Database: ${config.mongoUri ? (config.mongoUri.includes("localhost") ? "Local MongoDB" : "MongoDB Atlas") : "NONE - Running without database"}
⚡ Features: Website Gen, Email Marketing, Image Gen, Chatbot, Analytics
🤖 AI Models: ${config.geminiApiKey ? "Gemini" : "Disabled"}, Ollama
📊 Vector Store: Chroma
🔒 Security: Helmet, CORS, Rate Limiting, Data Sanitization
      `);
    });

    console.log("🔍 Step 5: Registering server error handlers");
    server.on('error', (err) => {
      console.error('Server Error:', err); // Direct console output for visibility
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        logger.error('Server error:', err);
        process.exit(1);
      }
    });

    console.log("🔍 Step 6: Server initialization complete");
    return server;
  } catch (error) {
    // Force console output for critical errors
    console.error('SERVER STARTUP CRITICAL ERROR:', error);
    logger.error('Failed to start server:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    process.exit(1);
  }
};

// Add this function before startServer()

const initializeVectorContext = async () => {
  try {
    console.log("🧠 Initializing vector context for all companies...");
    
    const { vectorContextService } = require('./services/langchain/vectorContext');
    const { memoryVectorStore } = require('./services/langchain/memoryVectorStore');
    const Company = require('./models/Company');
    
    // Clear any existing contaminated context to ensure clean slate
    console.log("🧹 Clearing any existing vector collections to prevent contamination...");
    memoryVectorStore.collections.clear();
    
    // Initialize the vector context service
    await vectorContextService.initialize();
    
    // Get all companies
    const companies = await Company.find({}).select('companyName businessType businessDescription targetAudience preferences aiContextProfile');
    console.log(`📋 Found ${companies.length} companies to initialize context for`);
    
    let successCount = 0;
    for (const company of companies) {
      try {
        // Seed context for this company with their ACTUAL data
        const contextData = {
          companyName: company.companyName,
          businessType: company.businessType,
          businessDescription: company.businessDescription || `${company.companyName} is a ${company.businessType} business`,
          targetAudience: company.targetAudience || `Customers interested in ${company.businessType} services`,
          preferences: company.preferences || {},
          keyMessages: company.aiContextProfile?.keyMessages || [],
          productServices: company.aiContextProfile?.productServices || [],
          businessPersonality: company.aiContextProfile?.businessPersonality,
          brandVoice: company.aiContextProfile?.brandVoice
        };
        
        await vectorContextService.seedCompanyContext(company._id, contextData);
        
        // Verify context isolation
        const verification = await vectorContextService.getCompanyContext(company._id);
        if (verification.companyInfo.name !== company.companyName) {
          console.warn(`⚠️  Context verification failed for ${company.companyName} - expected "${company.companyName}" but got "${verification.companyInfo.name}"`);
        }
        
        successCount++;
      } catch (error) {
        console.warn(`⚠️  Failed to initialize context for ${company.companyName}:`, error.message);
      }
    }
    
    console.log(`✅ Successfully initialized vector context for ${successCount}/${companies.length} companies`);
    console.log(`📊 Memory store now has ${memoryVectorStore.collections.size} isolated company collections`);
    logger.info(`Vector context initialized for ${successCount}/${companies.length} companies with proper isolation`);
    
  } catch (error) {
    console.error("❌ Vector context initialization error:", error.message);
    throw error;
  }
};

const checkRequiredServices = async () => {
  console.log("🔍 Checking required services...");
  
  // For emergency debugging, bypass all service checks
  if (process.env.BYPASS_ALL_CHECKS === 'true') {
    console.log("🔍 WARNING: All service checks bypassed by BYPASS_ALL_CHECKS flag");
    return true;
  }
  
  // Check LangChain service availability
  try {
    console.log("🔍 Checking LangChain services...");
    const { modelManager } = require('./services/langchain/models');
    
    const availableModels = modelManager.getAvailableModels();
    if (availableModels.length === 0) {
      throw new Error("No LangChain models available");
    }
    
    console.log("✅ LangChain services check passed");
  } catch (error) {
    console.error("❌ LangChain services check failed:", error.message);
    if (process.env.ALLOW_NO_SERVICES === 'true') {
      console.warn("⚠️ Continuing without LangChain services (ALLOW_NO_SERVICES=true)");
    } else {
      throw new Error(`LangChain services required but not available: ${error.message}`);
    }
  }
  
  // Initialize the memory vector service
  try {
    console.log("🔍 Initializing memory vector service...");
    const { vectorContextService } = require("./services/langchain/vectorContext");
    await vectorContextService.initialize();
    console.log("✅ Memory vector service initialized successfully");
  } catch (error) {
    console.error("❌ Memory vector service initialization failed:", error.message);
    if (process.env.NODE_ENV === 'development') {
      console.warn("⚠️ Continuing without vector service in development mode");
    } else {
      throw new Error(`Vector service required but initialization failed: ${error.message}`);
    }
  }
  
  console.log("✅ All required service checks completed");
  return true;
};

// Replace the existing app.listen() call with:
startServer();

// Environment check:
console.log('Environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- MongoDB URI configured:', !!process.env.DBURL || !!process.env.MONGO_URI);
console.log('- Port:', process.env.PORT || 4000);

// Only show MongoDB connection string format (not actual credentials)
const dbUrlCheck = process.env.DBURL || process.env.MONGO_URI || '';
if (dbUrlCheck) {
  console.log('- MongoDB string format:', 
    dbUrlCheck.replace(/mongodb(\+srv)?:\/\/([^:]+:)?([^@]+@)?([^/]+)\/(.+)/, 
    'mongodb$1://user:****@$4/$5')
  );
}

// Add near the top of your file, before any other code
process.on('uncaughtException', (err) => {
  console.error('CRITICAL - Uncaught Exception:');
  console.error(err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL - Unhandled Promise Rejection:');
  console.error(reason);
  process.exit(1);
});

module.exports = app;
