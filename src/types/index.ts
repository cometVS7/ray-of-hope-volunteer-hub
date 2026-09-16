import { Role, UserStatus } from '@prisma/client';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface AuthenticatedUserPayload {
  userId: string;
  role: Role;
  email: string;
  volunteerId?: string | null;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  volunteerId?: string | null;
  phone?: string | null;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginInput {
  email?: string;
  volunteerId?: string;
  password: string;
}

export interface AuthSuccessData {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    volunteerId?: string | null;
    phone?: string | null;
    status: UserStatus;
  };
}

export interface CreateVolunteerInput {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
}

export interface UpdateVolunteerStatusInput {
  status: UserStatus;
}

export interface VolunteerQueryFilters {
  search?: string;
  status?: UserStatus;
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface VolunteerListResponse {
  volunteers: SafeUser[];
  pagination: PaginationMeta;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  expectedHours: number;
  assignmentDate: string | Date;
  deadline: string | Date;
  assignedToId: string;
}

export interface TaskQueryFilters {
  search?: string;
  status?: import('@prisma/client').TaskStatus;
  assignedToId?: string;
  page?: number;
  limit?: number;
}

export interface VolunteerTaskQueryFilters {
  search?: string;
  status?: import('@prisma/client').TaskStatus;
  page?: number;
  limit?: number;
}

export interface SafeTaskVolunteer {
  id: string;
  name: string;
  email: string;
  volunteerId?: string | null;
  phone?: string | null;
}

export interface SafeTaskCreator {
  id: string;
  name: string;
  email: string;
}

export interface SafeTask {
  id: string;
  title: string;
  description: string;
  expectedHours: number;
  assignmentDate: Date;
  deadline: Date;
  status: import('@prisma/client').TaskStatus;
  assignedToId: string;
  createdById: string;
  assignedTo?: SafeTaskVolunteer;
  createdBy?: SafeTaskCreator;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskListResponse {
  tasks: SafeTask[];
  pagination: PaginationMeta;
}

export interface SubmitTaskInput {
  actualHours: number;
  completionNotes: string;
}

export interface SafeTaskSubmission {
  id: string;
  taskId: string;
  volunteerId: string;
  actualHours: number;
  completionNotes: string;
  submittedAt: Date;
  reviewStatus: import('@prisma/client').ReviewStatus;
  approvedHours: number;
  reviewNotes?: string | null;
  reviewedById?: string | null;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  task?: {
    id: string;
    title: string;
    status: import('@prisma/client').TaskStatus;
  };
}

export interface SubmitTaskResponseData {
  task: {
    id: string;
    title: string;
    status: import('@prisma/client').TaskStatus;
  };
  submission: {
    id: string;
    taskId: string;
    actualHours: number;
    completionNotes: string;
    submittedAt: Date;
    reviewStatus: import('@prisma/client').ReviewStatus;
    approvedHours: number;
  };
}


// Extend Express Request interface globally
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserPayload;
    }
  }
}
