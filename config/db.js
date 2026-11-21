const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://angad933577_db_user:J6Tf8Xj8yCps34iJ@cluster0.z2ejppw.mongodb.net/todoApp?retryWrites=true&w=majority';
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 4000,
    });
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ MongoDB Connection Error: ${error.message}`);
    console.log(`📁 Local Storage Active: App will work 100% smoothly offline!`);
    return false;
  }
};

module.exports = connectDB;
