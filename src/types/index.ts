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

// Extend Express Request interface globally
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserPayload;
    }
  }
}
