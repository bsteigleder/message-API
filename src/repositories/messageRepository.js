import { db } from '../persistence/database.js';

function buildListFilters({ createdSince, query }) {
  const conditions = [];
  const params = [];

  if (createdSince) {
    conditions.push('created_at >= ?');
    params.push(createdSince);
  }

  if (query) {
    conditions.push('message LIKE ?');
    params.push(`%${query}%`);
  }

  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}

export function listMessages({ limit, offset, createdSince, query }) {
  const filters = buildListFilters({ createdSince, query });

  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, message, created_at FROM messages ${filters.where} ORDER BY id ASC LIMIT ? OFFSET ?`,
      [...filters.params, limit, offset],
      (error, rows) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(rows);
      },
    );
  });
}

export function countMessages({ createdSince, query } = {}) {
  const filters = buildListFilters({ createdSince, query });

  return new Promise((resolve, reject) => {
    db.get(
      `SELECT COUNT(*) as total FROM messages ${filters.where}`,
      filters.params,
      (error, row) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(row.total);
      },
    );
  });
}

export function findMessageById(id) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, message, created_at FROM messages WHERE id = ?',
      [id],
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

export function deleteMessageById(id) {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM messages WHERE id = ?',
      [id],
      function deleteMessage(error) {
        if (error) {
          reject(error);
          return;
        }

        resolve(this.changes);
      },
    );
  });
}

export function deleteAllMessages() {
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
