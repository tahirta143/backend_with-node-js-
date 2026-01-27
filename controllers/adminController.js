const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Test route
exports.testRoute = async (req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
};

// ✅ SIMPLIFIED Register admin
exports.registerAdmin = async (req, res) => {
  try {
    console.log('📝 Registration attempt:', req.body);
    
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    console.log('🛠️ Creating admin...');
    
    // Create admin (password will be auto-hashed by pre-save hook)
    const admin = new Admin({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password // Will be hashed automatically
    });

    // Save to database
    await admin.save();
    
    console.log('✅ Admin created:', admin.email);

    // Create token
    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    // Send response
    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          createdAt: admin.createdAt
        },
        token
      }
    });

  } catch (error) {
    console.error('💥 Registration error details:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    // Handle specific errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message
      });
    }
    
    // Generic error
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};

// Login admin
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required'
      });
    }

    // Find admin
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Compare password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create token
    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};