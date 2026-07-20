import express from 'express';
import { metricsMiddleware } from './middleware/metricsMiddleware.js';
import { messageRouter } from './routes/messageRoutes.js';
import { statsRouter } from './routes/statsRoutes.js';

export const app = express();

app.use(express.json());
app.use(metricsMiddleware);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/messages', messageRouter);
app.use('/stats', statsRouter);
