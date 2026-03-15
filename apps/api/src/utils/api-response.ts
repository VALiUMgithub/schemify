import { Response } from 'express';

// Standardized API response format
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Utility class to generate consistent API responses
export class ResponseUtil {
  static success<T>(res: Response, data: T, message = 'Success', statusCode = 200) {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
    };
    return res.status(statusCode).json(response);
  }

  static error(res: Response, message: string, statusCode = 500, errorDetails?: string) {
    const response: ApiResponse = {
      success: false,
      message,
      error: errorDetails,
    };
    return res.status(statusCode).json(response);
  }
}
