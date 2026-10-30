const { connectDB, disconnectDB } = require('../config/database');
const seedDatabase = require('./seedData');

async function run() {
  try {
    await connectDB();
    await seedDatabase();
    console.log('[SeedRunner] Seeding script completed.');
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[SeedRunner] Error during seeding:', err);
    process.exit(1);
  }
}

run();
