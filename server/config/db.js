const mongoose = require("mongoose");
const { mongoUri } = require("./env-config");
const { logger } = require("../utils/logger");

const connectDB = async () => {
  if (!mongoUri) {
    const error = new Error("MongoDB connection string not found. Set DBURL or MONGO_URI in .env file.");
    logger.error(error.message);
    throw error;
  }

  try {
    // Log connection attempt (mask credentials)
    const maskedUri = mongoUri.replace(/mongodb(\+srv)?:\/\/([^:]+:)?([^@]+@)?([^/]+)\/(.+)/, 
                                      'mongodb$1://user:****@$4/$5');
    logger.info(`Attempting to connect to MongoDB at: ${maskedUri}`);
    
    // Connect with proper options, removing deprecated ones
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000 // 5 second timeout
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Set up connection event listeners
    mongoose.connection.on("connected", () => {
      logger.info("Mongoose connected to MongoDB");
    });

    mongoose.connection.on("error", (err) => {
      logger.error("Mongoose connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("Mongoose disconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      logger.info("Mongoose connection closed through app termination");
      process.exit(0);
    });

    return conn;
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    if (error.name === 'MongoServerSelectionError') {
      logger.error('Could not connect to MongoDB server. Please check:');
      logger.error('1. MongoDB is running and accessible');
      logger.error('2. Network connectivity to MongoDB server');
      logger.error('3. Authentication credentials');
    }
    
    // Make MongoDB optional for development if configured
    if (process.env.NODE_ENV === 'development' && process.env.ALLOW_NO_DB === 'true') {
      logger.warn('Running in development mode without MongoDB connection');
      return null;
    }
    
    throw error; // Re-throw to be handled by the caller
  }
};

module.exports = connectDB;
