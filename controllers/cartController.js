const Cart = require("../models/Cart");
const mongoose = require("mongoose");

// @desc    Create or update user's cart
// @route   POST /api/carts
// @access  Private
exports.createOrUpdateCart = async (req, res) => {
  console.log("=== CART CREATE/UPDATE REQUEST ===");
  console.log("Request body:", JSON.stringify(req.body, null, 2));

  try {
    const { userId, products } = req.body;

    console.log("🔍 Parsed userId:", userId);
    console.log("🔍 Parsed products:", products);

    // Validation
    if (!userId) {
      console.log("❌ Validation failed: userId missing");
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!products || !Array.isArray(products)) {
      console.log("❌ Validation failed: products missing or not array");
      return res.status(400).json({
        success: false,
        message: "Products array is required",
      });
    }

    console.log("✅ Basic validation passed");

    // Validate each product
    for (const item of products) {
      console.log("🔍 Validating product item:", item);
      if (!item.product || !item.quantity || !item.price) {
        console.log("❌ Product validation failed:", {
          hasProduct: !!item.product,
          hasQuantity: !!item.quantity,
          hasPrice: !!item.price,
        });
        return res.status(400).json({
          success: false,
          message: "Each product must have product, quantity, and price",
        });
      }
    }

    console.log("✅ All products validated");

    // Find existing cart or create new one
    console.log(`🔍 Searching for cart with userId: ${userId}`);
    let cart = await Cart.findOne({ userId });
    console.log("🔍 Found cart:", cart ? "Yes" : "No");

    if (cart) {
      console.log("📝 Updating existing cart");
      cart.products = products;
    } else {
      console.log("🆕 Creating new cart");
      cart = new Cart({
        userId,
        products,
      });
    }

    console.log("💾 Attempting to save cart...");
    const savedCart = await cart.save();
    console.log("✅ Cart saved successfully, ID:", savedCart._id);

    // Populate product details for response
    console.log("🔍 Populating product details...");
    const populatedCart = await Cart.findById(savedCart._id)
      .populate("products.product", "name image price")
      .select("-__v");

    res.status(200).json({
      success: true,
      message: cart ? "Cart updated successfully" : "Cart created successfully",
      data: populatedCart,
    });
  } catch (error) {
    console.error("🔥 ERROR in createOrUpdateCart:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    // Handle specific MongoDB errors
    if (error.name === "ValidationError") {
      console.error("📝 Validation errors:", error.errors);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    if (error.code === 11000) {
      console.error("🔑 Duplicate key error");
      return res.status(400).json({
        success: false,
        message: "Duplicate cart entry",
      });
    }

    // General server error
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get user's cart
// @route   GET /api/carts/:userId
// @access  Private
exports.getCart = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const cart = await Cart.findOne({ userId })
      .populate("products.product", "name image price description")
      .select("-__v");

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
        data: {
          userId,
          products: [],
          totalPrice: 0,
          totalItems: 0,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    console.error("Error in getCart:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Add item to cart
// @route   POST /api/carts/:userId/items
// @access  Private
exports.addToCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const { product, quantity = 1, price, name, image } = req.body;

    // Validate input
    if (!product || !price) {
      return res.status(400).json({
        success: false,
        message: "Product ID and price are required",
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, products: [] });
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.products.findIndex(
      (item) => item.product.toString() === product,
    );

    if (existingItemIndex > -1) {
      // Update quantity if product exists
      cart.products[existingItemIndex].quantity += quantity;
    } else {
      // Add new product to cart
      cart.products.push({
        product,
        quantity,
        price,
        name,
        image,
      });
    }

    // Save and populate
    await cart.save();
    const populatedCart = await Cart.findById(cart._id)
      .populate("products.product", "name image price")
      .select("-__v");

    res.status(200).json({
      success: true,
      message: "Item added to cart",
      data: populatedCart,
    });
  } catch (error) {
    console.error("Error in addToCart:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/carts/:userId/items/:productId
// @access  Private
exports.updateCartItem = async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity (min 1) is required",
      });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Find the item
    const itemIndex = cart.products.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    // Update quantity
    cart.products[itemIndex].quantity = quantity;

    // Save and populate
    await cart.save();
    const populatedCart = await Cart.findById(cart._id)
      .populate("products.product", "name image price")
      .select("-__v");

    res.status(200).json({
      success: true,
      message: "Cart item updated",
      data: populatedCart,
    });
  } catch (error) {
    console.error("Error in updateCartItem:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/carts/:userId/items/:productId
// @access  Private
exports.removeFromCart = async (req, res) => {
  try {
    const { userId, productId } = req.params;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Filter out the item
    const initialLength = cart.products.length;
    cart.products = cart.products.filter(
      (item) => item.product.toString() !== productId,
    );

    if (cart.products.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    // If cart becomes empty, delete it, otherwise save it
    if (cart.products.length === 0) {
      await Cart.findByIdAndDelete(cart._id);
      res.status(200).json({
        success: true,
        message: "Cart is now empty",
        data: null,
      });
    } else {
      await cart.save();
      const populatedCart = await Cart.findById(cart._id)
        .populate("products.product", "name image price")
        .select("-__v");

      res.status(200).json({
        success: true,
        message: "Item removed from cart",
        data: populatedCart,
      });
    }
  } catch (error) {
    console.error("Error in removeFromCart:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/carts/:userId
// @access  Private
exports.clearCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await Cart.findOneAndDelete({ userId });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    console.error("Error in clearCart:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
