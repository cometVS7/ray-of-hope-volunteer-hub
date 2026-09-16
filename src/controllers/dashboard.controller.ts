import { Request, Response, NextFunction } from 'express';
import dashboardService from '../services/dashboard.service.js';
import { sendSuccess } from '../utils/response.js';
import { UnauthorizedError } from '../utils/app-error.js';

export class DashboardController {
  /**
   * GET /api/admin/dashboard
   * Retrieves overall administrator dashboard statistics and recent activity.
   */
  public async getAdminDashboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await dashboardService.getAdminDashboard();
      sendSuccess(res, result, 'Admin dashboard statistics retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/dashboard/volunteers
   * Retrieves volunteer-level task statistics and official hours.
   */
  public async getAdminVolunteerStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await dashboardService.getAdminVolunteerStats();
      sendSuccess(res, result, 'Volunteer statistics retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/dashboard/tasks
   * Retrieves task statistics breakdown by status.
   */
  public async getAdminTaskStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await dashboardService.getAdminTaskStats();
      sendSuccess(res, result, 'Task statistics retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/volunteer/dashboard
   * Retrieves personalized dashboard for the authenticated volunteer.
   */
  public async getVolunteerDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const result = await dashboardService.getVolunteerDashboard(req.user.userId);
      sendSuccess(res, result, 'Volunteer dashboard retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
export default dashboardController;
