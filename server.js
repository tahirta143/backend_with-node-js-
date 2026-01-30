const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");

// Load .env FIRST
require("dotenv").config();

console.log(
  `🚀 Starting server in ${process.env.NODE_ENV || "development"} mode`,
);

const connectDB = require("./config/db");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/userRoutes");

const app = express();

// ====================
// MIDDLEWARE SETUP
// ====================

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false, // Important for CORS
  }),
);
app.use(compression());

// CORS Configuration - UPDATED
const corsOptions = {
  origin: true, // Allow all origins for now
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "token", // ADD THIS - Your frontend sends "token" header
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers"
  ],
  exposedHeaders: ["Authorization", "token"],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 204
};

app.use(cors({
  origin: true, // Allow all origins
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  exposedHeaders: ['Authorization', 'token']
}));

// Handle OPTIONS requests explicitly (preflight)
app.options('*', cors());

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging with CORS info
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  console.log(`  Origin: ${req.headers.origin || 'none'}`);
  console.log(`  Auth Header: ${req.headers.authorization ? 'Present' : 'Missing'}`);
  console.log(`  Token Header: ${req.headers.token ? 'Present' : 'Missing'}`);
  next();
});

// Add CORS headers to all responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, token"
    );
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.header("Access-Control-Expose-Headers", "Authorization, token");
  }
  
  // Handle OPTIONS method
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  
  next();
});

// ====================
// BASIC ROUTES (ALWAYS AVAILABLE)
// ====================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "E-commerce API",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "API is working! 🚀",
    server: "Render",
    timestamp: new Date().toISOString(),
  });
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    message: "API server is running",
  });
});

// Database status endpoint
app.get("/db-status", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const dbStatus = mongoose.connection.readyState;
    
    res.json({
      success: true,
      database: {
        connected: dbStatus === 1,
        state: ["disconnected", "connected", "connecting", "disconnecting"][dbStatus] || "unknown",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      database: {
        connected: false,
        state: "error",
        error: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

// ====================
// DATABASE CONNECTION & SERVER START
// ====================

const startServer = async () => {
  try {
    console.log("🔗 Attempting to connect to MongoDB...");

    // 1. Connect to MongoDB
    await connectDB();
    console.log("✅ MongoDB connected successfully!");

    // 2. Register API routes
    console.log("📦 Registering API routes...");
    app.use("/api/admin", adminRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/categories", categoryRoutes);
    app.use("/api/orders", orderRoutes);
    app.use("/api/carts", cartRoutes);
    app.use("/api/auth", authRoutes);
    app.use("/api/users", userRoutes);

    // 3. Error handlers
    // 404 Handler
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
        timestamp: new Date().toISOString(),
      });
    });

    // Error handler
    app.use((err, req, res, next) => {
      console.error("💥 Server Error:", err.message);

      res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error",
        timestamp: new Date().toISOString(),
      });
    });

    // 4. Start server
    const PORT = process.env.PORT || 5000;
    const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

    app.listen(PORT, HOST, () => {
      console.log(`
      ========================================
      🚀 Server started successfully!
      ========================================
      🌐 Environment: ${process.env.NODE_ENV || "development"}
      📍 Host: ${HOST}
      🔢 Port: ${PORT}
      🌍 URL: https://backend-with-node-js-ueii.onrender.com
      🗄️  Database: Connected to MongoDB Atlas
      🕒 Time: ${new Date().toISOString()}
      ========================================
      `);
    });
  } catch (error) {
    console.error("\n❌ DATABASE CONNECTION FAILED");
    console.error("Error:", error.message);
    
    // Start server anyway (routes will return errors but server will run)
    const PORT = process.env.PORT || 5000;
    const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
    
    app.listen(PORT, HOST, () => {
      console.log(`
      ========================================
      ⚠️  Server started WITHOUT database
      ========================================
      🌐 Environment: ${process.env.NODE_ENV || "development"}
      📍 Host: ${HOST}
      🔢 Port: ${PORT}
      🌍 URL: https://backend-with-node-js-ueii.onrender.com
      🗄️  Database: DISCONNECTED
      🕒 Time: ${new Date().toISOString()}
      ========================================
      `);
    });
  }
};

// Start the server
startServer();

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down...");
  process.exit(0);
});