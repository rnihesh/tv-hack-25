const winston = require("winston");
const path = require("path");

// Create logs directory if it doesn't exist
const fs = require("fs");
const logsDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels and colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

// Add colors to winston
winston.addColors(logColors);

// Create custom format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logMessage = `${timestamp} [${level}]: ${message}`;

    // Add stack trace for errors
    if (stack) {
      logMessage += `\nStack: ${stack}`;
    }

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += `\nMeta: ${JSON.stringify(meta, null, 2)}`;
    }

    return logMessage;
  })
);

// Create file format (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    level: process.env.NODE_ENV === "production" ? "warn" : "debug",
    format: logFormat,
  }),

  // Error log file
  new winston.transports.File({
    filename: path.join(logsDir, "error.log"),
    level: "error",
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // Combined log file
  new winston.transports.File({
    filename: path.join(logsDir, "combined.log"),
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Add additional transports for production
if (process.env.NODE_ENV === "production") {
  // HTTP access log
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, "access.log"),
      level: "http",
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  levels: logLevels,
  format: fileFormat,
  transports,
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, "exceptions.log"),
      format: fileFormat,
    }),
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, "rejections.log"),
      format: fileFormat,
    }),
  ],
});

// Create HTTP logger middleware
const httpLogger = (req, res, next) => {
  const start = Date.now();

  // Log request
  logger.http("HTTP Request", {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    body: req.method === "POST" || req.method === "PUT" ? req.body : undefined,
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    const duration = Date.now() - start;

    logger.http("HTTP Response", {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get("content-length"),
    });

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Database operation logger
const dbLogger = {
  query: (operation, collection, query, duration) => {
    logger.debug("Database Query", {
      operation,
      collection,
      query: JSON.stringify(query),
      duration: duration ? `${duration}ms` : undefined,
    });
  },

  error: (operation, collection, error, query) => {
    logger.error("Database Error", {
      operation,
      collection,
      error: error.message,
      query: JSON.stringify(query),
      stack: error.stack,
    });
  },

  connection: (event, details) => {
    if (event === "connected") {
      logger.info("Database Connected", details);
    } else if (event === "error") {
      logger.error("Database Connection Error", details);
    } else if (event === "disconnected") {
      logger.warn("Database Disconnected", details);
    }
  },
};

// AI operation logger
const aiLogger = {
  request: (service, model, prompt, metadata) => {
    logger.info("AI Request", {
      service,
      model,
      promptLength: prompt?.length,
      metadata,
    });
  },

  response: (service, model, response, metadata) => {
    logger.info("AI Response", {
      service,
      model,
      responseLength: response?.length,
      tokenUsage: metadata?.tokenUsage,
      duration: metadata?.duration,
      cost: metadata?.cost,
    });
  },

  error: (service, model, error, metadata) => {
    logger.error("AI Service Error", {
      service,
      model,
      error: error.message,
      metadata,
      stack: error.stack,
    });
  },
};

// Business operation logger
const businessLogger = {
  registration: (companyEmail, metadata) => {
    logger.info("Company Registration", {
      email: companyEmail,
      ...metadata,
    });
  },

  login: (companyEmail, metadata) => {
    logger.info("Company Login", {
      email: companyEmail,
      ...metadata,
    });
  },

  subscription: (companyEmail, action, plan, metadata) => {
    logger.info("Subscription Event", {
      email: companyEmail,
      action,
      plan,
      ...metadata,
    });
  },

  creditUsage: (companyEmail, service, creditsUsed, remainingCredits) => {
    logger.info("Credit Usage", {
      email: companyEmail,
      service,
      creditsUsed,
      remainingCredits,
    });
  },

  contentGeneration: (companyEmail, contentType, success, metadata) => {
    logger.info("Content Generation", {
      email: companyEmail,
      contentType,
      success,
      ...metadata,
    });
  },
};

// Security logger
const securityLogger = {
  authFailure: (email, reason, ip, metadata) => {
    logger.warn("Authentication Failure", {
      email,
      reason,
      ip,
      ...metadata,
    });
  },

  rateLimitExceeded: (ip, endpoint, metadata) => {
    logger.warn("Rate Limit Exceeded", {
      ip,
      endpoint,
      ...metadata,
    });
  },

  suspiciousActivity: (description, metadata) => {
    logger.warn("Suspicious Activity", {
      description,
      ...metadata,
    });
  },
};

// Performance logger
const performanceLogger = {
  slowQuery: (operation, duration, metadata) => {
    logger.warn("Slow Database Query", {
      operation,
      duration: `${duration}ms`,
      ...metadata,
    });
  },

  slowRequest: (endpoint, duration, metadata) => {
    logger.warn("Slow HTTP Request", {
      endpoint,
      duration: `${duration}ms`,
      ...metadata,
    });
  },

  memoryUsage: (usage) => {
    logger.debug("Memory Usage", {
      used: `${Math.round((usage.used / 1024 / 1024) * 100) / 100} MB`,
      total: `${Math.round((usage.total / 1024 / 1024) * 100) / 100} MB`,
      percentage: `${Math.round((usage.used / usage.total) * 100)}%`,
    });
  },
};

// Export logger and specialized loggers
module.exports = {
  logger,
  httpLogger,
  dbLogger,
  aiLogger,
  businessLogger,
  securityLogger,
  performanceLogger,
};

// For backward compatibility
module.exports.default = logger;
