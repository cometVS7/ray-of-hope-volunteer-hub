import { Request, Response, NextFunction } from 'express';
import taskService from '../services/task.service.js';
import { sendSuccess } from '../utils/response.js';
import { TaskStatus } from '@prisma/client';
import { UnauthorizedError } from '../utils/app-error.js';

export class TaskController {
  // ==========================================
  // ADMIN HANDLERS
  // ==========================================

  /**
   * POST /api/admin/tasks
   * Create and assign a task.
   */
  public async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const { title, description, expectedHours, assignmentDate, deadline, assignedToId } = req.body;
      const createdById = req.user.userId;

      const task = await taskService.createTask(
        {
          title,
          description,
          expectedHours,
          assignmentDate,
          deadline,
          assignedToId,
        },
        createdById
      );

      sendSuccess(res, task, 'Task created and assigned successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/tasks
   * List all tasks with search, status filtering, volunteer filtering, and pagination.
   */
  public async listTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, status, assignedToId, page, limit } = req.query;

      const result = await taskService.listTasks({
        search: typeof search === 'string' ? search : undefined,
        status: typeof status === 'string' ? (status as TaskStatus) : undefined,
        assignedToId: typeof assignedToId === 'string' ? assignedToId : undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      sendSuccess(res, result, 'Tasks retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/tasks/:id
   * Get single task by ID with creator and volunteer info.
   */
  public async getTaskById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const task = await taskService.getTaskById(id);

      sendSuccess(res, task, 'Task retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // VOLUNTEER HANDLERS
  // ==========================================

  /**
   * GET /api/volunteer/tasks
   * List tasks assigned to the authenticated volunteer.
   */
  public async listVolunteerTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const { status, page, limit, search } = req.query;
      const volunteerUserId = req.user.userId;

      const result = await taskService.listVolunteerTasks(volunteerUserId, {
        status: typeof status === 'string' ? (status as TaskStatus) : undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        search: typeof search === 'string' ? search : undefined,
      });

      sendSuccess(res, result, 'Assigned tasks retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/volunteer/tasks/:id
   * Get single task assigned to the authenticated volunteer.
   */
  public async getVolunteerTaskById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const { id } = req.params;
      const volunteerUserId = req.user.userId;

      const task = await taskService.getVolunteerTaskById(id, volunteerUserId);

      sendSuccess(res, task, 'Task retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/volunteer/tasks/:id/submit
   * Submit a completed task for review.
   */
  public async submitTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const { id } = req.params;
      const volunteerUserId = req.user.userId;
      const { actualHours, completionNotes } = req.body;

      const result = await taskService.submitTask(id, volunteerUserId, {
        actualHours,
        completionNotes,
      });

      sendSuccess(res, result, 'Task submitted successfully for review', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/volunteer/tasks/:id/submission
   * Retrieve submission details for an assigned task.
   */
  public async getVolunteerSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const { id } = req.params;
      const volunteerUserId = req.user.userId;

      const submission = await taskService.getVolunteerSubmission(id, volunteerUserId);

      sendSuccess(res, submission, 'Task submission retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const taskController = new TaskController();
export default taskController;
