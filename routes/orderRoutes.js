const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getOrdersByStatus,
} = require("../controllers/orderController");

// Middleware imports (if needed)
// const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.post("/", createOrder);

// Protected/Admin routes (add middleware as needed)
router.get("/", getOrders); // Add: protect, admin
router.get("/status/:status", getOrdersByStatus); // Add: protect, admin
router.get("/:id", getOrderById); // Add: protect
router.put("/:id/status", updateOrderStatus); // Add: protect, admin
router.delete("/:id", deleteOrder); // Add: protect, admin

module.exports = router;
