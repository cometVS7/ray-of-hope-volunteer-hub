import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../utils/app-error.js';

/**
 * Middleware that authenticates incoming requests using a Bearer JWT.
 * Extracts the token from the Authorization header, verifies it,
 * and attaches the authenticated user payload to req.user.
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authentication token missing or malformed');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new UnauthorizedError('Authentication token missing');
  }

  const payload = verifyToken(token);
  req.user = payload;

  next();
};
