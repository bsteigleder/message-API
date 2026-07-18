import { db } from './database.js';

export function createMessage(message, callback) {
  db.run(
    'INSERT INTO messages (message, created_at) VALUES (?, ?)',
    [message.message, message.createdAt],
    function insertMessage(error) {
      callback(error, this.lastID);
    },
  );
}
