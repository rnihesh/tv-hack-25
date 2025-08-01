const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const {
  generateImage,
  getImageHistory,
} = require("../controllers/imageGenController");

const { protect } = require("../middlewares/authMiddleware");
const demoAuth = require("../middlewares/demoAuth");

// Image generation validation rules
const imageGenerationRules = [
  body("prompt")
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage("Prompt must be between 5 and 500 characters"),
  body("style")
    .optional()
    .isIn(["realistic", "artistic", "cartoon", "abstract", "photographic"])
    .withMessage("Style must be one of: realistic, artistic, cartoon, abstract, photographic"),
  body("aspectRatio")
    .optional()
    .isIn(["1:1", "16:9", "9:16", "4:3", "3:4"])
    .withMessage("Aspect ratio must be one of: 1:1, 16:9, 9:16, 4:3, 3:4"),
];

// Routes (using demo auth for testing)
router.post(
  "/generate",
  demoAuth,
  imageGenerationRules,
  generateImage
);

router.get(
  "/history",
  demoAuth,
  getImageHistory
);

module.exports = router;
