const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoURI) {
      console.error("❌ MongoDB URI is not defined in environment variables");
      
      if (process.env.NODE_ENV === 'production') {
        console.log("Please set MONGODB_URI in Render environment variables");
      }
      
      throw new Error("MongoDB URI is required");
    }
    
    // Show masked URI (hide password)
    const maskedURI = mongoURI.replace(/:([^:@]+)@/, ':****@');
    console.log(`🔗 Connecting to MongoDB: ${maskedURI}`);
    
    const options = {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      maxPoolSize: 10,
    };
    
    const conn = await mongoose.connect(mongoURI, options);
    
    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`📊 Database: ${conn.connection.db.databaseName}`);
    console.log(`🏠 Host: ${conn.connection.host}`);
    
    // Connection events
    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from MongoDB');
      
      // Auto-reconnect in production
      if (process.env.NODE_ENV === 'production') {
        console.log('Attempting to reconnect in 5 seconds...');
        setTimeout(connectDB, 5000);
      }
    });
    
  } catch (error) {
    console.error("\n❌ MongoDB Connection Failed!");
    console.error("Error:", error.message);
    
    if (error.message.includes('bad auth')) {
      console.log("\n🔧 Authentication failed. Possible issues:");
      console.log("1. Check password in environment variables");
      console.log("2. Verify IP is whitelisted in MongoDB Atlas");
      console.log("3. Check if user has correct database permissions");
    } else if (error.message.includes('ENOTFOUND')) {
      console.log("\n🔧 Network error. Possible issues:");
      console.log("1. Check internet connection");
      console.log("2. Verify MongoDB URI is correct");
    }
    
    // Retry logic for production
    if (process.env.NODE_ENV === 'production') {
      console.log("\n🔄 Retrying connection in 10 seconds...");
      setTimeout(connectDB, 10000);
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;