const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const passport = require("passport");
const session = require("express-session");

// Load .env FIRST
require("dotenv").config();

console.log(`🚀 Starting server in ${process.env.NODE_ENV || 'development'} mode`);

const connectDB = require("./config/db");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/userRoutes");

const app = express();

// Security middleware (install: npm install helmet compression)
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API (or configure properly)
}));
app.use(compression());

// CORS configuration for Render
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://ecommerce-backend.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `CORS policy does not allow access from ${origin}`;
      console.warn(`CORS blocked: ${origin}`);
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration for production
app.use(session({
  secret: process.env.JWT_SECRET || "your_session_secret_change_this",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  },
  proxy: true // Trust Render proxy
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
require("./config/passport");

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.ip} - ${req.method} ${req.originalUrl}`);
  next();
});

// Connect to MongoDB
connectDB();

// Test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "E-commerce API",
    version: "1.0.0",
    environment: process.env.NODE_ENV || 'development',
    deployed: process.env.NODE_ENV === 'production' ? 'Render' : 'Local',
    uptime: process.uptime(),
    googleAuth: !!process.env.GOOGLE_CLIENT_ID,
    endpoints: {
      auth: {
        googleLogin: "GET /api/auth/google",
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        profile: "GET /api/auth/me",
      },
      admin: {
        register: "POST /api/admin/register",
        login: "POST /api/admin/login",
        test: "GET /api/admin/test",
      },
      products: "GET /api/products",
      categories: "GET /api/categories",
      orders: "GET /api/orders",
      carts: "GET /api/carts",
      users: "GET /api/users",
      health: "GET /health"
    },
    documentation: "https://ecommerce-backend.onrender.com"
  });
});

// API Routes
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/carts", cartRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Health check with detailed info
app.get("/health", (req, res) => {
  const mongoose = require("mongoose");
  const dbStatus = mongoose.connection.readyState;
  
  const healthStatus = {
    status: dbStatus === 1 ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: {
      connected: dbStatus === 1,
      state: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbStatus] || 'unknown'
    },
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: process.platform
  };
  
  res.status(dbStatus === 1 ? 200 : 503).json(healthStatus);
});

// Simple test endpoint for Render
app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "API is working on Render! 🚀",
    server: "Render",
    timestamp: new Date().toISOString(),
    url: "https://ecommerce-backend.onrender.com"
  });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      "GET /",
      "GET /health",
      "GET /test",
      "GET /api/products",
      "POST /api/auth/register",
      "POST /api/auth/login"
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("💥 Server Error:", err);

  const statusCode = err.status || 500;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
});

// Use PORT from environment (Render provides 10000)
const PORT = process.env.PORT || 5000;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

app.listen(PORT, HOST, () => {
  console.log(`
  🚀 Server started successfully!
  🌐 Environment: ${process.env.NODE_ENV || 'development'}
  📍 Host: ${HOST}
  🔢 Port: ${PORT}
  🔗 Local URL: http://localhost:${PORT}
  🌍 Production URL: https://ecommerce-backend.onrender.com
  🕒 Time: ${new Date().toISOString()}
  `);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down...');
  process.exit(0);
});