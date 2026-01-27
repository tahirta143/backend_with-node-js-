const Product = require("../models/Product");
const category = require("../models/category");

exports.homePage = async (req, res) => {
  const products = await Product.find().limit(8);
  res.json({ products });
};

exports.shopPage = async (req, res) => {
  const products = await Products.find();
  res.json(products);
};

exports.categoriesPage = async (req, res) => {
  const categories = await category.findById();
  res.json(categories);
};

exports.aboutPage = (req, res) => {
  res.json({
    title: "About Us ",
    description: "We provide best quality products online ",
  });
};
