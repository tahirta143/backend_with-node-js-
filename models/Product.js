const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },
   images: [
    {
      public_id: String, // Cloudinary public ID
      url: String,       // Cloudinary URL
      alt: String
    }
  ],
    category: {
      type: String, // Changed from ObjectId to String for simplicity
      default: "Uncategorized",
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
