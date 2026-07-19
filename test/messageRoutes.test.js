import request from 'supertest';

let app;
let initializeDatabase;
let clearMessages;
let closeDatabase;

beforeAll(async () => {
  process.env.DATABASE_PATH = ':memory:';

  ({ app } = await import('../src/app.js'));
  ({ initializeDatabase, clearMessages, closeDatabase } = await import('../src/persistence/database.js'));

  await initializeDatabase();
});

beforeEach(async () => {
  await clearMessages();
});

afterAll(async () => {
  await closeDatabase();
});

describe('POST /messages', () => {
  it('creates a message', async () => {
    const response = await request(app)
      .post('/messages')
      .send({ message: 'Hello test' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(Number),
      message: 'Hello test',
      createdAt: expect.any(String),
    });
  });

  it('rejects invalid messages', async () => {
    const response = await request(app)
      .post('/messages')
      .send({ message: 'hey' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Message must be at least 5 characters',
    });
  });

  it('rejects duplicated messages', async () => {
    await request(app)
      .post('/messages')
      .send({ message: 'Same message' });

    const response = await request(app)
      .post('/messages')
      .send({ message: 'Same message' });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: 'Message already exists',
    });
  });
});
