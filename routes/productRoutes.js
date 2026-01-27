const express = require("express");
const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

// ✅ Fix the import - make sure the file name matches
const { protectAdmin } = require("../middleware/authmiddleware");

// Import upload middleware
const upload = require("../middleware/uploadMiddleware");

// ADMIN ROUTES (protected)
router.post("/", protectAdmin, upload.array("images", 5), createProduct);
router.put("/:id", protectAdmin, upload.array("images", 5), updateProduct);
router.delete("/:id", protectAdmin, deleteProduct);

// PUBLIC ROUTES
router.get("/", getProducts);
router.get("/:id", getProductById);

module.exports = router;
