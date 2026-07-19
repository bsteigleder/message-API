import express from 'express';
import { messageRouter } from './routes/messageRoutes.js';

export const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/messages', messageRouter);
