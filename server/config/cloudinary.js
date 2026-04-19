const cloudinary = require('cloudinary').v2;
const path = require('path');
const config = require('./env-config');

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
});

// Upload image buffer to Cloudinary
const uploadImageToCloudinary = async (imageBuffer, fileName) => {
  try {
    const sanitizedBaseName = path
      .parse(fileName || `img-${Date.now()}`)
      .name
      .replace(/[^a-zA-Z0-9_-]/g, '_');

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'ai-generated-images',
          public_id: sanitizedBaseName,
          overwrite: false,
          invalidate: true,
          quality: 'auto',
          fetch_format: 'auto',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(imageBuffer);
    });
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

// Delete image from Cloudinary
const deleteImageFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Cloudinary delete failed: ${error.message}`);
  }
};

module.exports = {
  cloudinary,
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
};
