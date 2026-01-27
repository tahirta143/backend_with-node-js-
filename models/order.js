const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Product", // Reference to Product model if you have one
        },
        name: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        image: String, // Optional product image
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    whatsappMessage: {
      type: String,
      required: true,
    },
    customerInfo: {
      name: String,
      phone: String,
      email: String,
      address: String,
      notes: String,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "online", "cod"],
      default: "cod", // Cash on Delivery
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
  },
  { timestamps: true },
);

// Add index for better query performance
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ "customerInfo.phone": 1 });

module.exports = mongoose.model("Order", orderSchema);
