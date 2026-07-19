import { db } from '../persistence/database.js';

export function findMessageByText(message) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id FROM messages WHERE message = ?',
      [message],
      (error, row) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(row);
      },
    );
  });
}

export function createMessage(message) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO messages (message, created_at) VALUES (?, ?)',
      [message.message, message.createdAt],
      function insertMessage(error) {
        if (error) {
          reject(error);
          return;
        }

        resolve(this.lastID);
      },
    );
  });
}
