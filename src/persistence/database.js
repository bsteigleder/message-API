import sqlite3 from 'sqlite3';

const databasePath = process.env.DATABASE_PATH || 'messages.sqlite';

export const db = new sqlite3.Database(databasePath);

export function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL
      )
    `, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

export function clearMessages() {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM messages', (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

export function closeDatabase() {
  return new Promise((resolve, reject) => {
    db.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}
