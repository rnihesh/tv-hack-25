const express = require("express");
const {
  generateWebsite,
  getGenerationStatus,
  getCompanyProfile,
  updateWebsite,
  deleteWebsite,
  deployWebsite
} = require("../controllers/websiteController");

const router = express.Router();

// POST /api/websites/generate — generate HTML using AI
router.post("/generate", generateWebsite);

// GET /api/websites/status — get usage and credits
router.get("/status", getGenerationStatus);

// GET /api/websites/profile — get company profile
router.get("/profile", getCompanyProfile);

// PUT /api/websites/:id — update website HTML
router.put("/:id", updateWebsite);

// DELETE /api/websites/:id — delete website
router.delete("/:id", deleteWebsite);

// POST /api/websites/:id/deploy — deploy website
router.post("/:id/deploy", deployWebsite);

module.exports = router;
