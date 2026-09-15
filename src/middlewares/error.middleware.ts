import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error.js';
import { ENV } from '../config/env.js';

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): Response => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      ...(ENV.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  console.error('Unhandled Server Error:', err);

  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    ...(ENV.NODE_ENV === 'development' && { stack: err.stack, error: err.message }),
  });
};
