/**
 * Central Configuration Module
 * 
 * Purpose:
 * Consolidates all environment variables in one single place.
 * If an environment variable is not set, sensible defaults are applied.
 * 
 * Why in this file?
 * Prevents repeating `process.env.XYZ` across various controller and database files,
 * ensuring easy updates and clean testing.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'sunpower_super_secret_jwt_key_2026_evaluation_round',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  dbPath: process.env.DB_PATH || path.resolve(__dirname, '../../data/solar.db'),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
