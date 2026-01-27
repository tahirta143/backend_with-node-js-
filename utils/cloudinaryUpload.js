const cloudinary = require("../config/cloudinary");
const fs = require("fs");

// Upload file to Cloudinary
const uploadToCloudinary = async (filePath, folder = "ecommerce-products") => {
  try {
    console.log(`📤 Uploading to Cloudinary: ${filePath}`);

    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      transformation: [
        { width: 1000, height: 1000, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    });

    console.log(`✅ Upload successful: ${result.public_id}`);
    return result;
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error);
    throw error;
  }
};

// Delete file from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    console.log(`🗑️ Deleting from Cloudinary: ${publicId}`);
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`✅ Delete successful: ${result.result}`);
    return result;
  } catch (error) {
    console.error("❌ Cloudinary delete error:", error);
    throw error;
  }
};

// Get optimized URL for display
const getOptimizedUrl = (publicId, options = {}) => {
  const defaultOptions = {
    width: 800,
    height: 800,
    crop: "fill",
    quality: "auto",
    fetch_format: "auto",
  };

  const finalOptions = { ...defaultOptions, ...options };
  return cloudinary.url(publicId, finalOptions);
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  getOptimizedUrl,
};
