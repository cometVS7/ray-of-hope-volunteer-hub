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
}

export const authController = new AuthController();
export default authController;
