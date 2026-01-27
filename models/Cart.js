const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
        },
        price: {
          type: Number,
          required: true,
        },
        name: String,
        image: String,
      },
    ],
    totalPrice: {
      type: Number,
      default: 0,
    },
    totalItems: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// ✅ FIX 1: Use async function style
cartSchema.pre("save", async function () {
  // Remove 'next' parameter for newer Mongoose versions
  if (this.products && Array.isArray(this.products)) {
    this.totalItems = this.products.reduce(
      (total, item) => total + (item.quantity || 0),
      0,
    );
    this.totalPrice = this.products.reduce(
      (total, item) => total + (item.price || 0) * (item.quantity || 0),
      0,
    );
  } else {
    this.totalItems = 0;
    this.totalPrice = 0;
  }
});

// ✅ ALTERNATIVE FIX 2: Remove middleware and calculate in controller
// Comment out the pre-save middleware and calculate in your controller instead

module.exports = mongoose.model("Cart", cartSchema);
