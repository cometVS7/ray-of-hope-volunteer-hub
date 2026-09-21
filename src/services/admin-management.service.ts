import { Role, UserStatus } from '@prisma/client';
import prisma from '../config/database.js';
import { BadRequestError, ConflictError } from '../utils/app-error.js';
import { hashPassword } from '../utils/password.js';
import { CreateAdminInput, SafeAdminItem } from '../types/index.js';

export class AdminManagementService {
  /**
   * Retrieves all administrator accounts.
   */
  public async listAdmins(): Promise<SafeAdminItem[]> {
    const admins = await prisma.user.findMany({
      where: {
        role: Role.ADMIN,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        isMasterAdmin: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return admins;
  }

  /**
   * Creates a new administrator account (restricted to Master Admin).
   */
  public async createAdmin(input: CreateAdminInput): Promise<SafeAdminItem> {
    const { name, email, password, phone } = input;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      throw new BadRequestError('Admin name must be at least 2 characters long');
    }

    if (!email || typeof email !== 'string') {
      throw new BadRequestError('Email address is required');
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      throw new BadRequestError('Invalid email format');
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      throw new BadRequestError('Password must be at least 8 characters long');
    }

    // Check email uniqueness
    const existing = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existing) {
      throw new ConflictError('An account with this email address already exists');
    }

    const passwordHash = await hashPassword(password);

    const newAdmin = await prisma.user.create({
      data: {
        name: name.trim(),
        email: trimmedEmail,
        passwordHash,
        phone: phone && phone.trim() ? phone.trim() : null,
        role: Role.ADMIN,
        isMasterAdmin: false,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        isMasterAdmin: true,
        createdAt: true,
      },
    });

    return newAdmin;
  }
}

export const adminManagementService = new AdminManagementService();
export default adminManagementService;
