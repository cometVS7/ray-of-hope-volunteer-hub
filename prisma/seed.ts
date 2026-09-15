import { PrismaClient, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding development test accounts...');

  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('Admin@123', saltRounds);
  const volunteerPasswordHash = await bcrypt.hash('Volunteer@123', saltRounds);

  // 1. Development Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rayofhope.org' },
    update: {
      name: 'System Admin',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      name: 'System Admin',
      email: 'admin@rayofhope.org',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log(`✅ Admin seeded: ${admin.email} (Role: ${admin.role})`);

  // 2. Development Volunteer User
  const volunteer = await prisma.user.upsert({
    where: { email: 'volunteer1@rayofhope.org' },
    update: {
      name: 'Alex Johnson',
      volunteerId: 'ARH-VOL-001',
      passwordHash: volunteerPasswordHash,
      role: Role.VOLUNTEER,
      phone: '+1234567890',
      status: UserStatus.ACTIVE,
    },
    create: {
      name: 'Alex Johnson',
      email: 'volunteer1@rayofhope.org',
      volunteerId: 'ARH-VOL-001',
      passwordHash: volunteerPasswordHash,
      role: Role.VOLUNTEER,
      phone: '+1234567890',
      status: UserStatus.ACTIVE,
    },
  });

  console.log(
    `✅ Volunteer seeded: ${volunteer.name} (Volunteer ID: ${volunteer.volunteerId}, Email: ${volunteer.email})`
  );

  console.log('\n🔒 Development Test Credentials:');
  console.log('----------------------------------------------------');
  console.log('ADMIN:     Email: admin@rayofhope.org       | Password: Admin@123');
  console.log('VOLUNTEER: VolID: ARH-VOL-001 / Email       | Password: Volunteer@123');
  console.log('----------------------------------------------------');
  console.log('⚠️  Note: These credentials are for development only.\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
