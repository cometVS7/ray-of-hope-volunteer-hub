export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface AuthenticatedUserPayload {
  userId: string;
  role: 'ADMIN' | 'VOLUNTEER';
  email: string;
  volunteerId?: string | null;
}
