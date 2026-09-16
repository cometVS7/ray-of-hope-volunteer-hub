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


// Extend Express Request interface globally
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserPayload;
    }
  }
}
