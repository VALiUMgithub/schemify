import app from './app';
import { config } from './config/env';
import { logger } from './config/logger';

const startServer = () => {
  try {
    app.listen(config.port, () => {
      logger.info(`Server is starting in ${config.env} mode...`);
      logger.info(`Server is successfully running at http://localhost:${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
