import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../utils/app-error.js';

/**
 * Middleware factory for Role-Based Access Control (RBAC).
 * Enforces that req.user has one of the allowed roles.
 *
 * @param allowedRoles List of roles permitted to access the route
 */
export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError('Access forbidden: insufficient permissions for this resource');
    }

    next();
  };
};

/**
 * Convenience middleware for Admin-only routes.
 */
export const requireAdmin = requireRole(Role.ADMIN);

/**
 * Convenience middleware for Volunteer-only routes.
 */
export const requireVolunteer = requireRole(Role.VOLUNTEER);
