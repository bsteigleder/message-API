import { Router } from 'express';
import { countMessages } from '../repositories/messageRepository.js';
import {
  getMessageSubmissionStats,
  getRequestStats,
  getResponseStats,
} from '../metrics/metricsStore.js';

export const statsRouter = Router();

statsRouter.get('/messages', async (req, res) => {
  try {
    const totalStored = await countMessages();

    return res.json({
      totalStored,
      submissions: getMessageSubmissionStats(),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Could not get message stats' });
  }
});

statsRouter.get('/requests', (req, res) => {
  res.json(getRequestStats());
});

statsRouter.get('/responses', (req, res) => {
  res.json(getResponseStats());
});

statsRouter.get('/service', (req, res) => {
  res.json({
    uptimeSeconds: Math.floor(process.uptime()),
  });
});
