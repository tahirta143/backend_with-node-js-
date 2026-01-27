const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const User = require("../models/User");

// For Admin routes (existing - keep this)
const protectAdmin = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "Not authorized, no token" 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select("-password");
    
    if (!admin) {
      return res.status(401).json({ 
        success: false,
        message: "Not authorized" 
      });
    }
    
    req.admin = admin;
    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    return res.status(401).json({ 
      success: false,
      message: "Not authorized" 
    });
  }
};

// For User routes (new - for Google OAuth users)
const protectUser = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "Not authorized, no token" 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if it's an admin first
    const admin = await Admin.findById(decoded.id);
    if (admin) {
      req.user = admin;
      req.user.isAdmin = true;
      return next();
    }
    
    // Check if it's a regular user
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Not authorized" 
      });
    }
    
    req.user = user;
    req.user.isAdmin = false;
    next();
  } catch (error) {
    console.error("User auth error:", error);
    return res.status(401).json({ 
      success: false,
      message: "Not authorized" 
    });
  }
};

// Check if user is admin (for routes that require admin privileges)
const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    return res.status(403).json({ 
      success: false,
      message: "Not authorized as admin" 
    });
  }
};

module.exports = { protectAdmin, protectUser, isAdmin };