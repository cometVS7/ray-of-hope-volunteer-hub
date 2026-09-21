import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../utils/app-error.js';

/**
 * Middleware that strictly enforces Master Administrator privileges.
 * Requires user to have Role.ADMIN and isMasterAdmin === true.
 */
export const requireMasterAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  if (req.user.role !== Role.ADMIN || !req.user.isMasterAdmin) {
    throw new ForbiddenError('Access forbidden: Master Administrator privileges required');
  }

  next();
};
