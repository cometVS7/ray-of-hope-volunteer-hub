import { Prisma, ReviewStatus, Role, TaskStatus } from '@prisma/client';
import prisma from '../config/database.js';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../utils/app-error.js';
import {
  AdminVolunteerHoursResponse,
  ApproveSubmissionInput,
  RejectSubmissionInput,
  SafeSubmissionDetail,
  SafeSubmissionListItem,
  SubmissionListResponse,
  SubmissionQueryFilters,
  VolunteerHoursResponse,
} from '../types/index.js';

const VALID_REVIEW_STATUSES = Object.values(ReviewStatus);

export class TaskReviewService {
  /**
   * Lists task submissions with optional reviewStatus, volunteerId filtering and pagination (Admin only).
   */
  public async listSubmissions(filters: SubmissionQueryFilters): Promise<SubmissionListResponse> {
    const page = Math.max(1, filters.page ? Number(filters.page) : 1);
    const limit = Math.min(100, Math.max(1, filters.limit ? Number(filters.limit) : 10));
    const skip = (page - 1) * limit;

    const where: Prisma.TaskSubmissionWhereInput = {};

    if (filters.reviewStatus) {
      if (!VALID_REVIEW_STATUSES.includes(filters.reviewStatus)) {
        throw new BadRequestError(
          `Invalid reviewStatus filter. Allowed values: ${VALID_REVIEW_STATUSES.join(', ')}`
        );
      }
      where.reviewStatus = filters.reviewStatus;
    }

    if (filters.volunteerId && typeof filters.volunteerId === 'string' && filters.volunteerId.trim() !== '') {
      const volId = filters.volunteerId.trim();
      where.OR = [
        { volunteerId: volId },
        { volunteer: { volunteerId: volId } },
      ];
    }

    const [submissions, totalItems] = await Promise.all([
      prisma.taskSubmission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              expectedHours: true,
              status: true,
            },
          },
          volunteer: {
            select: {
              id: true,
              name: true,
              volunteerId: true,
            },
          },
        },
      }),
      prisma.taskSubmission.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    const mappedSubmissions: SafeSubmissionListItem[] = submissions.map((sub) => ({
      id: sub.id,
      task: {
        id: sub.task.id,
        title: sub.task.title,
        expectedHours: sub.task.expectedHours,
        status: sub.task.status,
      },
      volunteer: {
        id: sub.volunteer.id,
        name: sub.volunteer.name,
        volunteerId: sub.volunteer.volunteerId,
      },
      actualHours: sub.actualHours,
      completionNotes: sub.completionNotes,
      submittedAt: sub.submittedAt,
      reviewStatus: sub.reviewStatus,
      approvedHours: sub.approvedHours,
      reviewNotes: sub.reviewNotes,
      reviewedAt: sub.reviewedAt,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    }));

    return {
      submissions: mappedSubmissions,
      pagination: {
        page,
        limit,
        total: totalItems,
        totalPages,
      },
    };
  }

  /**
   * Retrieves single task submission detail for administrative review (Admin only).
   */
  public async getSubmissionById(submissionId: string): Promise<SafeSubmissionDetail> {
    if (!submissionId || typeof submissionId !== 'string' || submissionId.trim() === '') {
      throw new BadRequestError('Submission ID parameter is required');
    }

    const submission = await prisma.taskSubmission.findUnique({
      where: { id: submissionId.trim() },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            description: true,
            expectedHours: true,
            assignmentDate: true,
            deadline: true,
            status: true,
          },
        },
        volunteer: {
          select: {
            id: true,
            name: true,
            email: true,
            volunteerId: true,
            phone: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundError('Task submission not found');
    }

    return {
      id: submission.id,
      task: {
        id: submission.task.id,
        title: submission.task.title,
        description: submission.task.description,
        expectedHours: submission.task.expectedHours,
        assignmentDate: submission.task.assignmentDate,
        deadline: submission.task.deadline,
        status: submission.task.status,
      },
      volunteer: {
        id: submission.volunteer.id,
        name: submission.volunteer.name,
        email: submission.volunteer.email,
        volunteerId: submission.volunteer.volunteerId,
        phone: submission.volunteer.phone,
      },
      actualHours: submission.actualHours,
      completionNotes: submission.completionNotes,
      submittedAt: submission.submittedAt,
      reviewStatus: submission.reviewStatus,
      approvedHours: submission.approvedHours,
      reviewNotes: submission.reviewNotes,
      reviewedBy: submission.reviewedBy,
      reviewedById: submission.reviewedById,
      reviewedAt: submission.reviewedAt,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    };
  }

  /**
   * Approves a task submission with approvedHours and optional reviewNotes.
   * Atomically sets reviewStatus = APPROVED and Task.status = APPROVED.
   */
  public async approveSubmission(
    submissionId: string,
    adminUserId: string,
    input: ApproveSubmissionInput
  ): Promise<SafeSubmissionDetail> {
    if (!submissionId || typeof submissionId !== 'string' || submissionId.trim() === '') {
      throw new BadRequestError('Submission ID parameter is required');
    }

    const { approvedHours, reviewNotes } = input;

    // Validate approvedHours
    if (approvedHours === undefined || approvedHours === null) {
      throw new BadRequestError('approvedHours is required');
    }

    const hours = Number(approvedHours);
    if (typeof approvedHours !== 'number' || isNaN(hours) || !isFinite(hours)) {
      throw new BadRequestError('approvedHours must be a valid number');
    }

    if (hours <= 0) {
      throw new BadRequestError('approvedHours must be greater than 0');
    }

    // Retrieve submission with task to verify current state
    const submission = await prisma.taskSubmission.findUnique({
      where: { id: submissionId.trim() },
      include: { task: true },
    });

    if (!submission) {
      throw new NotFoundError('Task submission not found');
    }

    // Double review prevention
    if (
      submission.reviewStatus === ReviewStatus.APPROVED ||
      submission.reviewStatus === ReviewStatus.REJECTED
    ) {
      throw new ConflictError('Task submission has already been reviewed');
    }

    if (submission.reviewStatus !== ReviewStatus.PENDING) {
      throw new BadRequestError('Only PENDING submissions can be approved');
    }

    if (submission.task.status !== TaskStatus.SUBMITTED) {
      throw new BadRequestError('Only tasks with SUBMITTED status can be approved');
    }

    // Bound checks: approvedHours cannot exceed actualHours OR task expectedHours
    if (hours > submission.actualHours) {
      throw new BadRequestError(
        `approvedHours (${hours}) cannot exceed actual hours worked (${submission.actualHours})`
      );
    }

    if (hours > submission.task.expectedHours) {
      throw new BadRequestError(
        `approvedHours (${hours}) cannot exceed task expected hours (${submission.task.expectedHours})`
      );
    }

    // Optional reviewNotes
    let trimmedNotes: string | null = null;
    if (reviewNotes !== undefined && reviewNotes !== null) {
      const trimmed = String(reviewNotes).trim();
      trimmedNotes = trimmed.length > 0 ? trimmed : null;
    }

    const reviewedAt = new Date();

    // Atomic transaction: update submission and task
    const updated = await prisma.$transaction(async (tx) => {
      const sub = await tx.taskSubmission.update({
        where: { id: submission.id },
        data: {
          reviewStatus: ReviewStatus.APPROVED,
          approvedHours: hours,
          reviewNotes: trimmedNotes,
          reviewedById: adminUserId,
          reviewedAt,
        },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              description: true,
              expectedHours: true,
              assignmentDate: true,
              deadline: true,
              status: true,
            },
          },
          volunteer: {
            select: {
              id: true,
              name: true,
              email: true,
              volunteerId: true,
              phone: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      await tx.task.update({
        where: { id: submission.taskId },
        data: {
          status: TaskStatus.APPROVED,
        },
      });

      return sub;
    });

    return {
      id: updated.id,
      task: {
        id: updated.task.id,
        title: updated.task.title,
        description: updated.task.description,
        expectedHours: updated.task.expectedHours,
        assignmentDate: updated.task.assignmentDate,
        deadline: updated.task.deadline,
        status: TaskStatus.APPROVED,
      },
      volunteer: {
        id: updated.volunteer.id,
        name: updated.volunteer.name,
        email: updated.volunteer.email,
        volunteerId: updated.volunteer.volunteerId,
        phone: updated.volunteer.phone,
      },
      actualHours: updated.actualHours,
      completionNotes: updated.completionNotes,
      submittedAt: updated.submittedAt,
      reviewStatus: updated.reviewStatus,
      approvedHours: updated.approvedHours,
      reviewNotes: updated.reviewNotes,
      reviewedBy: updated.reviewedBy,
      reviewedById: updated.reviewedById,
      reviewedAt: updated.reviewedAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Rejects a task submission with mandatory reviewNotes.
   * Atomically sets reviewStatus = REJECTED, approvedHours = 0, and Task.status = REJECTED.
   */
  public async rejectSubmission(
    submissionId: string,
    adminUserId: string,
    input: RejectSubmissionInput
  ): Promise<SafeSubmissionDetail> {
    if (!submissionId || typeof submissionId !== 'string' || submissionId.trim() === '') {
      throw new BadRequestError('Submission ID parameter is required');
    }

    const { reviewNotes } = input;

    // Validate mandatory reviewNotes
    if (!reviewNotes || typeof reviewNotes !== 'string' || reviewNotes.trim() === '') {
      throw new BadRequestError('reviewNotes is required for rejection');
    }

    const trimmedNotes = reviewNotes.trim();

    // Retrieve submission with task to verify current state
    const submission = await prisma.taskSubmission.findUnique({
      where: { id: submissionId.trim() },
      include: { task: true },
    });

    if (!submission) {
      throw new NotFoundError('Task submission not found');
    }

    // Double review prevention
    if (
      submission.reviewStatus === ReviewStatus.APPROVED ||
      submission.reviewStatus === ReviewStatus.REJECTED
    ) {
      throw new ConflictError('Task submission has already been reviewed');
    }

    if (submission.reviewStatus !== ReviewStatus.PENDING) {
      throw new BadRequestError('Only PENDING submissions can be rejected');
    }

    if (submission.task.status !== TaskStatus.SUBMITTED) {
      throw new BadRequestError('Only tasks with SUBMITTED status can be rejected');
    }

    const reviewedAt = new Date();

    // Atomic transaction: update submission and task
    const updated = await prisma.$transaction(async (tx) => {
      const sub = await tx.taskSubmission.update({
        where: { id: submission.id },
        data: {
          reviewStatus: ReviewStatus.REJECTED,
          approvedHours: 0,
          reviewNotes: trimmedNotes,
          reviewedById: adminUserId,
          reviewedAt,
        },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              description: true,
              expectedHours: true,
              assignmentDate: true,
              deadline: true,
              status: true,
            },
          },
          volunteer: {
            select: {
              id: true,
              name: true,
              email: true,
              volunteerId: true,
              phone: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      await tx.task.update({
        where: { id: submission.taskId },
        data: {
          status: TaskStatus.REJECTED,
        },
      });

      return sub;
    });

    return {
      id: updated.id,
      task: {
        id: updated.task.id,
        title: updated.task.title,
        description: updated.task.description,
        expectedHours: updated.task.expectedHours,
        assignmentDate: updated.task.assignmentDate,
        deadline: updated.task.deadline,
        status: TaskStatus.REJECTED,
      },
      volunteer: {
        id: updated.volunteer.id,
        name: updated.volunteer.name,
        email: updated.volunteer.email,
        volunteerId: updated.volunteer.volunteerId,
        phone: updated.volunteer.phone,
      },
      actualHours: updated.actualHours,
      completionNotes: updated.completionNotes,
      submittedAt: updated.submittedAt,
      reviewStatus: updated.reviewStatus,
      approvedHours: updated.approvedHours,
      reviewNotes: updated.reviewNotes,
      reviewedBy: updated.reviewedBy,
      reviewedById: updated.reviewedById,
      reviewedAt: updated.reviewedAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Calculates official service hours dynamically for the authenticated volunteer.
   * SUM(approvedHours) WHERE volunteerId = :volunteerId AND reviewStatus = 'APPROVED'
   */
  public async getVolunteerApprovedHours(volunteerUserId: string): Promise<VolunteerHoursResponse> {
    const user = await prisma.user.findUnique({
      where: { id: volunteerUserId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== Role.VOLUNTEER) {
      throw new NotFoundError('Volunteer not found');
    }

    const aggregate = await prisma.taskSubmission.aggregate({
      where: {
        volunteerId: volunteerUserId,
        reviewStatus: ReviewStatus.APPROVED,
      },
      _sum: {
        approvedHours: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      officialServiceHours: aggregate._sum.approvedHours ?? 0,
      approvedSubmissions: aggregate._count.id,
    };
  }

  /**
   * Calculates official service hours dynamically for any volunteer by UUID or volunteerId (Admin only).
   */
  public async getVolunteerApprovedHoursForAdmin(
    volunteerIdOrUuid: string
  ): Promise<AdminVolunteerHoursResponse> {
    if (!volunteerIdOrUuid || typeof volunteerIdOrUuid !== 'string' || volunteerIdOrUuid.trim() === '') {
      throw new BadRequestError('Volunteer ID parameter is required');
    }

    const trimmed = volunteerIdOrUuid.trim();

    const volunteer = await prisma.user.findFirst({
      where: {
        OR: [
          { id: trimmed },
          { volunteerId: trimmed },
        ],
        role: Role.VOLUNTEER,
      },
      select: {
        id: true,
        name: true,
        volunteerId: true,
      },
    });

    if (!volunteer) {
      throw new NotFoundError('Volunteer not found');
    }

    const aggregate = await prisma.taskSubmission.aggregate({
      where: {
        volunteerId: volunteer.id,
        reviewStatus: ReviewStatus.APPROVED,
      },
      _sum: {
        approvedHours: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      volunteer: {
        id: volunteer.id,
        name: volunteer.name,
        volunteerId: volunteer.volunteerId,
      },
      officialServiceHours: aggregate._sum.approvedHours ?? 0,
      approvedSubmissions: aggregate._count.id,
    };
  }
}

export const taskReviewService = new TaskReviewService();
export default taskReviewService;
