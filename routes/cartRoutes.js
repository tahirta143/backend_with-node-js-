const express = require("express");
const router = express.Router();
const {
  createOrUpdateCart,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");

// Middleware for authentication (add if needed)
// const { protect } = require('../middleware/authMiddleware');

// Cart routes
router.post("/", createOrUpdateCart); // Create/update entire cart
router.get("/:userId", getCart); // Get user's cart
router.post("/:userId/items", addToCart); // Add single item to cart
router.put("/:userId/items/:productId", updateCartItem); // Update item quantity
router.delete("/:userId/items/:productId", removeFromCart); // Remove item from cart
router.delete("/:userId", clearCart); // Clear entire cart

module.exports = router;
