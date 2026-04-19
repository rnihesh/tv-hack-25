const { validationResult } = require("express-validator");
const Company = require("../models/Company");
const ImageGen = require("../models/ImageGen");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleGenAI } = require("@google/genai");
const config = require("../config/env-config");
const { logger } = require("../utils/logger");
const {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
} = require("../config/cloudinary");
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

const isGeminiQuotaError = (message = "") => {
  return /quota|resource_exhausted|request_increase|429/i.test(message);
};

const isGeminiServiceDisabledError = (message = "") => {
  return /service_disabled|has not been used in project|enable it by visiting/i.test(
    message
  );
};

const isGeminiModelNotFoundError = (message = "") => {
  return /models\/imagen|not found|supported methods|status\"\s*:\s*\"NOT_FOUND/i.test(
    message
  );
};

const isGeminiAuthError = (message = "") => {
  return /api key not valid|invalid api key|api key invalid|unauthorized/i.test(
    message
  );
};

const isGeminiBillingPlanError = (message = "") => {
  return /only available on paid plans|upgrade your account|ai\.dev\/projects|invalid_argument/i.test(
    message
  );
};

const DEFAULT_IMAGEN_MODELS = [
  "models/imagen-4.0-fast-generate-001",
  "models/imagen-4.0-generate-001",
  "models/imagen-4.0-ultra-generate-001",
  "imagen-4.0-fast-generate-001",
  "imagen-4.0-generate-001",
  "imagen-4.0-ultra-generate-001",
  "imagen-3.0-generate-002",
  "imagen-3.0-generate-001",
];

const getImagenModelCandidates = () => {
  const configured = Array.isArray(config.imagenModels)
    ? config.imagenModels
    : [];
  const uniqueModels = new Set([...configured, ...DEFAULT_IMAGEN_MODELS]);
  return Array.from(uniqueModels).filter(Boolean);
};

const extractCloudinaryPublicIdFromUrl = (url) => {
  if (!url || !url.includes("res.cloudinary.com")) return null;

  try {
    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
    const uploadIndex = pathParts.indexOf("upload");
    if (uploadIndex === -1) return null;

    let publicIdParts = pathParts.slice(uploadIndex + 1);
    if (publicIdParts[0] && /^v\d+$/.test(publicIdParts[0])) {
      publicIdParts = publicIdParts.slice(1);
    }

    if (publicIdParts.length === 0) return null;

    const lastPart = publicIdParts[publicIdParts.length - 1];
    publicIdParts[publicIdParts.length - 1] = lastPart.replace(/\.[^.]+$/, "");

    return publicIdParts.join("/");
  } catch (error) {
    return null;
  }
};

const createPollinationsImageAsset = async (prompt, style, aspectRatio) => {
  const { width, height } = getImageDimensionsForAspectRatio(aspectRatio);
  const styleHint =
    style === "photographic"
      ? "photorealistic"
      : style === "cartoon"
      ? "cartoon illustration"
      : style === "artistic"
      ? "digital painting"
      : style === "abstract"
      ? "abstract art"
      : "realistic";

  const finalPrompt = `${prompt}, ${styleHint}, high detail, clean composition`;
  const providerUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    finalPrompt
  )}?width=${width}&height=${height}&nologo=true`;

  const providerResponse = await fetch(providerUrl);
  if (!providerResponse.ok) {
    throw new Error(
      `Pollinations generation failed with status ${providerResponse.status}`
    );
  }

  const contentType = providerResponse.headers.get("content-type") || "image/jpeg";
  const extension = contentType.includes("png") ? "png" : "jpg";
  const arrayBuffer = await providerResponse.arrayBuffer();
  const imageBuffer = Buffer.from(arrayBuffer);

  const fileName = generateUniqueFileName("pollinations").replace(/\.png$/, `.${extension}`);

  // Prefer Cloudinary storage for generated outputs
  let cloudinaryUrl = null;
  let cloudinaryPublicId = null;
  try {
    const cloudinaryResult = await uploadImageToCloudinary(imageBuffer, fileName);
    cloudinaryUrl = cloudinaryResult.secure_url;
    cloudinaryPublicId = cloudinaryResult.public_id;
    logger.info(`Pollinations image uploaded to Cloudinary: ${cloudinaryUrl}`);
  } catch (cloudinaryError) {
    logger.warn(
      `Cloudinary upload failed for Pollinations image, using local storage: ${cloudinaryError.message}`
    );
  }

  if (cloudinaryUrl) {
    return {
      imageUrl: cloudinaryUrl,
      cloudinaryUrl,
      cloudinaryPublicId,
      localPath: null,
      providerUrl,
      provider: "pollinations",
    };
  }

  const uploadsDir = path.join(__dirname, "..", "uploads", "images");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, imageBuffer);

  const baseUrl =
    process.env.NODE_ENV === "production"
      ? `https://phoenix-sol.onrender.com`
      : `http://localhost:${config.port || 3000}`;

  return {
    imageUrl: `${baseUrl}/uploads/images/${fileName}`,
    cloudinaryUrl: null,
    cloudinaryPublicId: null,
    localPath: filePath,
    providerUrl,
    provider: "pollinations",
  };
};

const getImageDimensionsForAspectRatio = (aspectRatio = "1:1") => {
  switch (aspectRatio) {
    case "16:9":
      return { width: 1024, height: 576 };
    case "9:16":
      return { width: 576, height: 1024 };
    case "4:3":
      return { width: 1024, height: 768 };
    case "3:4":
      return { width: 768, height: 1024 };
    default:
      return { width: 1024, height: 1024 };
  }
};

const getFallbackStylePalette = (style = "realistic") => {
  switch (style) {
    case "cartoon":
      return { bgFrom: "#4338CA", bgTo: "#6366F1", accent: "#FCD34D" };
    case "artistic":
      return { bgFrom: "#B45309", bgTo: "#F59E0B", accent: "#FDE68A" };
    case "abstract":
      return { bgFrom: "#047857", bgTo: "#10B981", accent: "#A7F3D0" };
    case "photographic":
      return { bgFrom: "#1F2937", bgTo: "#4B5563", accent: "#E5E7EB" };
    default:
      return { bgFrom: "#1D4ED8", bgTo: "#3B82F6", accent: "#DBEAFE" };
  }
};

const sanitizeSvgText = (text = "") => {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const splitTextIntoLines = (text = "", maxChars = 42, maxLines = 6) => {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxChars) {
      currentLine = candidate;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
      if (lines.length >= maxLines) {
        break;
      }
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  if (lines.length === maxLines && words.length > 0) {
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, maxChars - 3)}...`;
  }

  return lines;
};

const createFallbackImageAsset = (prompt, style, aspectRatio) => {
  const { width, height } = getImageDimensionsForAspectRatio(aspectRatio);
  const palette = getFallbackStylePalette(style);
  const lines = splitTextIntoLines(prompt, 42, 6);
  const subtitle = "AI image unavailable - fallback poster";
  const startY = Math.floor(height * 0.38);
  const lineHeight = Math.max(30, Math.floor(width * 0.035));

  const tspanLines = lines
    .map((line, index) => {
      const y = startY + index * lineHeight;
      return `<tspan x="${Math.floor(width * 0.1)}" y="${y}">${sanitizeSvgText(
        line
      )}</tspan>`;
    })
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.bgFrom}" />
      <stop offset="100%" stop-color="${palette.bgTo}" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)" />
  <circle cx="${Math.floor(width * 0.82)}" cy="${Math.floor(
    height * 0.2
  )}" r="${Math.floor(Math.min(width, height) * 0.12)}" fill="${palette.accent}" opacity="0.25" />
  <rect x="${Math.floor(width * 0.07)}" y="${Math.floor(
    height * 0.14
  )}" width="${Math.floor(width * 0.86)}" height="${Math.floor(
    height * 0.72
  )}" rx="24" fill="#000" opacity="0.18" />
  <text x="${Math.floor(width * 0.1)}" y="${Math.floor(
    height * 0.26
  )}" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="${Math.max(
    24,
    Math.floor(width * 0.035)
  )}" font-weight="700">${subtitle}</text>
  <text fill="#F9FAFB" font-family="Arial, sans-serif" font-size="${Math.max(
    20,
    Math.floor(width * 0.028)
  )}" font-weight="600">${tspanLines}</text>
  <text x="${Math.floor(width * 0.1)}" y="${Math.floor(
    height * 0.84
  )}" fill="#E5E7EB" font-family="Arial, sans-serif" font-size="${Math.max(
    14,
    Math.floor(width * 0.016)
  )}">Style: ${sanitizeSvgText(style)} | Ratio: ${sanitizeSvgText(
    aspectRatio
  )}</text>
</svg>`;

  const fileName = generateUniqueFileName("fallback").replace(/\.png$/, ".svg");
  const svgBuffer = Buffer.from(svg, "utf8");

  // Prefer Cloudinary storage for generated outputs
  // This can fail for stricter SVG restrictions; local storage remains a safe fallback.
  return (async () => {
    try {
      const cloudinaryResult = await uploadImageToCloudinary(svgBuffer, fileName);
      const cloudinaryUrl = cloudinaryResult.secure_url;
      const cloudinaryPublicId = cloudinaryResult.public_id;
      logger.info(`Fallback SVG uploaded to Cloudinary: ${cloudinaryUrl}`);
      return {
        imageUrl: cloudinaryUrl,
        cloudinaryUrl,
        cloudinaryPublicId,
        localPath: null,
      };
    } catch (cloudinaryError) {
      logger.warn(
        `Cloudinary upload failed for fallback SVG, using local storage: ${cloudinaryError.message}`
      );

      const uploadsDir = path.join(__dirname, "..", "uploads", "images");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, svg, "utf8");

      const baseUrl =
        process.env.NODE_ENV === "production"
          ? `https://phoenix-sol.onrender.com`
          : `http://localhost:${config.port || 3000}`;

      return {
        imageUrl: `${baseUrl}/uploads/images/${fileName}`,
        cloudinaryUrl: null,
        cloudinaryPublicId: null,
        localPath: filePath,
      };
    }
  })();
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

    // Check if Imagen API is available
    if (!imageGenAI || !config.geminiApiKey) {
      return res.status(503).json({
        success: false,
        message: "AI image generation service is currently unavailable",
        error: "Gemini/Imagen API not configured",
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
      // Description is optional metadata; don't block image generation if text model fails.
      let imageDescription = enhancedPrompt;
      if (genAI) {
        try {
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
          const result = await model.generateContent([
            `Create a detailed image description for: ${enhancedPrompt}. 
             Describe the image in vivid detail including colors, composition, lighting, and style. 
             Make it professional and suitable for business use.
             Return only the description without any additional text.`,
          ]);
          const response = await result.response;
          imageDescription = response.text();
        } catch (descriptionError) {
          logger.warn("Image description generation failed, continuing", {
            error: descriptionError.message,
          });
        }
      }

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

          const modelCandidates = getImagenModelCandidates();
          let response;
          let selectedModel;
          let lastModelError = null;

          for (const modelName of modelCandidates) {
            try {
              response = await imageGenAI.models.generateImages({
                model: modelName,
                prompt: enhancedPrompt,
                config: {
                  numberOfImages: 1,
                  aspectRatio: imagenAspectRatio,
                },
              });
              selectedModel = modelName;
              logger.info(`Imagen model selected: ${selectedModel}`);
              break;
            } catch (modelError) {
              const modelErrorMessage = modelError?.message || "";
              lastModelError = modelError;

              if (isGeminiModelNotFoundError(modelErrorMessage)) {
                logger.warn(`Imagen model unavailable, trying next model`, {
                  model: modelName,
                  error: modelErrorMessage,
                });
                continue;
              }

              throw modelError;
            }
          }

          if (!response) {
            const triedModels = modelCandidates.join(", ");
            const lastErrorMessage = lastModelError?.message || "Unknown model error";
            throw new Error(
              `No supported Imagen model is available for this API key/project. Tried: ${triedModels}. Last error: ${lastErrorMessage}`
            );
          }

          // Process the Imagen response
          if (
            response.generatedImages &&
            response.generatedImages.length > 0
          ) {
            const generatedImage = response.generatedImages[0];
            if (generatedImage.image && generatedImage.image.imageBytes) {
              // Upload to Cloudinary first; local disk is fallback only.
              const fileName = generateUniqueFileName("imagen");
              const imageData = generatedImage.image.imageBytes;
              const buffer = Buffer.from(imageData, "base64");

              let cloudinaryUrl = null;
              let cloudinaryPublicId = null;
              let filePath = null;
              try {
                const cloudinaryResult = await uploadImageToCloudinary(
                  buffer,
                  fileName
                );
                cloudinaryUrl = cloudinaryResult.secure_url;
                cloudinaryPublicId = cloudinaryResult.public_id;
                logger.info(`Image uploaded to Cloudinary: ${cloudinaryUrl}`);
              } catch (cloudinaryError) {
                logger.warn(
                  `Cloudinary upload failed, using local storage: ${cloudinaryError.message}`
                );

                const uploadsDir = path.join(
                  __dirname,
                  "..",
                  "uploads",
                  "images"
                );
                if (!fs.existsSync(uploadsDir)) {
                  fs.mkdirSync(uploadsDir, { recursive: true });
                }

                filePath = path.join(uploadsDir, fileName);
                fs.writeFileSync(filePath, buffer);

                if (!fs.existsSync(filePath)) {
                  throw new Error("Failed to write fallback local image file");
                }
              }

              // Return Cloudinary URL if available, otherwise production URL
              const baseUrl =
                process.env.NODE_ENV === "production"
                  ? `https://phoenix-sol.onrender.com`
                  : `http://localhost:${config.port || 3000}`;
              const imageUrl =
                cloudinaryUrl || `${baseUrl}/uploads/images/${fileName}`;

              logger.info(`Imagen image saved successfully: ${imageUrl}`);
              return {
                imageUrl,
                localPath: filePath,
                cloudinaryUrl,
                cloudinaryPublicId,
                modelUsed: selectedModel,
              };
            }
          }

          throw new Error("No image data found in Imagen response");
        } catch (error) {
          logger.error("Imagen image generation failed:", error);
          throw error;
        }
      };

      // Generate the image URL
      let imageUrl;
      let cloudinaryUrl = null;
      let cloudinaryPublicId = null;
      let imageAiModel = "imagen";

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
        cloudinaryPublicId = imageResult.cloudinaryPublicId || null;
        imageAiModel = imageResult.modelUsed || imageAiModel;
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
          cloudinaryPublicId,
          imageDescription,
          creditsUsed: CREDIT_COSTS.image_generation,
          generatedAt: new Date(),
          metadata: {
            aiModel: imageAiModel,
            cloudinaryUrl: cloudinaryUrl, // Keep for backward compatibility
            cloudinaryPublicId,
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
      const errorMessage = aiError.message || "Unknown AI service error";
      const statusCode = isGeminiQuotaError(errorMessage)
        ? 429
        : isGeminiServiceDisabledError(errorMessage)
        ? 503
        : isGeminiBillingPlanError(errorMessage)
        ? 402
        : isGeminiModelNotFoundError(errorMessage)
        ? 503
        : isGeminiAuthError(errorMessage)
        ? 401
        : 500;

      const shouldUseFallbackImage =
        isGeminiQuotaError(errorMessage) ||
        isGeminiServiceDisabledError(errorMessage) ||
        isGeminiBillingPlanError(errorMessage) ||
        isGeminiModelNotFoundError(errorMessage) ||
        isGeminiAuthError(errorMessage);

      if (shouldUseFallbackImage) {
        let fallbackUrl;
        let fallbackCloudinaryUrl = null;
        let fallbackCloudinaryPublicId = null;
        let fallbackLocalPath = null;
        let fallbackModel = "fallback-svg";
        let fallbackMessage =
          "Image provider unavailable. Generated a fallback poster instead.";

        try {
          const pollinationsAsset = await createPollinationsImageAsset(
            prompt,
            style,
            aspectRatio
          );
          fallbackUrl = pollinationsAsset.imageUrl;
          fallbackCloudinaryUrl = pollinationsAsset.cloudinaryUrl || null;
          fallbackCloudinaryPublicId =
            pollinationsAsset.cloudinaryPublicId || null;
          fallbackLocalPath = pollinationsAsset.localPath;
          fallbackModel = "pollinations";
          fallbackMessage =
            "Primary AI provider unavailable. Generated image with backup provider.";
        } catch (providerFallbackError) {
          logger.warn("Secondary image provider failed, using poster fallback", {
            error: providerFallbackError.message,
          });

          try {
            const fallbackAsset = await createFallbackImageAsset(
              prompt,
              style,
              aspectRatio
            );
            fallbackUrl = fallbackAsset.imageUrl;
            fallbackCloudinaryUrl = fallbackAsset.cloudinaryUrl || null;
            fallbackCloudinaryPublicId =
              fallbackAsset.cloudinaryPublicId || null;
            fallbackLocalPath = fallbackAsset.localPath;
          } catch (fallbackCreationError) {
            logger.warn("Failed to create file-based fallback image", {
              error: fallbackCreationError.message,
            });
            const { width, height } = getImageDimensionsForAspectRatio(aspectRatio);
            fallbackUrl = `https://dummyimage.com/${width}x${height}/1D4ED8/FFFFFF.png?text=${encodeURIComponent(
              "Fallback+Poster"
            )}`;
          }
        }
        const fallbackDescription =
          fallbackModel === "pollinations"
            ? "Image generated by backup provider because primary AI image provider is unavailable."
            : "Fallback poster generated locally because AI image provider is currently unavailable.";

        let fallbackImageId = `fallback-${Date.now()}`;
        let remainingCredits = company.credits?.currentCredits;

        if (!company.isDemo) {
          const freshCompany = await Company.findById(company._id);
          if (freshCompany) {
            freshCompany.usage.imagesGenerated =
              (freshCompany.usage.imagesGenerated || 0) + 1;
            await freshCompany.save();

            const fallbackRecord = new ImageGen({
              companyId: company._id,
              prompt,
              enhancedPrompt,
              style,
              aspectRatio,
              imageUrl: fallbackUrl,
              cloudinaryUrl: fallbackCloudinaryUrl,
              cloudinaryPublicId: fallbackCloudinaryPublicId,
              imageDescription: fallbackDescription,
              creditsUsed: 0,
              generatedAt: new Date(),
              metadata: {
                aiModel: fallbackModel,
                cloudinaryUrl: fallbackCloudinaryUrl,
                cloudinaryPublicId: fallbackCloudinaryPublicId,
                localUrl: fallbackLocalPath || fallbackUrl,
              },
            });

            await fallbackRecord.save();
            fallbackImageId = fallbackRecord._id;
            remainingCredits = freshCompany.credits.currentCredits;
          }
        }

        logger.warn("Serving fallback image due to AI provider error", {
          reason: errorMessage,
          companyId: company._id,
        });

        return res.json({
          success: true,
          message: fallbackMessage,
          data: {
            imageId: fallbackImageId,
            imageUrl: fallbackUrl,
            imageDescription: fallbackDescription,
            prompt,
            style,
            aspectRatio,
            creditsUsed: 0,
            remainingCredits,
            fallback: fallbackModel !== "pollinations",
            provider: fallbackModel,
          },
        });
      }

      logger.error("AI image generation failed", {
        error: errorMessage,
        companyId: company._id,
        prompt: prompt.substring(0, 100),
      });

      res.status(statusCode).json({
        success: false,
        message:
          statusCode === 429
            ? "Image generation quota exceeded. Please try later or use a key with available quota."
            : statusCode === 402
            ? "This Gemini API key/project does not currently have Imagen paid-plan access. Verify billing and create the API key from the billed project, then retry."
            : statusCode === 503
            ? isGeminiModelNotFoundError(errorMessage)
              ? "No supported Imagen model is available for this API key/project. Enable Gemini image generation access or use a key with Imagen access."
              : "Gemini API is disabled for this Google Cloud project. Enable the API and try again in a few minutes."
            : statusCode === 401
            ? "Invalid Gemini API key or insufficient permission for image generation."
            : "Failed to generate image with AI service",
        error:
          process.env.NODE_ENV === "development"
            ? errorMessage
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

    const cloudinaryPublicId =
      image.cloudinaryPublicId ||
      image.metadata?.cloudinaryPublicId ||
      extractCloudinaryPublicIdFromUrl(image.cloudinaryUrl || image.imageUrl);

    if (cloudinaryPublicId) {
      try {
        await deleteImageFromCloudinary(cloudinaryPublicId);
        logger.info(`Deleted image from Cloudinary`, {
          imageId,
          cloudinaryPublicId,
        });
      } catch (cloudinaryDeleteError) {
        logger.warn(`Failed to delete image from Cloudinary`, {
          imageId,
          cloudinaryPublicId,
          error: cloudinaryDeleteError.message,
        });
      }
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
