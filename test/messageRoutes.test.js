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


describe('GET /messages/:id', () => {
  it('returns a message by id', async () => {
    const createdMessage = await request(app)
      .post('/messages')
      .send({ message: 'Find me' });

    const response = await request(app)
      .get(`/messages/${createdMessage.body.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(createdMessage.body);
  });

  it('returns 404 when the message does not exist', async () => {
    const response = await request(app).get('/messages/999');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: 'Message not found',
    });
  });
});

describe('GET /messages', () => {
  it('returns messages with page and limit', async () => {
    await request(app).post('/messages').send({ message: 'First message' });
    await request(app).post('/messages').send({ message: 'Second message' });
    await request(app).post('/messages').send({ message: 'Third message' });

    const response = await request(app).get('/messages?page=2&limit=2');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data.map((message) => message.message)).toEqual([
      'Third message',
    ]);
    expect(response.body.pagination).toEqual({
      page: 2,
      limit: 2,
      total: 3,
    });
  });

  it('rejects limits above the maximum', async () => {
    const response = await request(app).get('/messages?limit=101');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Limit must be between 1 and 100',
    });
  });
});
describe('GET /messages createdSince filter', () => {
  it('filters messages by date', async () => {
    await request(app).post('/messages').send({ message: 'Date filter message' });

    const response = await request(app).get('/messages?createdSince=1970-01-01');

    expect(response.status).toBe(200);
    expect(response.body.data.map((message) => message.message)).toContain('Date filter message');
  });

  it('filters messages by datetime', async () => {
    await request(app).post('/messages').send({ message: 'Datetime filter message' });

    const response = await request(app).get('/messages?createdSince=2999-01-01T00:00:00.000Z');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.pagination.total).toBe(0);
  });

  it('rejects invalid createdSince values', async () => {
    const response = await request(app).get('/messages?createdSince=not-a-date');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'createdSince must be a valid date or datetime',
    });
  });
});
describe('GET /messages query filter', () => {
  it('filters messages by query', async () => {
    await request(app).post('/messages').send({ message: 'Alpha message' });
    await request(app).post('/messages').send({ message: 'Beta message' });

    const response = await request(app).get('/messages?query=Alpha');

    expect(response.status).toBe(200);
    expect(response.body.data.map((message) => message.message)).toEqual([
      'Alpha message',
    ]);
    expect(response.body.pagination.total).toBe(1);
  });

  it('rejects empty query filters', async () => {
    const response = await request(app).get('/messages?query=');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'query must not be empty',
    });
  });
});