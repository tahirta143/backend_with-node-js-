const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoURI) {
      console.error("❌ MongoDB URI is not defined in .env file");
      console.log("Please add MONGODB_URI to your .env file");
      process.exit(1);
    }
    
    // Show masked URI (hide password)
    const maskedURI = mongoURI.replace(/:([^:@]+)@/, ':****@');
    console.log(`🔗 Connecting to: ${maskedURI}`);
    
    // Simple connection without deprecated options
    await mongoose.connect(mongoURI);
    
    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    
  } catch (error) {
    console.error("\n❌ MongoDB Connection Failed!");
    console.error("Error:", error.message);
    
    // Common error troubleshooting
    if (error.message.includes('bad auth')) {
      console.log("\n🔧 Authentication Issues:");
      console.log("1. Check your password in .env file");
      console.log("2. Reset password in MongoDB Atlas if needed");
      console.log("3. Ensure IP is whitelisted (39.39.162.59)");
    } else if (error.message.includes('ENOTFOUND')) {
      console.log("\n🔧 Network Issues:");
      console.log("1. Check your internet connection");
      console.log("2. Verify the MongoDB URI is correct");
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;