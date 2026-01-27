const express = require("express");
const router = express.Router();

const {
  registerAdmin,
  loginAdmin,
  testRoute
} = require("../controllers/adminController");

// Test route
router.get("/test", testRoute);

// Register admin
router.post("/register", registerAdmin);

// Login admin
router.post("/login", loginAdmin);

module.exports = router;