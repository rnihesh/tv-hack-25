require("dotenv").config();

module.exports = {
  // Server Configuration
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || "development",

  // Database Configuration
  mongoUri:
    process.env.DBURL || "mongodb://localhost:27017/ai-business-toolkit",

  // JWT Configuration
  jwtSecret:
    process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production",
  jwtExpiration: process.env.JWT_EXPIRATION || "7d",

  // AI Model Configuration
  geminiApiKey: process.env.GEMINI_API_KEY,
  ollamaUrl: process.env.OLLAMA_URL || "http://localhost:11434",

  // Email Configuration
  gmailAddress: process.env.GMAIL_ADDRESS,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN,

  // Stripe Configuration
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,

  // Vector Database Configuration
  chromaUrl: process.env.CHROMA_URL || "http://localhost:8000",
  vectorStorePath: process.env.VECTOR_STORE_PATH || "./vector_stores/",

  // Rate Limiting
  rateLimitWindowMs:
    parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100, // requests per window

  // Security
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",

  // Credit System
  dailyCreditResetHour: parseInt(process.env.DAILY_CREDIT_RESET_HOUR) || 0, // 00:00 UTC

  // File Upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  uploadDir: process.env.UPLOAD_DIR || "./uploads/",

  // AI Service Limits
  maxPromptLength: parseInt(process.env.MAX_PROMPT_LENGTH) || 5000,
  maxResponseLength: parseInt(process.env.MAX_RESPONSE_LENGTH) || 10000,
  requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS) || 120000, // 2 minutes
};
