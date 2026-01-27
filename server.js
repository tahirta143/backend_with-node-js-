const express = require("express");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");

// Load .env FIRST
require("dotenv").config();

console.log("✅ Environment Variables:");
console.log("PORT:", process.env.PORT);
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "Set" : "Not set");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "Set" : "Not set");
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "Set" : "Not set");

// Set fallback JWT_SECRET for development
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "dev_secret_key_change_in_production";
  console.log("⚠️  Using development JWT_SECRET fallback");
}

const connectDB = require("./config/db");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes");
const authRoutes = require("./routes/auth"); // NEW
const userRoutes = require("./routes/userRoutes"); // NEW

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Session middleware for Google OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || "your_session_secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
require("./config/passport"); // Load passport config

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Connect to MongoDB
connectDB();

// Test route (keep your existing one)
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "E-commerce API",
    version: "1.0.0",
    googleAuth: !!process.env.GOOGLE_CLIENT_ID, // Added this line
    endpoints: {
      auth: { // Added this section
        googleLogin: "GET /api/auth/google",
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        profile: "GET /api/auth/me (requires auth)",
      },
      admin: {
        register: "POST /api/admin/register",
        login: "POST /api/admin/login",
        test: "GET /api/admin/test",
      },
      products: {
        getAll: "GET /api/products",
        getOne: "GET /api/products/:id",
        create: "POST /api/products (requires admin auth)",
        update: "PUT /api/products/:id (requires admin auth)",
        delete: "DELETE /api/products/:id (requires admin auth)",
      },
      carts: {
        createOrUpdate: "POST /api/carts",
        getCart: "GET /api/carts/:userId",
        addItem: "POST /api/carts/:userId/items",
        updateItem: "PUT /api/carts/:userId/items/:productId",
        removeItem: "DELETE /api/carts/:userId/items/:productId",
        clearCart: "DELETE /api/carts/:userId",
      },
    },
  });
});

// API Routes
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/carts", cartRoutes);
app.use("/api/auth", authRoutes); // NEW - Add this line
app.use("/api/users", userRoutes); // NEW - Add this line

// Health check
app.get("/health", (req, res) => {
  const mongoose = require("mongoose");
  const dbStatus = mongoose.connection.readyState;

  res.json({
    success: dbStatus === 1,
    status: "OK",
    timestamp: new Date().toISOString(),
    database: dbStatus === 1 ? "connected" : "disconnected",
  });
});

// ✅ FIXED: 404 Handler with 'next' parameter
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ✅ FIXED: Error handler with all 4 parameters
app.use((err, req, res, next) => {
  console.error("Server error:", err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n✅ Server started successfully!`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`🔐 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? "Enabled" : "Disabled"}`);
});