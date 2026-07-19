import sqlite3 from 'sqlite3';

export const db = new sqlite3.Database('messages.sqlite');

db.run(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
  )
`);
