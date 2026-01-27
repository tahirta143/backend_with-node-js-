const User = require("../models/User");
const bcrypt = require("bcryptjs");

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  console.log("=".repeat(50));
  console.log("🚀 START REGISTER PROCESS");
  console.log("=".repeat(50));
  
  try {
    console.log("📦 Request received");
    console.log("📦 Request body:", req.body);

    const { name, email, password } = req.body;

    // Check required fields
    if (!name || !email || !password) {
      console.log("❌ Missing required fields");
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
      });
    }

    console.log("🔍 Checking if user exists...");
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      console.log("❌ User already exists");
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    console.log("🔍 Hashing password...");
    // Hash password manually instead of using pre-save middleware
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("✅ Password hashed");

    console.log("🔍 Creating user...");
    const user = await User.create({
      name,
      email,
      password: hashedPassword, // Use the hashed password
      provider: "local",
    });
    console.log("✅ User created:", user._id);

    // Generate token
    const token = user.generateAuthToken();
    console.log("✅ Token generated");

    console.log("✅ REGISTRATION COMPLETE!");
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
      },
    });
    
  } catch (error) {
    console.error("💥 UNCAUGHT ERROR IN REGISTER");
    console.error("Error:", error);
    console.error("Stack:", error.stack);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message
    });
  } finally {
    console.log("=".repeat(50));
    console.log("🏁 END REGISTER PROCESS");
    console.log("=".repeat(50));
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    console.log("🔍 LOGIN ATTEMPT");
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find user with password (since it's select: false by default)
    const user = await User.findOne({ email }).select("+password");
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user registered via Google
    if (user.provider === "google") {
      return res.status(401).json({
        success: false,
        message: "Please login with Google",
      });
    }

    // Compare passwords
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = user.generateAuthToken();

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};