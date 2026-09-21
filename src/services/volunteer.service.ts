import { Prisma, Role, UserStatus } from '@prisma/client';
import prisma from '../config/database.js';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../utils/app-error.js';
import { hashPassword } from '../utils/password.js';
import {
  CreateVolunteerInput,
  SafeUser,
  VolunteerListResponse,
  VolunteerQueryFilters,
} from '../types/index.js';

export const safeUserSelect = {
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
};

// Basic email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class VolunteerService {
  /**
   * Generates the next sequential Volunteer ID in format ARH-VOL-001.
   * Inspects existing volunteer IDs in the database and increments the maximum found.
   */
  public async generateNextVolunteerId(): Promise<string> {
    const existingVolunteers = await prisma.user.findMany({
      where: {
        volunteerId: {
          startsWith: 'ARH-VOL-',
        },
      },
      select: {
        volunteerId: true,
      },
    });

    let maxNum = 0;
    const regex = /^ARH-VOL-(\d+)$/i;

    for (const v of existingVolunteers) {
      if (v.volunteerId) {
        const match = regex.exec(v.volunteerId);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    }

    const nextNum = maxNum + 1;
    return `ARH-VOL-${String(nextNum).padStart(3, '0')}`;
  }

  /**
   * Creates a new volunteer account with auto-generated Volunteer ID.
   */
  public async createVolunteer(input: CreateVolunteerInput): Promise<SafeUser> {
    const { name, email, password, phone } = input;

    // 1. Validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new BadRequestError('Name is required and cannot be empty');
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      throw new BadRequestError('A valid email address is required');
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new BadRequestError('Password is required and must be at least 6 characters');
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone && typeof phone === 'string' ? phone.trim() : null;

    // 2. Check for duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      throw new ConflictError('A user with this email already exists');
    }

    // 3. Hash password
    const passwordHash = await hashPassword(password);

    // 4. Create with unique Volunteer ID generation and collision retry
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      attempts++;
      const volunteerId = await this.generateNextVolunteerId();

      try {
        const volunteer = await prisma.user.create({
          data: {
            name: cleanName,
            email: cleanEmail,
            passwordHash,
            volunteerId,
            phone: cleanPhone,
            role: Role.VOLUNTEER,
            status: UserStatus.ACTIVE,
          },
          select: safeUserSelect,
        });

        return volunteer;
      } catch (error: any) {
        // Prisma unique constraint violation code
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          const target = (error.meta?.target as string[]) || [];
          if (target.includes('email')) {
            throw new ConflictError('A user with this email already exists');
          }
          // If collision occurred on volunteerId, continue loop to fetch next available ID
          if (attempts >= maxAttempts) {
            throw new ConflictError('Failed to generate a unique Volunteer ID due to high concurrency. Please try again.');
          }
          continue;
        }
        throw error;
      }
    }

    throw new ConflictError('Could not allocate unique Volunteer ID');
  }

  /**
   * Retrieves a paginated, filterable list of volunteers.
   */
  public async listVolunteers(filters: VolunteerQueryFilters): Promise<VolunteerListResponse> {
    const page = Math.max(1, Number(filters.page) || 1);
    const rawLimit = Number(filters.limit) || 20;
    const limit = Math.min(100, Math.max(1, rawLimit));

    // Validate status if provided
    let statusFilter: UserStatus | undefined;
    if (filters.status) {
      if (filters.status !== UserStatus.ACTIVE && filters.status !== UserStatus.INACTIVE) {
        throw new BadRequestError('Status must be either ACTIVE or INACTIVE');
      }
      statusFilter = filters.status;
    }

    const where: Prisma.UserWhereInput = {
      role: Role.VOLUNTEER,
    };

    if (statusFilter) {
      where.status = statusFilter;
    }

    if (filters.search && typeof filters.search === 'string' && filters.search.trim() !== '') {
      const term = filters.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { volunteerId: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, volunteers] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: safeUserSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      volunteers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Retrieves an individual volunteer profile by database UUID.
   */
  public async getVolunteerById(id: string): Promise<SafeUser> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new BadRequestError('Volunteer ID parameter is required');
    }

    const volunteer = await prisma.user.findUnique({
      where: { id: id.trim() },
      select: safeUserSelect,
    });

    if (!volunteer || volunteer.role !== Role.VOLUNTEER) {
      throw new NotFoundError('Volunteer not found');
    }

    return volunteer;
  }

  /**
   * Updates a volunteer's status (ACTIVE <-> INACTIVE).
   */
  public async updateVolunteerStatus(id: string, status: UserStatus): Promise<SafeUser> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new BadRequestError('Volunteer ID parameter is required');
    }

    if (status !== UserStatus.ACTIVE && status !== UserStatus.INACTIVE) {
      throw new BadRequestError('Status must be either ACTIVE or INACTIVE');
    }

    // Verify target user exists and is a volunteer
    const existing = await prisma.user.findUnique({
      where: { id: id.trim() },
      select: {
        id: true,
        role: true,
      },
    });

    if (!existing) {
      throw new NotFoundError('Volunteer not found');
    }

    if (existing.role !== Role.VOLUNTEER) {
      throw new BadRequestError('Cannot modify status: target user is not a volunteer');
    }

    const updated = await prisma.user.update({
      where: { id: id.trim() },
      data: { status },
      select: safeUserSelect,
    });

    return updated;
  }
}

export const volunteerService = new VolunteerService();
export default volunteerService;
