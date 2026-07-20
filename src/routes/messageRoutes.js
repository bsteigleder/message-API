import { Router } from 'express';
import { createMessage, findMessageById, findMessageByText } from '../repositories/messageRepository.js';

export const messageRouter = Router();

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

messageRouter.get('/:id', async (req, res) => {
  try {
    const message = await findMessageById(req.params.id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    return res.json({
      id: message.id,
      message: message.message,
      createdAt: message.created_at,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Could not get message' });
  }
});

messageRouter.post('/', async (req, res) => {
  const { message } = req.body;
  const validationError = validateMessage(message);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const existingMessage = await findMessageByText(message);

    if (existingMessage) {
      return res.status(409).json({ error: 'Message already exists' });
    }

    const newMessage = {
      message,
      createdAt: new Date().toISOString(),
    };

    const id = await createMessage(newMessage);

    return res.status(201).json({ id, ...newMessage });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ error: 'Message already exists' });
    }

    return res.status(500).json({ error: 'Could not create message' });
  }
});
