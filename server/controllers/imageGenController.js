const { validationResult } = require("express-validator");
const Company = require("../models/Company");
const ImageGen = require("../models/ImageGen");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleGenAI, Modality } = require("@google/genai");
const config = require("../config/env-config");
const { logger } = require("../utils/logger");
const { uploadImageToCloudinary } = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Credit costs for image operations
const CREDIT_COSTS = {
  image_generation: 3,
};

// Generate unique filename to handle concurrent requests
const generateUniqueFileName = (prefix = "img") => {
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(8).toString("hex");
  return `${prefix}-${timestamp}-${randomId}.png`;
};

// Initialize Google AI for image generation
let genAI;
let imageGenAI;
try {
  if (config.geminiApiKey) {
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
    // Initialize Google GenAI for Imagen image generation
    imageGenAI = new GoogleGenAI({
      apiKey: config.geminiApiKey,
    });
    logger.info("Google GenAI initialized for Imagen image generation");
  }
} catch (error) {
  logger.error("Failed to initialize Google AI:", error);
}

// Generate image with AI
exports.generateImage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { prompt, style = "realistic", aspectRatio = "1:1" } = req.body;
    const company = req.companyData || req.company;

    // Ensure company data is available
    if (!company) {
      return res.status(401).json({
        success: false,
        message: "Company authentication required",
      });
    }

    // Check if Gemini AI is available
    if (!genAI || !config.geminiApiKey) {
      return res.status(503).json({
        success: false,
        message: "AI image generation service is currently unavailable",
        error: "Gemini API not configured",
      });
    }

    logger.info(`Generating image for company ${company._id}`, {
      prompt: prompt.substring(0, 100),
      style,
      aspectRatio,
    });

    // Enhanced prompt for better image generation with Gemini
    const enhancedPrompt = `Generate a high-quality ${style} image with ${aspectRatio} aspect ratio. ${prompt}. Make it visually appealing and professional.`;

    try {
      // Use Gemini for image generation
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Generate image description first, then create a data URI placeholder
      // Note: Gemini doesn't directly generate images, so we'll create a descriptive response
      // In production, you'd integrate with an actual image generation service like DALL-E, Midjourney, or Stable Diffusion
      const result = await model.generateContent([
        `Create a detailed image description for: ${enhancedPrompt}. 
         Describe the image in vivid detail including colors, composition, lighting, and style. 
         Make it professional and suitable for business use.
         Return only the description without any additional text.`,
      ]);

      const response = await result.response;
      const imageDescription = response.text();

      // Generate real AI image using Imagen native image generation
      const generateGeminiImage = async (prompt, style, aspectRatio) => {
        try {
          if (!imageGenAI) {
            throw new Error("Google GenAI not initialized");
          }

          // Enhance prompt based on style
          let enhancedPrompt = prompt;
          switch (style) {
            case "cartoon":
              enhancedPrompt = `Create a cartoon style image: ${prompt}. Make it colorful, animated, and playful.`;
              break;
            case "artistic":
              enhancedPrompt = `Create an artistic style image: ${prompt}. Make it creative, expressive, and visually appealing.`;
              break;
            case "abstract":
              enhancedPrompt = `Create an abstract art style image: ${prompt}. Make it conceptual, modern, and artistic.`;
              break;
            case "photographic":
              enhancedPrompt = `Create a photographic style image: ${prompt}. Make it realistic, high quality, and professional.`;
              break;
            default: // realistic
              enhancedPrompt = `Create a realistic image: ${prompt}. Make it detailed, high quality, and lifelike.`;
          }

          // Add aspect ratio guidance to prompt
          if (aspectRatio === "16:9") {
            enhancedPrompt += " Create this as a wide landscape format image.";
          } else if (aspectRatio === "9:16") {
            enhancedPrompt += " Create this as a tall portrait format image.";
          } else {
            enhancedPrompt += " Create this as a square format image.";
          }

          logger.info(
            `Generating image with Imagen 3: ${enhancedPrompt}`
          );

          // Map aspect ratio to Imagen supported format
          let imagenAspectRatio = "1:1";
          if (aspectRatio === "16:9") {
            imagenAspectRatio = "16:9";
          } else if (aspectRatio === "9:16") {
            imagenAspectRatio = "9:16";
          } else if (aspectRatio === "4:3") {
            imagenAspectRatio = "4:3";
          } else if (aspectRatio === "3:4") {
            imagenAspectRatio = "3:4";
          }

          // Generate image using Imagen 3 model
          // const resModels = await imageGenAI.models.listModels({ modality: Modality.IMAGE });
          // logger.info("Available Imagen models:", { models: resModels });
          const response = await imageGenAI.models.generateImages({
            model: "imagen-3.0-generate-002",
            prompt: enhancedPrompt,
            config: {
              numberOfImages: 1,
              aspectRatio: imagenAspectRatio,
            },
          });

          // Process the Imagen response
          if (
            response.generatedImages &&
            response.generatedImages.length > 0
          ) {
            const generatedImage = response.generatedImages[0];
            if (generatedImage.image && generatedImage.image.imageBytes) {
              // Create uploads directory if it doesn't exist
              const uploadsDir = path.join(
                __dirname,
                "..",
                "uploads",
                "images"
              );
              if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
              }

              // Save image to local file and upload to Cloudinary
              const fileName = generateUniqueFileName("imagen");
              const filePath = path.join(uploadsDir, fileName);

              const imageData = generatedImage.image.imageBytes;
              const buffer = Buffer.from(imageData, "base64");
              fs.writeFileSync(filePath, buffer);

              // Ensure file is written and accessible
              if (!fs.existsSync(filePath)) {
                throw new Error("Failed to write image file");
              }

              // Upload to Cloudinary
              let cloudinaryUrl = null;
              try {
                const cloudinaryResult = await uploadImageToCloudinary(
                  buffer,
                  fileName
                );
                cloudinaryUrl = cloudinaryResult.secure_url;
                logger.info(`Image uploaded to Cloudinary: ${cloudinaryUrl}`);
              } catch (cloudinaryError) {
                logger.warn(
                  `Cloudinary upload failed, using local URL: ${cloudinaryError.message}`
                );
              }

              // Return Cloudinary URL if available, otherwise production URL
              const baseUrl =
                process.env.NODE_ENV === "production"
                  ? `https://phoenix-sol.onrender.com`
                  : `http://localhost:${config.port || 3000}`;
              const imageUrl =
                cloudinaryUrl || `${baseUrl}/uploads/images/${fileName}`;

              logger.info(`Imagen image saved successfully: ${imageUrl}`);
              return { imageUrl, localPath: filePath, cloudinaryUrl };
            }
          }

          throw new Error("No image data found in Imagen response");
        } catch (error) {
          logger.error("Imagen image generation failed:", error);

          // Fallback to placeholder
          const dimensions =
            aspectRatio === "16:9"
              ? "512x288"
              : aspectRatio === "9:16"
              ? "288x512"
              : aspectRatio === "4:3"
              ? "512x384"
              : aspectRatio === "3:4"
              ? "384x512"
              : "512x512";

          const colors =
            style === "cartoon"
              ? "4F46E5/FFFFFF"
              : style === "artistic"
              ? "F59E0B/FFFFFF"
              : style === "abstract"
              ? "10B981/FFFFFF"
              : "6366F1/FFFFFF";

          return `https://via.placeholder.com/${dimensions}/${colors}?text=${encodeURIComponent(
            prompt.substring(0, 30)
          )}`;
        }
      };

      // Generate the image URL
      let imageUrl;
      let cloudinaryUrl = null;

      if (req.body.cloudinaryUrl) {
        // Use provided Cloudinary URL
        imageUrl = req.body.cloudinaryUrl;
        cloudinaryUrl = req.body.cloudinaryUrl;
      } else {
        // Generate real AI image with Imagen
        const imageResult = await generateGeminiImage(
          prompt,
          style,
          aspectRatio
        );
        imageUrl = imageResult.imageUrl;
        cloudinaryUrl = imageResult.cloudinaryUrl;
      }

      let imageRecord = null;

      // Skip database operations for demo mode
      if (!company.isDemo) {
        // Get fresh company data and deduct credits properly
        const freshCompany = await Company.findById(company._id);
        if (!freshCompany) {
          throw new Error("Company not found");
        }

        // Use the deductCredits method instead of direct MongoDB operation
        await freshCompany.deductCredits(
          CREDIT_COSTS.image_generation,
          "image_gen",
          "AI image generation"
        );

        // Update usage statistics
        freshCompany.usage.imagesGenerated =
          (freshCompany.usage.imagesGenerated || 0) + 1;
        await freshCompany.save();

        // Save image generation record (only for real companies)
        imageRecord = new ImageGen({
          companyId: company._id,
          prompt,
          enhancedPrompt,
          style,
          aspectRatio,
          imageUrl: cloudinaryUrl || imageUrl, // Prefer Cloudinary URL
          cloudinaryUrl: cloudinaryUrl, // Store in dedicated field
          imageDescription,
          creditsUsed: CREDIT_COSTS.image_generation,
          generatedAt: new Date(),
          metadata: {
            aiModel: "imagen-3.0-generate-002",
            cloudinaryUrl: cloudinaryUrl, // Keep for backward compatibility
            localUrl: imageUrl !== cloudinaryUrl ? imageUrl : null,
          },
        });

        await imageRecord.save();

        logger.info(`Image generation record saved successfully`, {
          imageId: imageRecord._id,
          companyId: company._id,
          imageUrl: imageRecord.imageUrl,
          cloudinaryUrl: imageRecord.cloudinaryUrl,
          prompt: imageRecord.prompt
        });

        logger.info(`Image generated successfully for company ${company._id}`, {
          imageId: imageRecord._id,
          creditsUsed: CREDIT_COSTS.image_generation,
          remainingCredits: freshCompany.credits.currentCredits,
        });
      } else {
        // Demo mode - just log the action
        logger.info(`Demo image generated for demo company`, {
          prompt: prompt.substring(0, 100),
          creditsUsed: CREDIT_COSTS.image_generation,
        });
      }

      res.json({
        success: true,
        message: "Image generated successfully",
        data: {
          imageId: company.isDemo ? `demo-${Date.now()}` : imageRecord._id,
          imageUrl: cloudinaryUrl || imageUrl, // Use Cloudinary URL if available
          imageDescription,
          prompt,
          style,
          aspectRatio,
          creditsUsed: CREDIT_COSTS.image_generation,
          remainingCredits: company.isDemo
            ? company.credits.currentCredits
            : (await Company.findById(company._id)).credits.currentCredits,
        },
      });
    } catch (aiError) {
      logger.error("AI image generation failed", {
        error: aiError.message,
        companyId: company._id,
        prompt: prompt.substring(0, 100),
      });

      res.status(500).json({
        success: false,
        message: "Failed to generate image with AI service",
        error:
          process.env.NODE_ENV === "development"
            ? aiError.message
            : "Internal server error",
      });
    }
  } catch (error) {
    logger.error("Image generation controller error", {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: "Internal server error during image generation",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// Get image generation history
exports.getImageHistory = async (req, res) => {
  try {
    const company = req.companyData || req.company;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get the correct company ID
    const companyId = company._id || company.id;

    // Handle demo mode with mock data
    if (company.isDemo) {
      const mockImages = [
        {
          _id: "demo-1",
          prompt: "A beautiful sunset over mountains",
          style: "realistic",
          aspectRatio: "16:9",
          imageUrl: `https://via.placeholder.com/512x288/F59E0B/FFFFFF?text=Beautiful+Sunset+Mountains`,
          imageDescription:
            "A stunning realistic depiction of a sunset over majestic mountains with warm golden light cascading across the peaks and valleys.",
          creditsUsed: 3,
          generatedAt: new Date(),
        },
        {
          _id: "demo-2",
          prompt: "Modern office workspace",
          style: "photographic",
          aspectRatio: "4:3",
          imageUrl: `https://via.placeholder.com/512x384/10B981/FFFFFF?text=Modern+Office+Workspace`,
          imageDescription:
            "A clean, modern office workspace with natural lighting, ergonomic furniture, and contemporary design elements.",
          creditsUsed: 3,
          generatedAt: new Date(Date.now() - 3600000), // 1 hour ago
        },
      ];

      return res.json({
        success: true,
        data: {
          images: mockImages,
          pagination: {
            page,
            limit,
            total: mockImages.length,
            pages: 1,
            hasNext: false,
            hasPrev: false,
          },
        },
      });
    }

    // Get images for the company (real mode)
    logger.info(`Loading image history for company ${companyId}`, {
      page,
      limit,
      skip
    });

    const images = await ImageGen.find({ companyId: companyId })
      .sort({ generatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('prompt style aspectRatio imageUrl cloudinaryUrl imageDescription creditsUsed generatedAt createdAt')
      .lean(); // Use lean() for better performance

    logger.info(`Found ${images.length} images for company ${companyId}`, {
      totalFound: images.length,
      page,
      limit
    });

    // Ensure we always return the best available image URL
    const processedImages = images.map(image => ({
      ...image,
      imageUrl: image.cloudinaryUrl || image.imageUrl, // Prefer Cloudinary URL
      hasCloudinaryUrl: !!image.cloudinaryUrl
    }));

    const totalImages = await ImageGen.countDocuments({
      companyId: companyId,
    });
    const totalPages = Math.ceil(totalImages / limit);

    res.json({
      success: true,
      data: {
        images: processedImages,
        pagination: {
          page,
          limit,
          total: totalImages,
          pages: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    logger.error("Get image history error", {
      error: error.message,
      companyId: req.companyData?.id || req.company?.id,
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve image history",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// Delete generated image
exports.deleteImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const company = req.companyData || req.company;
    const companyId = company._id || company.id;

    if (company.isDemo) {
      return res.json({
        success: true,
        message: "Demo image deleted successfully"
      });
    }

    const image = await ImageGen.findOne({
      _id: imageId,
      companyId: companyId
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found"
      });
    }

    await ImageGen.deleteOne({ _id: imageId });

    logger.info(`Image deleted successfully`, {
      imageId,
      companyId: companyId
    });

    res.json({
      success: true,
      message: "Image deleted successfully"
    });

  } catch (error) {
    logger.error("Delete image error", {
      error: error.message,
      imageId: req.params.imageId
    });

    res.status(500).json({
      success: false,
      message: "Failed to delete image",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong"
    });
  }
};
