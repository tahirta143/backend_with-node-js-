require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");
const connectDB = require("./config/db");

connectDB();

const createAdmin = async () => {
  try {
    // Delete existing admin (optional)
    await Admin.deleteMany({ email: "admin@gmail.com" });

    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = await Admin.create({
      name: "Admin",
      email: "admin@gmail.com",
      password: hashedPassword,
    });

    console.log("Admin created successfully:", admin);
    process.exit();
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();
