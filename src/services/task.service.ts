import { Prisma, Role, TaskStatus, UserStatus } from '@prisma/client';
import prisma from '../config/database.js';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../utils/app-error.js';
import {
  CreateTaskInput,
  SafeTask,
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
}

export const taskService = new TaskService();
export default taskService;
