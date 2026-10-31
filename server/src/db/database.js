/**
 * Database Connection & Initialization Module
 * 
 * Purpose:
 * Connects to the local SQLite database file using Node.js's native `node:sqlite` (DatabaseSync).
 * Automatically initializes tables from schema.sql on startup.
 * 
 * Why in this file?
 * Centralizes database singleton connection so all routes and controllers share the same
 * high-performance, synchronous connection with foreign keys and WAL mode enabled.
 */

import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the directory for the database file exists
const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Open or create SQLite database file
export const db = new DatabaseSync(config.dbPath);

// Enable WAL (Write-Ahead Logging) for better concurrent performance
db.exec('PRAGMA journal_mode = WAL;');
// Enforce Foreign Key relational constraints
db.exec('PRAGMA foreign_keys = ON;');
// Set busy timeout so concurrent processes wait rather than failing
db.exec('PRAGMA busy_timeout = 5000;');

// Load and apply table schema if not already initialized
export function initSchema() {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
  }
}

// Auto-run schema initialization
initSchema();

