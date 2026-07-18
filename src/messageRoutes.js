import { Router } from 'express';
import { createMessage } from './messageRepository.js';

export const messageRouter = Router();

messageRouter.post('/', (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const newMessage = {
    message,
    createdAt: new Date().toISOString(),
  };

  createMessage(newMessage, (error, id) => {
    if (error) {
      return res.status(500).json({ error: 'Could not create message' });
    }

    return res.status(201).json({ id, ...newMessage });
  });
});
