export type Role = 'ADMIN' | 'VOLUNTEER';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type TaskStatus = 'ASSIGNED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  volunteerId?: string | null;
  phone?: string | null;
  status: UserStatus;
  isMasterAdmin?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  status: UserStatus;
  isMasterAdmin: boolean;
  createdAt: string;
}

export interface UpdateProfileInput {
  name?: string;
  phone?: string | null;
  email?: string;
  currentPassword?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface CreateAdminInput {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  expectedHours: number;
  assignmentDate: string;
  deadline: string;
  status: TaskStatus;
  assignedToId: string;
  createdById: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    volunteerId?: string | null;
    phone?: string | null;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  volunteerId: string;
  actualHours: number;
  completionNotes: string;
  submittedAt: string;
  reviewStatus: ReviewStatus;
  approvedHours: number;
  reviewNotes?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  task?: {
    id: string;
    title: string;
    status: TaskStatus;
    expectedHours?: number;
  };
  volunteer?: {
    id: string;
    name: string;
    volunteerId?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface RecentTask {
  id: string;
  title: string;
  volunteer: {
    name: string;
    volunteerId: string | null;
  };
  status: TaskStatus;
  assignmentDate: string;
  deadline: string;
  createdAt: string;
}

export interface AdminDashboardData {
  volunteers: {
    total: number;
    active: number;
    inactive: number;
  };
  tasks: {
    total: number;
    assigned: number;
    submitted: number;
    approved: number;
    rejected: number;
  };
  submissions: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  serviceHours: {
    official: number;
  };
  recentTasks: RecentTask[];
}

export interface VolunteerStatisticsItem {
  id: string;
  name: string;
  volunteerId: string | null;
  status: UserStatus;
  taskCount: number;
  approvedTaskCount: number;
  pendingTaskCount: number;
  rejectedTaskCount: number;
  officialServiceHours: number;
}

export interface VolunteerDashboardData {
  volunteer: {
    id: string;
    name: string;
    volunteerId: string | null;
  };
  tasks: {
    total: number;
    assigned: number;
    submitted: number;
    approved: number;
    rejected: number;
  };
  serviceHours: {
    official: number;
  };
  pendingReviews: number;
  recentTasks: RecentTask[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
