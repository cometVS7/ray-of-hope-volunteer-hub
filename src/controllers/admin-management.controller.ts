import { Request, Response, NextFunction } from 'express';
import adminManagementService from '../services/admin-management.service.js';
import { sendSuccess } from '../utils/response.js';

export class AdminManagementController {
  /**
   * GET /api/admin/admins
   * Retrieves all administrator accounts.
   */
  public async listAdmins(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admins = await adminManagementService.listAdmins();
      sendSuccess(res, admins, 'Administrators retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/admins
   * Creates a new administrator account (Master Admin only).
   */
  public async createAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, phone } = req.body;
      const newAdmin = await adminManagementService.createAdmin({
        name,
        email,
        password,
        phone,
      });
      sendSuccess(res, newAdmin, 'Administrator account created successfully', 201);
    } catch (error) {
      next(error);
    }
  }
}

export const adminManagementController = new AdminManagementController();
export default adminManagementController;
