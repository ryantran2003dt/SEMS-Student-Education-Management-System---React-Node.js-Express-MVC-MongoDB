const app = require('./app');
const config = require('./config/env');
const { connectDB } = require('./config/database');
const seedDatabase = require('./seed/seedData');

async function startServer() {
  try {
    await connectDB();
    
    // Seed initial demo data if database is empty
    await seedDatabase();

    const server = app.listen(config.port, () => {
      console.log(`=======================================================`);
      console.log(`🚀 SEMS Backend Server running on port ${config.port}`);
      console.log(`📡 API Base URL: http://localhost:${config.port}/api`);
      console.log(`🌐 Client Target: ${config.clientUrl}`);
      console.log(`=======================================================`);
    });

    const shutdown = async () => {
      console.log('\n[Server] Gracefully shutting down...');
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error('Fatal error starting SEMS server:', err);
    process.exit(1);
  }
}

startServer();
