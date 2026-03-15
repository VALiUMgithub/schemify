import { Request, Response } from 'express';
import { ResponseUtil } from '../utils/api-response';

export const healthCheck = (req: Request, res: Response) => {
  // Return the standard API response format for the health check
  return ResponseUtil.success(res, { timestamp: new Date() }, 'API is running');
};
