const mongoose = require('mongoose');
const config = require('./env');

let memoryServer = null;

async function connectDB() {
  try {
    mongoose.set('strictQuery', false);
    console.log(`[DB] Attempting connection to MongoDB at: ${config.mongodbUri}...`);
    
    // Attempt standard connection with 3s timeout
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('[DB] Successfully connected to MongoDB database.');
  } catch (err) {
    console.warn(`[DB] Could not connect to primary MongoDB at ${config.mongodbUri} (${err.message}).`);
    
    // Attempt in-memory MongoDB fallback for local development testing
    try {
      console.log('[DB] Attempting to initialize in-memory MongoDB fallback...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const uri = memoryServer.getUri();
      console.log(`[DB] In-Memory MongoDB running at: ${uri}`);
      await mongoose.connect(uri);
      console.log('[DB] Connected successfully to In-Memory MongoDB fallback.');
    } catch (memErr) {
      console.error('[DB] Failed to connect to MongoDB and memory server fallback:', memErr.message);
      throw err;
    }
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
}

module.exports = { connectDB, disconnectDB };
