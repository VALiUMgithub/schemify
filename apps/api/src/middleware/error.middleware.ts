import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { ResponseUtil } from '../utils/api-response';

type AppErrorLike = Error & {
  statusCode?: number;
  code?: string;
  details?: unknown;
};

// Centralized error handling middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const appError = err as AppErrorLike;

  // Log the error for internal debugging
  logger.error('Unhandled Exception:', err.stack ?? err.message);

  const statusCode = appError.statusCode && appError.statusCode >= 400 && appError.statusCode < 600
    ? appError.statusCode
    : 500;

  const isServerError = statusCode >= 500;
  const message = isServerError ? 'Internal Server Error' : err.message;
  const errorDetails = isServerError ? err.message : undefined;

  // Return a standardized error response while preserving business validation details.
  ResponseUtil.error(res, message, statusCode, errorDetails, appError.code, appError.details);
};
