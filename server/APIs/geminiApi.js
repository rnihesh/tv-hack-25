const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const geminiApp = express.Router();

// Ensure your API key is stored securely in environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

geminiApp.post(
  "/suggest-description",
  expressAsyncHandler(async (req, res) => {
    const { productName } = req.body;

    if (!productName) {
      return res.status(400).send({ message: "Product name is required" });
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Or your preferred model
      const prompt = `Generate a compelling and concise product description for: "${productName}". Focus on its key features and benefits for an e-commerce listing. Keep it under 30 words. Plain text, no MarkDown, no Options, Just straight.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      res.status(200).send({ suggestion: text });
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      res
        .status(500)
        .send({ message: "Failed to generate description from AI" });
    }
  })
);

module.exports = geminiApp;
