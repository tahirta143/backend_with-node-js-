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
  }),
);
app.use(compression());

// CORS - Allow all for now (simplify)
app.use(
  cors({
    origin: true, // Allow all origins for testing
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// ====================
// ROUTES (CAN BE SET UP BEFORE DB CONNECTION)
// ====================

// Basic test routes (don't need DB)
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "E-commerce API",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      health: "GET /health",
      test: "GET /test",
      dbStatus: "GET /db-status",
    },
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

// Database status endpoint
app.get("/db-status", (req, res) => {
  const mongoose = require("mongoose");
  const dbStatus = mongoose.connection.readyState;

  res.json({
    database: {
      connected: dbStatus === 1,
      state:
        ["disconnected", "connected", "connecting", "disconnecting"][
          dbStatus
        ] || "unknown",
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    },
    timestamp: new Date().toISOString(),
  });
});

// Health check
app.get("/health", (req, res) => {
  const mongoose = require("mongoose");
  const dbStatus = mongoose.connection.readyState;

  const healthStatus = {
    status: dbStatus === 1 ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      connected: dbStatus === 1,
      state: ["disconnected", "connected", "connecting", "disconnecting"][
        dbStatus
      ],
    },
    environment: process.env.NODE_ENV || "development",
  };

  res.status(dbStatus === 1 ? 200 : 503).json(healthStatus);
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

    // 2. NOW register API routes (after DB is connected)
    console.log("📦 Registering API routes...");
    app.use("/api/admin", adminRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/categories", categoryRoutes);
    app.use("/api/orders", orderRoutes);
    app.use("/api/carts", cartRoutes);
    app.use("/api/auth", authRoutes);
    app.use("/api/users", userRoutes);

    // 3. Error handlers (after all routes)
    // 404 Handler
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
        availableEndpoints: [
          "GET /",
          "GET /health",
          "GET /test",
          "GET /db-status",
          "POST /api/auth/register",
          "POST /api/auth/login",
        ],
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
    const HOST =
      process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

    app.listen(PORT, HOST, () => {
      console.log(`
      ========================================
      🚀 Server started successfully!
      ========================================
      🌐 Environment: ${process.env.NODE_ENV || "development"}
      📍 Host: ${HOST}
      🔢 Port: ${PORT}
      🌍 Production URL: https://backend-with-node-js-ueii.onrender.com
      🗄️  Database: ${process.env.MONGODB_URI ? "Connected to MongoDB Atlas" : "No DB connection"}
      🕒 Time: ${new Date().toISOString()}
      ========================================
      `);

      // Test routes
      console.log(`
      📋 Test these endpoints:
      • Health:   https://backend-with-node-js-ueii.onrender.com/health
      • DB Status: https://backend-with-node-js-ueii.onrender.com/db-status
      • Test:     https://backend-with-node-js-ueii.onrender.com/test
      • Register: POST https://backend-with-node-js-ueii.onrender.com/api/auth/register
      `);
    });
  } catch (error) {
    console.error("\n❌❌❌ SERVER STARTUP FAILED ❌❌❌");
    console.error("Error:", error.message);
    console.error("\n🔧 Common fixes:");
    console.error("1. Check MONGODB_URI in Render environment variables");
    console.error("2. Verify MongoDB Atlas Network Access (add 0.0.0.0/0)");
    console.error("3. Check username/password in connection string");
    console.error("4. Ensure cluster is active in MongoDB Atlas");
    console.error("\n💡 Server will not start without database connection.");
    process.exit(1);
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
