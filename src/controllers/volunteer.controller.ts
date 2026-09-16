import { Request, Response, NextFunction } from 'express';
import volunteerService from '../services/volunteer.service.js';
import { sendSuccess } from '../utils/response.js';
import { UserStatus } from '@prisma/client';

export class VolunteerController {
  /**
   * POST /api/admin/volunteers
   * Creates a new volunteer.
   */
  public async createVolunteer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, phone } = req.body;
      const volunteer = await volunteerService.createVolunteer({
        name,
        email,
        password,
        phone,
      });

      sendSuccess(res, volunteer, 'Volunteer created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/volunteers
   * Lists volunteers with search, status filtering, and pagination.
   */
  public async listVolunteers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, status, page, limit } = req.query;

      const result = await volunteerService.listVolunteers({
        search: typeof search === 'string' ? search : undefined,
        status: typeof status === 'string' ? (status as UserStatus) : undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      sendSuccess(res, result, 'Volunteers retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/volunteers/:id
   * Retrieves an individual volunteer profile.
   */
  public async getVolunteerById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const volunteer = await volunteerService.getVolunteerById(id);

      sendSuccess(res, volunteer, 'Volunteer retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/volunteers/:id/status
   * Activates or deactivates a volunteer.
   */
  public async updateVolunteerStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const volunteer = await volunteerService.updateVolunteerStatus(id, status);

      sendSuccess(res, volunteer, 'Volunteer status updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const volunteerController = new VolunteerController();
export default volunteerController;
