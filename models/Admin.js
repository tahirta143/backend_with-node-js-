const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
}, {
  timestamps: true
});

// ✅ SIMPLE FIX: Remove next parameter entirely
adminSchema.pre('save', async function() {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

// Add comparePassword method
adminSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;