const express = require("express");
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  searchCategories,
} = require("../controllers/categoryController");

// Middleware imports (optional - for authentication/authorization)
// const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.get("/", getCategories);
router.get("/search", searchCategories);
router.get("/:id", getCategoryById);

// Protected/Admin routes
router.post("/", createCategory); // Add middleware: protect, admin
router.put("/:id", updateCategory); // Add middleware: protect, admin
router.delete("/:id", deleteCategory); // Add middleware: protect, admin

module.exports = router;
