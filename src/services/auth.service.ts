import { UserStatus } from '@prisma/client';
import prisma from '../config/database.js';
import { BadRequestError, ConflictError, UnauthorizedError } from '../utils/app-error.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import {
  AuthSuccessData,
  ChangePasswordInput,
  LoginInput,
  SafeUser,
  UpdateProfileInput,
} from '../types/index.js';

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
      isMasterAdmin: user.isMasterAdmin,
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
        isMasterAdmin: user.isMasterAdmin,
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
        isMasterAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError('User account not found or inactive');
    }

    return user;
  }

  /**
   * Updates profile details (name, phone, email) for an authenticated user.
   * If updating email, validates current password and checks uniqueness.
   */
  public async updateProfile(userId: string, input: UpdateProfileInput): Promise<AuthSuccessData> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError('User account not found or inactive');
    }

    const updateData: { name?: string; phone?: string | null; email?: string } = {};

    if (input.name !== undefined) {
      const trimmedName = input.name.trim();
      if (trimmedName.length < 2) {
        throw new BadRequestError('Name must be at least 2 characters long');
      }
      updateData.name = trimmedName;
    }

    if (input.phone !== undefined) {
      updateData.phone = input.phone && input.phone.trim() ? input.phone.trim() : null;
    }

    if (input.email !== undefined) {
      const trimmedEmail = input.email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        throw new BadRequestError('Invalid email format');
      }

      if (trimmedEmail !== user.email.toLowerCase()) {
        if (!input.currentPassword) {
          throw new BadRequestError('Current password is required to change email address');
        }

        const isPasswordValid = await comparePassword(input.currentPassword, user.passwordHash);
        if (!isPasswordValid) {
          throw new UnauthorizedError('Current password is incorrect');
        }

        const existing = await prisma.user.findUnique({
          where: { email: trimmedEmail },
        });

        if (existing && existing.id !== user.id) {
          throw new ConflictError('Email address is already in use by another account');
        }

        updateData.email = trimmedEmail;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const token = generateToken({
      userId: updatedUser.id,
      role: updatedUser.role,
      email: updatedUser.email,
      volunteerId: updatedUser.volunteerId,
      isMasterAdmin: updatedUser.isMasterAdmin,
    });

    return {
      token,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        volunteerId: updatedUser.volunteerId,
        phone: updatedUser.phone,
        status: updatedUser.status,
        isMasterAdmin: updatedUser.isMasterAdmin,
      },
    };
  }

  /**
   * Securely changes the user's password after verifying the current password.
   */
  public async changePassword(userId: string, input: ChangePasswordInput): Promise<AuthSuccessData> {
    const { currentPassword, newPassword, confirmPassword } = input;

    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new BadRequestError('Current password, new password, and confirmation are all required');
    }

    if (newPassword !== confirmPassword) {
      throw new BadRequestError('New password and confirmation do not match');
    }

    if (newPassword.length < 8) {
      throw new BadRequestError('New password must be at least 8 characters long');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError('User account not found or inactive');
    }

    const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const newHash = await hashPassword(newPassword);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
      },
    });

    const token = generateToken({
      userId: updatedUser.id,
      role: updatedUser.role,
      email: updatedUser.email,
      volunteerId: updatedUser.volunteerId,
      isMasterAdmin: updatedUser.isMasterAdmin,
    });

    return {
      token,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        volunteerId: updatedUser.volunteerId,
        phone: updatedUser.phone,
        status: updatedUser.status,
        isMasterAdmin: updatedUser.isMasterAdmin,
      },
    };
  }
}

export const authService = new AuthService();
export default authService;
