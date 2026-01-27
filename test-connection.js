require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Testing MongoDB Connection...\n');

const uri = process.env.MONGODB_URI || 'Not set';
const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
console.log('Connection String:', maskedUri);

if (!process.env.MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI is not set in .env file');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000
})
.then(() => {
  console.log('\n✅ SUCCESS: Connected to MongoDB!');
  console.log('Database:', mongoose.connection.db.databaseName);
  console.log('Host:', mongoose.connection.host);
  mongoose.connection.close();
  process.exit(0);
})
.catch((err) => {
  console.error('\n❌ ERROR:', err.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Check password is correct');
  console.log('2. Make sure database name is specified');
  console.log('3. Check if password needs URL encoding');
  console.log('4. Verify user "mtahirmusman2_db_user" exists in Atlas');
  process.exit(1);
});