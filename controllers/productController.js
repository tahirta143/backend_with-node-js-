const cloudinary = require("../config/cloudinary");
const Product = require("../models/Product");

// Valid sections
const VALID_SECTIONS = ["NEW", "BEST_SELLING", "ALL"];

/**
 * CREATE PRODUCT
 */
exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, discount, section, images } = req.body;

    // Validation
    if (!title || !price || !images || images.length === 0) {
      return res
        .status(400)
        .json({ message: "Title, price, and images are required" });
    }

    if (!VALID_SECTIONS.includes(section)) {
      return res
        .status(400)
        .json({
          message: `Section must be one of: ${VALID_SECTIONS.join(", ")}`,
        });
    }

    // Upload images to Cloudinary
    const uploadedImages = [];
    for (const img of images) {
      const result = await cloudinary.uploader.upload(img, {
        folder: "products",
      });
      uploadedImages.push(result.secure_url);
    }

    const product = await Product.create({
      title,
      description,
      price,
      discount,
      section,
      images: uploadedImages,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET ALL PRODUCTS (optionally by section)
 */
exports.getProducts = async (req, res) => {
  try {
    const { section } = req.query;

    let filter = {};
    if (section) {
      if (!VALID_SECTIONS.includes(section)) {
        return res
          .status(400)
          .json({
            message: `Section must be one of: ${VALID_SECTIONS.join(", ")}`,
          });
      }
      filter.section = section;
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET SINGLE PRODUCT BY ID
 */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * UPDATE PRODUCT
 */
exports.updateProduct = async (req, res) => {
  try {
    const { images, section, ...data } = req.body;

    // Validate section if provided
    if (section && !VALID_SECTIONS.includes(section)) {
      return res
        .status(400)
        .json({
          message: `Section must be one of: ${VALID_SECTIONS.join(", ")}`,
        });
    }

    if (images && images.length > 0) {
      const uploadedImages = [];
      for (const img of images) {
        const result = await cloudinary.uploader.upload(img, {
          folder: "products",
        });
        uploadedImages.push(result.secure_url);
      }
      data.images = uploadedImages;
    }

    if (section) data.section = section;

    const product = await Product.findByIdAndUpdate(req.params.id, data, {
      new: true,
    });
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE PRODUCT
 */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Delete images from Cloudinary
    for (const url of product.images) {
      const publicId = url.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`products/${publicId}`);
    }

    await product.deleteOne();
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
