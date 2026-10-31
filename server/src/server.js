/**
 * HTTP Server Entry Point
 * 
 * Purpose:
 * Starts the HTTP listener on the configured port.
 * 
 * Why in this file?
 * Decouples network binding from Express route configuration (in app.js).
 */

import app from './app.js';
import { config } from './config/config.js';

const server = app.listen(config.port, () => {
  console.log('====================================================');
  console.log(`☀️  SunPower Solar ERP Backend Server Running`);
  console.log(`📡 URL: http://localhost:${config.port}`);
  console.log(`🌱 Environment: ${config.nodeEnv}`);
  console.log(`🔒 Database: SQLite (${config.dbPath})`);
  console.log('====================================================');
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

