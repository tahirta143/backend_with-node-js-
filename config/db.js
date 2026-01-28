const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      console.error("❌ MONGODB_URI is not defined in environment variables");
      console.log("💡 Set it in Render: MONGODB_URI=mongodb+srv://...");
      throw new Error("MongoDB URI is required");
    }

    // Show connection info (mask password)
    const maskedURI = mongoURI.replace(/:([^:@]+)@/, ":****@");
    console.log(`🔗 Connecting to MongoDB: ${maskedURI}`);

    // Connection options
    const options = {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      retryWrites: true,
      w: "majority",
    };

    console.log("⏳ Establishing connection (timeout: 30s)...");

    const conn = await mongoose.connect(mongoURI, options);

    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`📊 Database: ${conn.connection.db.databaseName}`);
    console.log(`🏠 Host: ${conn.connection.host}`);

    // Connection event handlers
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected!");
    });

    return conn;
  } catch (error) {
    console.error("\n❌ MongoDB Connection Failed!");
    console.error("Error:", error.message);
    console.error("Error name:", error.name);

    // Provide specific troubleshooting tips
    if (error.name === "MongoServerSelectionError") {
      console.log(
        "\n🔧 FIX: Go to MongoDB Atlas → Network Access → Add 0.0.0.0/0",
      );
      console.log("🔧 FIX: Wait 3 minutes after adding IP address");
    } else if (
      error.message.includes("bad auth") ||
      error.message.includes("Authentication failed")
    ) {
      console.log("\n🔧 FIX: Check username/password in MONGODB_URI");
      console.log(
        "🔧 FIX: Create new user with simple password (no special chars)",
      );
    } else if (error.message.includes("ENOTFOUND")) {
      console.log("\n🔧 FIX: Check cluster name in connection string");
      console.log("🔧 FIX: Verify cluster is active in MongoDB Atlas");
    }

    throw error; // Re-throw so server startup can catch it
  }
};

module.exports = connectDB;
