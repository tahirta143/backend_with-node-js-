const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    images: {
      type: [String], // Cloudinary URLs
      required: true,
    },

    section: {
      type: String,
      enum: ["NEW", "BEST_SELLING", "ALL"],
      default: "ALL",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
