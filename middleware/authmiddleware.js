const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

// Protect middleware (for regular users - if needed)
const protect = async (req, res, next) => {
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
    console.error("Auth error:", error);
    return res.status(401).json({ 
      success: false,
      message: "Not authorized" 
    });
  }
};

// Admin-only middleware (use this for product routes)
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
    
    // You could add additional admin checks here if needed
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

// Make sure to export BOTH
module.exports = { protect, protectAdmin };