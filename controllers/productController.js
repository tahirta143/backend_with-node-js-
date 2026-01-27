const Product = require("../models/Product");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../utils/cloudinaryUpload");
const fs = require("fs");
const path = require("path");

/**
 * CREATE PRODUCT WITH CLOUDINARY UPLOAD
 * POST /api/products
 */
exports.createProduct = async (req, res) => {
  try {
    console.log("📝 Creating product with Cloudinary...");
    console.log("Request body:", req.body);
    console.log("Uploaded files:", req.files ? req.files.length : 0);

    const { title, description, price, category, stock } = req.body;

    // Validation
    if (!title || !description || !price) {
      // Clean up uploaded files if validation fails
      if (req.files && req.files.length > 0) {
        req.files.forEach((file) => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log(`🧹 Cleaned up local file: ${file.path}`);
          }
        });
      }
      return res.status(400).json({
        success: false,
        message: "Title, description, and price are required",
      });
    }

    // Upload images to Cloudinary
    const images = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          console.log(`📤 Processing file: ${file.originalname}`);

          // Upload to Cloudinary
          const cloudinaryResult = await uploadToCloudinary(file.path);

          // Add Cloudinary image info
          images.push({
            public_id: cloudinaryResult.public_id,
            url: cloudinaryResult.secure_url,
            alt: title || file.originalname,
          });

          console.log(
            `✅ Added Cloudinary image: ${cloudinaryResult.public_id}`,
          );

          // Delete local file after Cloudinary upload
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log(`🗑️ Deleted local file: ${file.path}`);
          }
        } catch (cloudinaryError) {
          console.error("❌ Cloudinary upload failed:", cloudinaryError);

          // Clean up all local files
          req.files.forEach((f) => {
            if (fs.existsSync(f.path)) {
              fs.unlinkSync(f.path);
            }
          });

          return res.status(500).json({
            success: false,
            message: "Failed to upload images to Cloudinary",
            error: cloudinaryError.message,
          });
        }
      }
    }

    // Create product with Cloudinary images
    const product = await Product.create({
      title,
      description,
      price: parseFloat(price),
      images, // Array of Cloudinary image objects
      category: category || "Uncategorized",
      stock: stock ? parseInt(stock) : 0,
    });

    console.log(`✅ Product created successfully: ${product._id}`);

    res.status(201).json({
      success: true,
      message: "Product created successfully with Cloudinary images",
      data: product,
    });
  } catch (error) {
    console.error("❌ Create product error:", error);

    // Clean up any remaining files
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * UPDATE PRODUCT WITH CLOUDINARY
 * PUT /api/products/:id
 */
exports.updateProduct = async (req, res) => {
  try {
    console.log("🔄 Updating product with Cloudinary...");

    const product = await Product.findById(req.params.id);

    if (!product) {
      // Clean up uploaded files if product not found
      if (req.files && req.files.length > 0) {
        req.files.forEach((file) => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Handle new image uploads to Cloudinary
    if (req.files && req.files.length > 0) {
      console.log(`📸 ${req.files.length} new image(s) to upload`);

      const newImages = [];

      // Upload new images to Cloudinary
      for (const file of req.files) {
        try {
          const cloudinaryResult = await uploadToCloudinary(file.path);

          newImages.push({
            public_id: cloudinaryResult.public_id,
            url: cloudinaryResult.secure_url,
            alt: req.body.title || product.title,
          });

          // Delete local file
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (uploadError) {
          console.error("❌ New image upload failed:", uploadError);

          // Clean up files
          req.files.forEach((f) => {
            if (fs.existsSync(f.path)) {
              fs.unlinkSync(f.path);
            }
          });

          return res.status(500).json({
            success: false,
            message: "Failed to upload new images",
          });
        }
      }

      // Delete old images from Cloudinary if replacing
      if (product.images && product.images.length > 0) {
        console.log("🗑️ Deleting old images from Cloudinary...");
        for (const oldImage of product.images) {
          if (oldImage.public_id) {
            try {
              await deleteFromCloudinary(oldImage.public_id);
              console.log(`✅ Deleted old image: ${oldImage.public_id}`);
            } catch (deleteError) {
              console.error(
                `❌ Failed to delete old image: ${deleteError.message}`,
              );
            }
          }
        }
      }

      // Replace with new images
      product.images = newImages;
    }

    // Update other fields
    if (req.body.title) product.title = req.body.title;
    if (req.body.description) product.description = req.body.description;
    if (req.body.price) product.price = parseFloat(req.body.price);
    if (req.body.category) product.category = req.body.category;
    if (req.body.stock !== undefined) product.stock = parseInt(req.body.stock);

    await product.save();

    res.json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("❌ Update product error:", error);

    // Clean up uploaded files on error
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE PRODUCT (with Cloudinary cleanup)
 * DELETE /api/products/:id
 */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    console.log("🗑️ Deleting product and its Cloudinary images...");

    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        if (image.public_id) {
          try {
            await deleteFromCloudinary(image.public_id);
            console.log(`✅ Deleted from Cloudinary: ${image.public_id}`);
          } catch (error) {
            console.error(
              `❌ Error deleting image from Cloudinary: ${error.message}`,
            );
          }
        }
      }
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete product error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL PRODUCTS and GET SINGLE PRODUCT remain the same
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
