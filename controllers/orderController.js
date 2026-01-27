const Order = require("../models/order");
const { createWhatsappMessage } = require("../utils/whatsappMessage");
const { calculateTotal } = require("../utils/calculateTotal");

// @desc    Create a new order
// @route   POST /api/orders
// @access  Public/Private
exports.createOrder = async (req, res) => {
  try {
    const { products, customerInfo } = req.body;

    // Validate required fields
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Products array is required and cannot be empty",
      });
    }

    // Validate each product in the array
    for (const product of products) {
      if (!product.productId || !product.quantity || !product.price) {
        return res.status(400).json({
          success: false,
          message: "Each product must have productId, quantity, and price",
        });
      }
    }

    // Calculate total price
    const totalPrice = calculateTotal(products);

    // Generate WhatsApp message
    const whatsappMessage = createWhatsappMessage({
      products,
      totalPrice,
      customerInfo: customerInfo || {},
    });

    // Create new order document
    const newOrder = new Order({
      products,
      totalPrice,
      whatsappMessage,
      customerInfo: customerInfo || {}, // Optional customer info
      status: "pending", // Default status
    });

    // Save to database
    const savedOrder = await newOrder.save();

    // Send success response
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        orderId: savedOrder._id,
        totalPrice: savedOrder.totalPrice,
        whatsappMessage: savedOrder.whatsappMessage,
        status: savedOrder.status,
        createdAt: savedOrder.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating order:", error);

    // Handle MongoDB validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate order detected",
      });
    }

    // General server error
    res.status(500).json({
      success: false,
      message: "Server error while creating order",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).select("-__v"); // Exclude version key

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    const order = await Order.findById(id).select("-__v");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status, updatedAt: Date.now() },
      { new: true, runValidators: true },
    ).select("-__v");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Delete an order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get orders by status
// @route   GET /api/orders/status/:status
// @access  Private/Admin
exports.getOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const orders = await Order.find({ status })
      .sort({ createdAt: -1 })
      .select("-__v");

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching orders by status:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
