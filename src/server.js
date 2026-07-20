import { app } from './app.js';
import { logger } from './logging/logger.js';
import { initializeDatabase } from './persistence/database.js';

const port = process.env.PORT || 3000;

process.on('uncaughtException', (error) => {
  logger.error('uncaught exception', { message: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('unhandled rejection', {
    message: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  process.exit(1);
});

initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      logger.info('server started', { port });
    });
  })
  .catch((error) => {
    logger.error('could not start server', { message: error.message, stack: error.stack });
    process.exit(1);
  });
