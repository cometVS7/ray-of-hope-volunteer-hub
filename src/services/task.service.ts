import { Prisma, ReviewStatus, Role, TaskStatus, UserStatus } from '@prisma/client';
import prisma from '../config/database.js';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../utils/app-error.js';
import {
  CreateTaskInput,
  SafeTask,
  SafeTaskSubmission,
  SubmitTaskInput,
  SubmitTaskResponseData,
  TaskListResponse,
  TaskQueryFilters,
  VolunteerTaskQueryFilters,
} from '../types/index.js';

export const safeTaskSelect = {
  id: true,
  title: true,
  description: true,
  expectedHours: true,
  assignmentDate: true,
  deadline: true,
  status: true,
  assignedToId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  assignedTo: {
    select: {
      id: true,
      name: true,
      email: true,
      volunteerId: true,
      phone: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

const VALID_TASK_STATUSES = Object.values(TaskStatus);

export class TaskService {
  /**
   * Creates and assigns a new task (Admin only).
   * Initial status is strictly ASSIGNED.
   */
  public async createTask(input: CreateTaskInput, createdById: string): Promise<SafeTask> {
    const { title, description, expectedHours, assignmentDate, deadline, assignedToId } = input;

    // 1. Field validations
    if (!title || typeof title !== 'string' || title.trim() === '') {
      throw new BadRequestError('Task title is required and cannot be empty');
    }

    if (!description || typeof description !== 'string' || description.trim() === '') {
      throw new BadRequestError('Task description is required and cannot be empty');
    }

    const parsedHours = Number(expectedHours);
    if (isNaN(parsedHours) || parsedHours <= 0) {
      throw new BadRequestError('expectedHours must be a positive number greater than 0');
    }

    if (!assignmentDate) {
      throw new BadRequestError('assignmentDate is required');
    }
    const parsedAssignmentDate = new Date(assignmentDate);
    if (isNaN(parsedAssignmentDate.getTime())) {
      throw new BadRequestError('assignmentDate must be a valid date');
    }

    if (!deadline) {
      throw new BadRequestError('deadline is required');
    }
    const parsedDeadline = new Date(deadline);
    if (isNaN(parsedDeadline.getTime())) {
      throw new BadRequestError('deadline must be a valid date');
    }

    if (parsedDeadline.getTime() < parsedAssignmentDate.getTime()) {
      throw new BadRequestError('deadline must not be earlier than assignmentDate');
    }

    if (!assignedToId || typeof assignedToId !== 'string' || assignedToId.trim() === '') {
      throw new BadRequestError('assignedToId is required');
    }

    // 2. Validate assigned volunteer
    const assignedUser = await prisma.user.findUnique({
      where: { id: assignedToId.trim() },
      select: {
        id: true,
        role: true,
        status: true,
      },
    });

    if (!assignedUser) {
      throw new NotFoundError('Assigned volunteer not found');
    }

    if (assignedUser.role !== Role.VOLUNTEER) {
      throw new BadRequestError('Assigned user must have VOLUNTEER role');
    }

    if (assignedUser.status !== UserStatus.ACTIVE) {
      throw new BadRequestError('Cannot assign task to an inactive volunteer');
    }

    // 3. Validate creator admin
    const creatorUser = await prisma.user.findUnique({
      where: { id: createdById },
      select: {
        id: true,
        role: true,
      },
    });

    if (!creatorUser || creatorUser.role !== Role.ADMIN) {
      throw new ForbiddenError('Only an administrator can create and assign tasks');
    }

    // 4. Create task in DB
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        expectedHours: parsedHours,
        assignmentDate: parsedAssignmentDate,
        deadline: parsedDeadline,
        status: TaskStatus.ASSIGNED,
        assignedToId: assignedUser.id,
        createdById: creatorUser.id,
      },
      select: safeTaskSelect,
    });

    return task as SafeTask;
  }

  /**
   * Lists tasks with search, status filtering, volunteer filtering, and pagination (Admin only).
   */
  public async listTasks(filters: TaskQueryFilters): Promise<TaskListResponse> {
    const page = Math.max(1, Number(filters.page) || 1);
    const rawLimit = Number(filters.limit) || 20;
    const limit = Math.min(100, Math.max(1, rawLimit));

    const where: Prisma.TaskWhereInput = {};

    if (filters.status) {
      if (!VALID_TASK_STATUSES.includes(filters.status)) {
        throw new BadRequestError(`Invalid status. Allowed values: ${VALID_TASK_STATUSES.join(', ')}`);
      }
      where.status = filters.status;
    }

    if (filters.assignedToId && typeof filters.assignedToId === 'string' && filters.assignedToId.trim() !== '') {
      where.assignedToId = filters.assignedToId.trim();
    }

    if (filters.search && typeof filters.search === 'string' && filters.search.trim() !== '') {
      const term = filters.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        select: safeTaskSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      tasks: tasks as SafeTask[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Retrieves single task by UUID (Admin).
   */
  public async getTaskById(id: string): Promise<SafeTask> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new BadRequestError('Task ID parameter is required');
    }

    const task = await prisma.task.findUnique({
      where: { id: id.trim() },
      select: safeTaskSelect,
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    return task as SafeTask;
  }

  /**
   * Lists tasks assigned to the authenticated volunteer.
   * Scoped strictly to the logged-in user.
   */
  public async listVolunteerTasks(
    volunteerUserId: string,
    filters: VolunteerTaskQueryFilters
  ): Promise<TaskListResponse> {
    const page = Math.max(1, Number(filters.page) || 1);
    const rawLimit = Number(filters.limit) || 20;
    const limit = Math.min(100, Math.max(1, rawLimit));

    const where: Prisma.TaskWhereInput = {
      assignedToId: volunteerUserId,
    };

    if (filters.status) {
      if (!VALID_TASK_STATUSES.includes(filters.status)) {
        throw new BadRequestError(`Invalid status. Allowed values: ${VALID_TASK_STATUSES.join(', ')}`);
      }
      where.status = filters.status;
    }

    if (filters.search && typeof filters.search === 'string' && filters.search.trim() !== '') {
      const term = filters.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        select: safeTaskSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      tasks: tasks as SafeTask[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Retrieves a task by UUID for a volunteer.
   * Enforces that the task must belong to the requesting volunteer.
   */
  public async getVolunteerTaskById(taskId: string, volunteerUserId: string): Promise<SafeTask> {
    if (!taskId || typeof taskId !== 'string' || taskId.trim() === '') {
      throw new BadRequestError('Task ID parameter is required');
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId.trim() },
      select: safeTaskSelect,
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (task.assignedToId !== volunteerUserId) {
      throw new ForbiddenError('Access forbidden: task belongs to another volunteer');
    }

    return task as SafeTask;
  }

  /**
   * Submits a completed task for administrative review.
   * Atomically transitions task from ASSIGNED to SUBMITTED and creates TaskSubmission.
   */
  public async submitTask(
    taskId: string,
    volunteerUserId: string,
    input: SubmitTaskInput
  ): Promise<SubmitTaskResponseData> {
    if (!taskId || typeof taskId !== 'string' || taskId.trim() === '') {
      throw new BadRequestError('Task ID parameter is required');
    }

    const { actualHours, completionNotes } = input;

    // Validate actualHours
    if (actualHours === undefined || actualHours === null) {
      throw new BadRequestError('actualHours is required');
    }

    const hours = Number(actualHours);
    if (typeof actualHours !== 'number' || isNaN(hours) || !isFinite(hours)) {
      throw new BadRequestError('actualHours must be a valid number');
    }

    if (hours <= 0) {
      throw new BadRequestError('actualHours must be greater than 0');
    }

    if (hours > 24) {
      throw new BadRequestError('actualHours cannot exceed 24 hours');
    }

    // Validate completionNotes
    if (completionNotes === undefined || completionNotes === null || typeof completionNotes !== 'string') {
      throw new BadRequestError('completionNotes is required');
    }

    const trimmedNotes = completionNotes.trim();
    if (trimmedNotes === '') {
      throw new BadRequestError('completionNotes cannot be empty');
    }

    // Retrieve task with existing submission to verify ownership and state
    const task = await prisma.task.findUnique({
      where: { id: taskId.trim() },
      include: { submission: true },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Data isolation: task must belong to the authenticated volunteer
    if (task.assignedToId !== volunteerUserId) {
      throw new ForbiddenError('Access forbidden: task belongs to another volunteer');
    }

    // Check duplicate submission
    if (task.status === TaskStatus.SUBMITTED || task.submission !== null) {
      throw new ConflictError('Task has already been submitted');
    }

    // Task lifecycle check: only ASSIGNED tasks can be submitted
    if (task.status !== TaskStatus.ASSIGNED) {
      throw new BadRequestError('Only ASSIGNED tasks can be submitted');
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const submission = await tx.taskSubmission.create({
          data: {
            taskId: task.id,
            volunteerId: volunteerUserId,
            actualHours: hours,
            completionNotes: trimmedNotes,
            reviewStatus: ReviewStatus.PENDING,
            approvedHours: 0.0,
            reviewNotes: null,
            reviewedById: null,
            reviewedAt: null,
          },
          select: {
            id: true,
            taskId: true,
            actualHours: true,
            completionNotes: true,
            submittedAt: true,
            reviewStatus: true,
            approvedHours: true,
          },
        });

        const updatedTask = await tx.task.update({
          where: { id: task.id },
          data: {
            status: TaskStatus.SUBMITTED,
          },
          select: {
            id: true,
            title: true,
            status: true,
          },
        });

        return {
          task: updatedTask,
          submission,
        };
      });

      return result;
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError('Task has already been submitted');
      }
      throw error;
    }
  }

  /**
   * Retrieves the submission details for a task owned by the authenticated volunteer.
   */
  public async getVolunteerSubmission(
    taskId: string,
    volunteerUserId: string
  ): Promise<SafeTaskSubmission> {
    if (!taskId || typeof taskId !== 'string' || taskId.trim() === '') {
      throw new BadRequestError('Task ID parameter is required');
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId.trim() },
      select: {
        id: true,
        title: true,
        status: true,
        assignedToId: true,
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (task.assignedToId !== volunteerUserId) {
      throw new ForbiddenError('Access forbidden: task belongs to another volunteer');
    }

    const submission = await prisma.taskSubmission.findUnique({
      where: { taskId: task.id },
    });

    if (!submission) {
      throw new NotFoundError('Submission not found for this task');
    }

    return {
      id: submission.id,
      taskId: submission.taskId,
      volunteerId: submission.volunteerId,
      actualHours: submission.actualHours,
      completionNotes: submission.completionNotes,
      submittedAt: submission.submittedAt,
      reviewStatus: submission.reviewStatus,
      approvedHours: submission.approvedHours,
      reviewNotes: submission.reviewNotes,
      reviewedById: submission.reviewedById,
      reviewedAt: submission.reviewedAt,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      task: {
        id: task.id,
        title: task.title,
        status: task.status,
      },
    };
  }
}

export const taskService = new TaskService();
export default taskService;
