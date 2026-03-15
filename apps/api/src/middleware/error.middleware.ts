import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { ResponseUtil } from '../utils/api-response';

// Centralized error handling middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error for internal debugging
  logger.error('Unhandled Exception:', err.stack);

  // Return a standardized error response
  // Assuming a generic 500 status code for unhandled errors
  ResponseUtil.error(res, 'Internal Server Error', 500, err.message);
};
