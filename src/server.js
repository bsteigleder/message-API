import express from 'express';
import { messageRouter } from './messageRoutes.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/messages', messageRouter);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
