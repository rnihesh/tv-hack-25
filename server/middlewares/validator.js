const { body, param, query } = require("express-validator");

// Common validation rules
const emailValidation = body("email")
  .isEmail()
  .normalizeEmail()
  .withMessage("Please provide a valid email address");

const passwordValidation = body("password")
  .isLength({ min: 6 })
  .withMessage("Password must be at least 6 characters long")
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage(
    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  );

const companyNameValidation = body("companyName")
  .trim()
  .isLength({ min: 2, max: 100 })
  .withMessage("Company name must be between 2 and 100 characters");

const businessTypeValidation = body("businessType")
  .isIn([
    "restaurant",
    "retail",
    "service",
    "consulting",
    "healthcare",
    "education",
    "technology",
    "manufacturing",
    "real_estate",
    "other",
  ])
  .withMessage("Please select a valid business type");

// Auth validation rules
const registerValidation = [
  companyNameValidation,
  emailValidation,
  passwordValidation,
  businessTypeValidation,
  body("businessDescription")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Business description cannot exceed 1000 characters"),
  body("targetAudience")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Target audience description cannot exceed 500 characters"),
  body("preferences.colorScheme")
    .optional()
    .isIn([
      "blue",
      "green",
      "red",
      "purple",
      "orange",
      "teal",
      "pink",
      "custom",
    ])
    .withMessage("Invalid color scheme"),
  body("preferences.brandStyle")
    .optional()
    .isIn(["modern", "classic", "minimal", "bold", "elegant", "playful"])
    .withMessage("Invalid brand style"),
  body("preferences.communicationTone")
    .optional()
    .isIn(["formal", "casual", "friendly", "professional", "conversational"])
    .withMessage("Invalid communication tone"),
];

const loginValidation = [
  emailValidation,
  body("password").notEmpty().withMessage("Password is required"),
];

const updateProfileValidation = [
  body("companyName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Company name must be between 2 and 100 characters"),
  body("businessType")
    .optional()
    .isIn([
      "restaurant",
      "retail",
      "service",
      "consulting",
      "healthcare",
      "education",
      "technology",
      "manufacturing",
      "real_estate",
      "other",
    ])
    .withMessage("Please select a valid business type"),
  body("businessDescription")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Business description cannot exceed 1000 characters"),
  body("targetAudience")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Target audience description cannot exceed 500 characters"),
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
];

// Website validation
const websiteGenerationValidation = [
  body("prompt")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Prompt must be between 10 and 1000 characters"),
  body("templateType")
    .optional()
    .isIn(["landing", "portfolio", "business", "ecommerce", "blog"])
    .withMessage("Invalid template type"),
  body("style")
    .optional()
    .isIn(["modern", "classic", "minimal", "bold", "elegant"])
    .withMessage("Invalid style"),
  body("colorScheme")
    .optional()
    .isIn([
      "blue",
      "green",
      "red",
      "purple",
      "orange",
      "teal",
      "pink",
      "custom",
    ])
    .withMessage("Invalid color scheme"),
];

// Email validation
const emailGenerationValidation = [
  body("type")
    .isIn(["promotional", "newsletter", "announcement", "follow_up", "welcome"])
    .withMessage("Invalid email type"),
  body("subject")
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage("Subject must be between 5 and 100 characters"),
  body("prompt")
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("Prompt must be between 10 and 500 characters"),
  body("targetAudience")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Target audience cannot exceed 200 characters"),
  body("tone")
    .optional()
    .isIn(["formal", "casual", "friendly", "professional", "conversational"])
    .withMessage("Invalid tone"),
];

// Image generation validation
const imageGenerationValidation = [
  body("prompt")
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage("Prompt must be between 5 and 500 characters"),
  body("style")
    .optional()
    .isIn(["realistic", "artistic", "cartoon", "professional", "modern"])
    .withMessage("Invalid image style"),
  body("size")
    .optional()
    .isIn([
      "square",
      "landscape",
      "portrait",
      "1024x1024",
      "1792x1024",
      "1024x1792",
    ])
    .withMessage("Invalid image size"),
  body("quantity")
    .optional()
    .isInt({ min: 1, max: 4 })
    .withMessage("Quantity must be between 1 and 4"),
];

// Chatbot validation
const chatbotMessageValidation = [
  body("message")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Message must be between 1 and 1000 characters"),
  body("sessionId")
    .optional()
    .isUUID()
    .withMessage("Invalid session ID format"),
  body("context")
    .optional()
    .isObject()
    .withMessage("Context must be an object"),
];

const chatbotConfigValidation = [
  body("botName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Bot name must be between 2 and 50 characters"),
  body("personality")
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage(
      "Personality description must be between 10 and 200 characters"
    ),
  body("knowledgeBase")
    .optional()
    .isArray()
    .withMessage("Knowledge base must be an array"),
  body("fallbackResponses")
    .optional()
    .isArray()
    .withMessage("Fallback responses must be an array"),
];

// Feedback validation
const feedbackValidation = [
  body("contentId").isMongoId().withMessage("Invalid content ID"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("comments")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Comments cannot exceed 500 characters"),
  body("improvements")
    .optional()
    .isArray()
    .withMessage("Improvements must be an array"),
];

// Parameter validation
const mongoIdValidation = param("id")
  .isMongoId()
  .withMessage("Invalid ID format");

// Query validation
const paginationValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("sortBy")
    .optional()
    .isIn(["createdAt", "updatedAt", "name", "rating", "usage"])
    .withMessage("Invalid sort field"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be asc or desc"),
];

const searchValidation = [
  query("q")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Search query must be between 2 and 100 characters"),
  query("type")
    .optional()
    .isIn(["all", "website", "email", "image", "chatbot"])
    .withMessage("Invalid search type"),
];

// Vector store validation
const vectorSearchValidation = [
  body("query")
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Search query must be between 2 and 200 characters"),
  body("limit")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("Limit must be between 1 and 20"),
  body("threshold")
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage("Threshold must be between 0 and 1"),
];

const addDocumentValidation = [
  body("content")
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage("Content must be between 10 and 10000 characters"),
  body("metadata.source")
    .isIn([
      "user_input",
      "website_content",
      "feedback",
      "product_catalog",
      "faq",
      "conversation",
      "uploaded_file",
    ])
    .withMessage("Invalid document source"),
  body("metadata.category")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Category cannot exceed 50 characters"),
  body("metadata.tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array"),
  body("metadata.importance")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("Importance must be between 1 and 10"),
];

module.exports = {
  // Auth validations
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,

  // Feature validations
  websiteGenerationValidation,
  emailGenerationValidation,
  imageGenerationValidation,
  chatbotMessageValidation,
  chatbotConfigValidation,
  feedbackValidation,

  // Common validations
  mongoIdValidation,
  paginationValidation,
  searchValidation,

  // Vector store validations
  vectorSearchValidation,
  addDocumentValidation,
};
