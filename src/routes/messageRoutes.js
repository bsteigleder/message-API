import { Router } from 'express';
import {
  countMessages,
  createMessage,
  deleteAllMessages,
  deleteMessageById,
  findMessageById,
  findMessageByText,
  listMessages,
} from '../repositories/messageRepository.js';
import { recordMessageSubmission } from '../metrics/metricsStore.js';

export const messageRouter = Router();

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function validateMessage(message) {
  if (typeof message !== 'string' || message.trim().length === 0) {
    return 'Message is required';
  }

  if (message.length < 5) {
    return 'Message must be at least 5 characters';
  }

  if (message.length > 200) {
    return 'Message must be at most 200 characters';
  }

  if (!/[a-z0-9]/i.test(message)) {
    return 'Message must contain at least one alphanumeric character';
  }

  return null;
}

function getPagination(query) {
  const limit = query.limit === undefined ? DEFAULT_LIMIT : Number(query.limit);
  const page = query.page === undefined ? 1 : Number(query.page);

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return { error: 'Limit must be between 1 and 100' };
  }

  if (!Number.isInteger(page) || page < 1) {
    return { error: 'Page must be greater than zero' };
  }

  return { limit, page, offset: (page - 1) * limit };
}

function getCreatedSince(value) {
  if (value === undefined) {
    return {};
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { createdSince: `${value}T00:00:00.000Z` };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return { error: 'createdSince must be a valid date or datetime' };
  }

  return { createdSince: date.toISOString() };
}

function getMessageQuery(value) {
  if (value === undefined) {
    return {};
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    return { error: 'query must not be empty' };
  }

  return { query: value };
}

function formatMessage(message) {
  return {
    id: message.id,
    message: message.message,
    createdAt: message.created_at,
  };
}

messageRouter.get('/', async (req, res) => {
  const pagination = getPagination(req.query);
  const createdSince = getCreatedSince(req.query.createdSince);
  const messageQuery = getMessageQuery(req.query.query);

  if (pagination.error) {
    return res.status(400).json({ error: pagination.error });
  }

  if (createdSince.error) {
    return res.status(400).json({ error: createdSince.error });
  }

  if (messageQuery.error) {
    return res.status(400).json({ error: messageQuery.error });
  }

  const filters = { ...pagination, ...createdSince, ...messageQuery };

  try {
    const [messages, total] = await Promise.all([
      listMessages(filters),
      countMessages(filters),
    ]);

    return res.json({
      data: messages.map(formatMessage),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Could not list messages' });
  }
});

messageRouter.get('/:id', async (req, res) => {
  try {
    const message = await findMessageById(req.params.id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    return res.json(formatMessage(message));
  } catch (error) {
    return res.status(500).json({ error: 'Could not get message' });
  }
});

messageRouter.post('/', async (req, res) => {
  const { message: rawMessage } = req.body;
  const message = typeof rawMessage === 'string' ? rawMessage.trim() : rawMessage;
  const validationError = validateMessage(message);

  if (validationError) {
    recordMessageSubmission('invalid');
    return res.status(400).json({ error: validationError });
  }

  try {
    const existingMessage = await findMessageByText(message);

    if (existingMessage) {
      recordMessageSubmission('invalid');
      return res.status(409).json({ error: 'Message already exists' });
    }

    const newMessage = {
      message,
      createdAt: new Date().toISOString(),
    };

    const id = await createMessage(newMessage);

    recordMessageSubmission('valid');
    return res.status(201).json({ id, ...newMessage });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      recordMessageSubmission('invalid');
      return res.status(409).json({ error: 'Message already exists' });
    }

    return res.status(500).json({ error: 'Could not create message' });
  }
});

messageRouter.delete('/', async (req, res) => {
  try {
    await deleteAllMessages();

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: 'Could not delete messages' });
  }
});

messageRouter.delete('/:id', async (req, res) => {
  try {
    const deletedMessages = await deleteMessageById(req.params.id);

    if (deletedMessages === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: 'Could not delete message' });
  }
});