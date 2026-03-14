import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Open DB connection
const dbPromise = open({
  filename: path.join(__dirname, '..', 'database.sqlite'),
  driver: sqlite3.Database
});

export async function initDb() {
  const db = await dbPromise;

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS otps (
      key TEXT PRIMARY KEY,
      otp TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      isVerified INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS research_history (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      query TEXT NOT NULL,
      resultData TEXT NOT NULL,
      viewedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );
  `);

  return db;
}

export async function getDb() {
  return dbPromise;
}
