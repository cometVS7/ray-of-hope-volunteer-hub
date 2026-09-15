import { UserStatus } from '@prisma/client';
import prisma from '../config/database.js';
import { BadRequestError, UnauthorizedError } from '../utils/app-error.js';
import { comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { AuthSuccessData, LoginInput, SafeUser } from '../types/index.js';

export class AuthService {
  /**
   * Authenticates a user by email (Admin / Volunteer) or Volunteer ID (Volunteer).
   */
  public async login(input: LoginInput): Promise<AuthSuccessData> {
    const { email, volunteerId, password } = input;

    // 1. Basic validation
    if (!password || typeof password !== 'string' || password.trim() === '') {
      throw new BadRequestError('Password is required');
    }

    if (!email && !volunteerId) {
      throw new BadRequestError('Either email or volunteerId is required');
    }

    // 2. Query user by identifier
    let user = null;

    if (volunteerId && typeof volunteerId === 'string' && volunteerId.trim() !== '') {
      user = await prisma.user.findUnique({
        where: { volunteerId: volunteerId.trim() },
      });
    } else if (email && typeof email === 'string' && email.trim() !== '') {
      user = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
    }

    // 3. Check user existence and active status (generic error message for security)
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // 4. Verify password with bcrypt
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // 5. Generate JWT token
    const token = generateToken({
      userId: user.id,
      role: user.role,
      email: user.email,
      volunteerId: user.volunteerId,
    });

    // 6. Return response without passwordHash
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        volunteerId: user.volunteerId,
        phone: user.phone,
        status: user.status,
      },
    };
  }

  /**
   * Retrieves safe profile information for the authenticated user.
   */
  public async getCurrentUser(userId: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        volunteerId: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError('User account not found or inactive');
    }

    return user;
  }
}

export const authService = new AuthService();
export default authService;
