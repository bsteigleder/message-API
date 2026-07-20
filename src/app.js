import express from 'express';
import { logger } from './logging/logger.js';
import { loggingMiddleware } from './middleware/loggingMiddleware.js';
import { metricsMiddleware } from './middleware/metricsMiddleware.js';
import { messageRouter } from './routes/messageRoutes.js';
import { statsRouter } from './routes/statsRoutes.js';

export const app = express();

app.use(express.json());
app.use(loggingMiddleware);
app.use(metricsMiddleware);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/messages', messageRouter);
app.use('/stats', statsRouter);

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }

  logger.error('unhandled request error', {
    method: req.method,
    path: req.originalUrl,
    message: err.message,
    stack: err.stack,
  });

  return res.status(500).json({ error: 'Internal server error' });
});
