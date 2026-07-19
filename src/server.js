import { app } from './app.js';
import { initializeDatabase } from './persistence/database.js';

const port = process.env.PORT || 3000;

initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Could not start server', error);
    process.exit(1);
  });
