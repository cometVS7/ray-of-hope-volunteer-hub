import { Request, Response, NextFunction } from 'express';
import taskReviewService from '../services/task-review.service.js';
import { sendSuccess } from '../utils/response.js';
import { UnauthorizedError } from '../utils/app-error.js';
import { ReviewStatus } from '@prisma/client';

export class TaskReviewController {
  /**
   * GET /api/admin/submissions
   * Lists task submissions with reviewStatus, volunteerId filters and pagination.
   */
  public async listSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reviewStatus, volunteerId, page, limit } = req.query;

      const result = await taskReviewService.listSubmissions({
        reviewStatus: typeof reviewStatus === 'string' ? (reviewStatus as ReviewStatus) : undefined,
        volunteerId: typeof volunteerId === 'string' ? volunteerId : undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      sendSuccess(res, result, 'Submissions retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/submissions/:id
   * Retrieves single task submission detail.
   */
  public async getSubmissionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const submission = await taskReviewService.getSubmissionById(id);

      sendSuccess(res, submission, 'Submission retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/submissions/:id/approve
   * Approves a task submission and credits official service hours.
   */
  public async approveSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const { id } = req.params;
      const adminUserId = req.user.userId;
      const { approvedHours, reviewNotes } = req.body;

      const submission = await taskReviewService.approveSubmission(id, adminUserId, {
        approvedHours,
        reviewNotes,
      });

      sendSuccess(res, submission, 'Task submission approved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/submissions/:id/reject
   * Rejects a task submission with mandatory feedback.
   */
  public async rejectSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const { id } = req.params;
      const adminUserId = req.user.userId;
      const { reviewNotes } = req.body;

      const submission = await taskReviewService.rejectSubmission(id, adminUserId, {
        reviewNotes,
      });

      sendSuccess(res, submission, 'Task submission rejected successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/volunteers/:id/hours
   * Retrieves official approved service hours for a specified volunteer.
   */
  public async getVolunteerHoursForAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await taskReviewService.getVolunteerApprovedHoursForAdmin(id);

      sendSuccess(res, result, 'Volunteer official hours retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/volunteer/hours
   * Retrieves official approved service hours for the authenticated volunteer.
   */
  public async getMyVolunteerHours(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const volunteerUserId = req.user.userId;
      const result = await taskReviewService.getVolunteerApprovedHours(volunteerUserId);

      sendSuccess(res, result, 'Official service hours retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const taskReviewController = new TaskReviewController();
export default taskReviewController;
