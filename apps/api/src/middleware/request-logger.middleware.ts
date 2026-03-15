import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

// Middleware to log HTTP method, path, and response time
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Wait for the response to finish before logging the completed request
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
};
