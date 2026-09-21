import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service.js';
import { sendSuccess } from '../utils/response.js';
import { UnauthorizedError } from '../utils/app-error.js';

export class AuthController {
  /**
   * POST /api/auth/login
   */
  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, volunteerId, password } = req.body;
      const result = await authService.login({ email, volunteerId, password });
      sendSuccess(res, result, 'Login successful', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   */
  public async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const user = await authService.getCurrentUser(req.user.userId);
      sendSuccess(res, user, 'Authenticated user', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/auth/profile
   * Updates profile details (name, phone, email) for the authenticated user.
   */
  public async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const { name, phone, email, currentPassword } = req.body;
      const result = await authService.updateProfile(req.user.userId, {
        name,
        phone,
        email,
        currentPassword,
      });
      sendSuccess(res, result, 'Profile updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/auth/password
   * Securely changes password for the authenticated user.
   */
  public async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const { currentPassword, newPassword, confirmPassword } = req.body;
      const result = await authService.changePassword(req.user.userId, {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      sendSuccess(res, result, 'Password changed successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
export default authController;
