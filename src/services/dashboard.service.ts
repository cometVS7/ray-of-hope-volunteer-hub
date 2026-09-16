import { ReviewStatus, Role, TaskStatus, UserStatus } from '@prisma/client';
import prisma from '../config/database.js';
import { NotFoundError } from '../utils/app-error.js';
import {
  AdminDashboardResponse,
  AdminTaskStatisticsResponse,
  RecentTaskItem,
  VolunteerDashboardResponse,
  VolunteerStatisticsItem,
} from '../types/index.js';

export class DashboardService {
  /**
   * Retrieves overall administrator dashboard statistics and recent tasks.
   * Real database-backed calculations.
   */
  public async getAdminDashboard(): Promise<AdminDashboardResponse> {
    const [
      totalVolunteers,
      activeVolunteers,
      totalTasks,
      tasksByStatus,
      totalSubmissions,
      submissionsByStatus,
      hoursAggregate,
      recentTasksRaw,
    ] = await Promise.all([
      prisma.user.count({ where: { role: Role.VOLUNTEER } }),
      prisma.user.count({ where: { role: Role.VOLUNTEER, status: UserStatus.ACTIVE } }),
      prisma.task.count(),
      prisma.task.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.taskSubmission.count(),
      prisma.taskSubmission.groupBy({
        by: ['reviewStatus'],
        _count: { id: true },
      }),
      prisma.taskSubmission.aggregate({
        where: { reviewStatus: ReviewStatus.APPROVED },
        _sum: { approvedHours: true },
      }),
      prisma.task.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          assignmentDate: true,
          deadline: true,
          createdAt: true,
          assignedTo: {
            select: {
              name: true,
              volunteerId: true,
            },
          },
        },
      }),
    ]);

    const taskCounts = {
      assigned: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
    };
    for (const group of tasksByStatus) {
      if (group.status === TaskStatus.ASSIGNED) taskCounts.assigned = group._count.id;
      if (group.status === TaskStatus.SUBMITTED) taskCounts.submitted = group._count.id;
      if (group.status === TaskStatus.APPROVED) taskCounts.approved = group._count.id;
      if (group.status === TaskStatus.REJECTED) taskCounts.rejected = group._count.id;
    }

    const subCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };
    for (const group of submissionsByStatus) {
      if (group.reviewStatus === ReviewStatus.PENDING) subCounts.pending = group._count.id;
      if (group.reviewStatus === ReviewStatus.APPROVED) subCounts.approved = group._count.id;
      if (group.reviewStatus === ReviewStatus.REJECTED) subCounts.rejected = group._count.id;
    }

    const recentTasks: RecentTaskItem[] = recentTasksRaw.map((t) => ({
      id: t.id,
      title: t.title,
      volunteer: {
        name: t.assignedTo.name,
        volunteerId: t.assignedTo.volunteerId,
      },
      status: t.status,
      assignmentDate: t.assignmentDate,
      deadline: t.deadline,
      createdAt: t.createdAt,
    }));

    return {
      volunteers: {
        total: totalVolunteers,
        active: activeVolunteers,
        inactive: Math.max(0, totalVolunteers - activeVolunteers),
      },
      tasks: {
        total: totalTasks,
        ...taskCounts,
      },
      submissions: {
        total: totalSubmissions,
        ...subCounts,
      },
      serviceHours: {
        official: hoursAggregate._sum.approvedHours ?? 0,
      },
      recentTasks,
    };
  }

  /**
   * Retrieves volunteer-level task statistics and official service hours for Admin.
   * Dynamically derived directly from Task and TaskSubmission records.
   */
  public async getAdminVolunteerStats(): Promise<VolunteerStatisticsItem[]> {
    const volunteers = await prisma.user.findMany({
      where: { role: Role.VOLUNTEER },
      select: {
        id: true,
        name: true,
        volunteerId: true,
        status: true,
        assignedTasks: {
          select: {
            id: true,
            status: true,
          },
        },
        submissions: {
          select: {
            reviewStatus: true,
            approvedHours: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return volunteers.map((vol) => {
      const taskCount = vol.assignedTasks.length;
      const approvedTaskCount = vol.assignedTasks.filter(
        (t) => t.status === TaskStatus.APPROVED
      ).length;
      const pendingTaskCount = vol.submissions.filter(
        (s) => s.reviewStatus === ReviewStatus.PENDING
      ).length;
      const rejectedTaskCount = vol.assignedTasks.filter(
        (t) => t.status === TaskStatus.REJECTED
      ).length;
      const officialServiceHours = vol.submissions
        .filter((s) => s.reviewStatus === ReviewStatus.APPROVED)
        .reduce((sum, s) => sum + s.approvedHours, 0);

      return {
        id: vol.id,
        name: vol.name,
        volunteerId: vol.volunteerId,
        status: vol.status,
        taskCount,
        approvedTaskCount,
        pendingTaskCount,
        rejectedTaskCount,
        officialServiceHours,
      };
    });
  }

  /**
   * Retrieves task statistics breakdown by status for charts/cards (Admin).
   */
  public async getAdminTaskStats(): Promise<AdminTaskStatisticsResponse> {
    const [total, tasksByStatus, recentTasksRaw] = await Promise.all([
      prisma.task.count(),
      prisma.task.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.task.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          assignmentDate: true,
          deadline: true,
          createdAt: true,
          assignedTo: {
            select: {
              name: true,
              volunteerId: true,
            },
          },
        },
      }),
    ]);

    const byStatus = {
      ASSIGNED: 0,
      SUBMITTED: 0,
      APPROVED: 0,
      REJECTED: 0,
    };

    for (const group of tasksByStatus) {
      if (group.status in byStatus) {
        byStatus[group.status] = group._count.id;
      }
    }

    const recentTasks: RecentTaskItem[] = recentTasksRaw.map((t) => ({
      id: t.id,
      title: t.title,
      volunteer: {
        name: t.assignedTo.name,
        volunteerId: t.assignedTo.volunteerId,
      },
      status: t.status,
      assignmentDate: t.assignmentDate,
      deadline: t.deadline,
      createdAt: t.createdAt,
    }));

    return {
      total,
      byStatus,
      recentTasks,
    };
  }

  /**
   * Retrieves individual dashboard metrics for the authenticated volunteer.
   * Derived strictly from volunteer's own records.
   */
  public async getVolunteerDashboard(volunteerUserId: string): Promise<VolunteerDashboardResponse> {
    const volunteer = await prisma.user.findUnique({
      where: { id: volunteerUserId },
      select: { id: true, name: true, volunteerId: true, role: true },
    });

    if (!volunteer || volunteer.role !== Role.VOLUNTEER) {
      throw new NotFoundError('Volunteer not found');
    }

    const [
      totalTasks,
      tasksByStatus,
      pendingReviews,
      hoursAggregate,
      recentTasksRaw,
    ] = await Promise.all([
      prisma.task.count({ where: { assignedToId: volunteerUserId } }),
      prisma.task.groupBy({
        by: ['status'],
        where: { assignedToId: volunteerUserId },
        _count: { id: true },
      }),
      prisma.taskSubmission.count({
        where: { volunteerId: volunteerUserId, reviewStatus: ReviewStatus.PENDING },
      }),
      prisma.taskSubmission.aggregate({
        where: { volunteerId: volunteerUserId, reviewStatus: ReviewStatus.APPROVED },
        _sum: { approvedHours: true },
      }),
      prisma.task.findMany({
        where: { assignedToId: volunteerUserId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          assignmentDate: true,
          deadline: true,
          createdAt: true,
          assignedTo: {
            select: {
              name: true,
              volunteerId: true,
            },
          },
        },
      }),
    ]);

    const taskCounts = {
      assigned: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
    };

    for (const group of tasksByStatus) {
      if (group.status === TaskStatus.ASSIGNED) taskCounts.assigned = group._count.id;
      if (group.status === TaskStatus.SUBMITTED) taskCounts.submitted = group._count.id;
      if (group.status === TaskStatus.APPROVED) taskCounts.approved = group._count.id;
      if (group.status === TaskStatus.REJECTED) taskCounts.rejected = group._count.id;
    }

    const recentTasks: RecentTaskItem[] = recentTasksRaw.map((t) => ({
      id: t.id,
      title: t.title,
      volunteer: {
        name: t.assignedTo.name,
        volunteerId: t.assignedTo.volunteerId,
      },
      status: t.status,
      assignmentDate: t.assignmentDate,
      deadline: t.deadline,
      createdAt: t.createdAt,
    }));

    return {
      volunteer: {
        id: volunteer.id,
        name: volunteer.name,
        volunteerId: volunteer.volunteerId,
      },
      tasks: {
        total: totalTasks,
        ...taskCounts,
      },
      serviceHours: {
        official: hoursAggregate._sum.approvedHours ?? 0,
      },
      pendingReviews,
      recentTasks,
    };
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
