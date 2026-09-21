import { PrismaClient, Role, UserStatus, TaskStatus, ReviewStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting A Ray of Hope Foundation database seed (Pune, MH)...');

  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('Admin@123', saltRounds);
  const volunteerPasswordHash = await bcrypt.hash('Volunteer@123', saltRounds);

  // =========================================================================
  // 1. SAFE RESET OF DEMO DATA (Idempotent execution)
  // =========================================================================
  console.log('🧹 Cleaning existing demo tasks and submissions...');
  await prisma.taskSubmission.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      role: Role.VOLUNTEER,
    },
  });

  // =========================================================================
  // 2. NGO ADMIN USER
  // =========================================================================
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rayofhope.org' },
    update: {
      name: 'Dr. Sunita Deshpande (Admin)',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      isMasterAdmin: true,
      phone: '+91 98220 90000',
    },
    create: {
      name: 'Dr. Sunita Deshpande (Admin)',
      email: 'admin@rayofhope.org',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      isMasterAdmin: true,
      phone: '+91 98220 90000',
    },
  });
  console.log(`✅ Admin ready: ${admin.name} (${admin.email})`);

  // =========================================================================
  // 3. 18 REALISTIC MAHARASHTRA / PUNE VOLUNTEERS
  // =========================================================================
  const volunteersData = [
    { name: 'Aarav Kulkarni', email: 'aarav.kulkarni@gmail.com', phone: '+91 98220 11452', volunteerId: 'ARH-VOL-001', status: UserStatus.ACTIVE },
    { name: 'Ananya Deshmukh', email: 'ananya.deshmukh@gmail.com', phone: '+91 98220 22781', volunteerId: 'ARH-VOL-002', status: UserStatus.ACTIVE },
    { name: 'Rohan Patil', email: 'rohan.patil@outlook.com', phone: '+91 98220 33904', volunteerId: 'ARH-VOL-003', status: UserStatus.ACTIVE },
    { name: 'Meera Joshi', email: 'meera.joshi@gmail.com', phone: '+91 98220 44519', volunteerId: 'ARH-VOL-004', status: UserStatus.ACTIVE },
    { name: 'Aditya Shinde', email: 'aditya.shinde@yahoo.co.in', phone: '+91 98220 55632', volunteerId: 'ARH-VOL-005', status: UserStatus.ACTIVE },
    { name: 'Sneha Jadhav', email: 'sneha.jadhav@gmail.com', phone: '+91 98220 66745', volunteerId: 'ARH-VOL-006', status: UserStatus.ACTIVE },
    { name: 'Omkar Pawar', email: 'omkar.pawar@gmail.com', phone: '+91 98220 77858', volunteerId: 'ARH-VOL-007', status: UserStatus.ACTIVE },
    { name: 'Isha Bhosale', email: 'isha.bhosale@outlook.com', phone: '+91 98220 88961', volunteerId: 'ARH-VOL-008', status: UserStatus.ACTIVE },
    { name: 'Siddharth More', email: 'siddharth.more@gmail.com', phone: '+91 98220 99074', volunteerId: 'ARH-VOL-009', status: UserStatus.ACTIVE },
    { name: 'Priya Kulkarni', email: 'priya.kulkarni@gmail.com', phone: '+91 98230 11187', volunteerId: 'ARH-VOL-010', status: UserStatus.ACTIVE },
    { name: 'Kunal Chavan', email: 'kunal.chavan@yahoo.com', phone: '+91 98230 22290', volunteerId: 'ARH-VOL-011', status: UserStatus.ACTIVE },
    { name: 'Neha Deshpande', email: 'neha.deshpande@gmail.com', phone: '+91 98230 33303', volunteerId: 'ARH-VOL-012', status: UserStatus.ACTIVE },
    { name: 'Vedant Joshi', email: 'vedant.joshi@gmail.com', phone: '+91 98230 44416', volunteerId: 'ARH-VOL-013', status: UserStatus.ACTIVE },
    { name: 'Riya Patil', email: 'riya.patil@outlook.com', phone: '+91 98230 55529', volunteerId: 'ARH-VOL-014', status: UserStatus.ACTIVE },
    { name: 'Atharva Deshmukh', email: 'atharva.deshmukh@gmail.com', phone: '+91 98230 66642', volunteerId: 'ARH-VOL-015', status: UserStatus.ACTIVE },
    { name: 'Tanvi Jadhav', email: 'tanvi.jadhav@gmail.com', phone: '+91 98230 77755', volunteerId: 'ARH-VOL-016', status: UserStatus.ACTIVE },
    // Inactive volunteers for status filtering demonstration
    { name: 'Yash Kadam', email: 'yash.kadam@gmail.com', phone: '+91 98230 88868', volunteerId: 'ARH-VOL-017', status: UserStatus.INACTIVE },
    { name: 'Sakshi Pawar', email: 'sakshi.pawar@gmail.com', phone: '+91 98230 99971', volunteerId: 'ARH-VOL-018', status: UserStatus.INACTIVE },
  ];

  const volunteerMap = new Map<string, string>(); // volunteerId -> userId

  for (const v of volunteersData) {
    const user = await prisma.user.create({
      data: {
        name: v.name,
        email: v.email,
        phone: v.phone,
        volunteerId: v.volunteerId,
        passwordHash: volunteerPasswordHash,
        role: Role.VOLUNTEER,
        status: v.status,
      },
    });
    volunteerMap.set(v.volunteerId, user.id);
  }
  console.log(`✅ Seeded ${volunteersData.length} volunteers (16 Active, 2 Inactive)`);

  // =========================================================================
  // 4. 25 REALISTIC NGO TASKS & SUBMISSIONS
  // =========================================================================
  const now = new Date();
  const pastDays = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const futureDays = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  // --- A. APPROVED TASKS (9 tasks: approved submissions contribute to official hours) ---
  const approvedTasksData = [
    {
      title: 'Community Food Distribution Drive — Swargate',
      description: 'Assist in packaging and distributing 300 nutritious meal packets to underserved families and daily-wage earners near Swargate Bus Stand.',
      expectedHours: 4.0,
      actualHours: 4.0,
      approvedHours: 4.0,
      assignmentDate: pastDays(14),
      deadline: pastDays(10),
      submittedAt: pastDays(11),
      reviewedAt: pastDays(9),
      volunteerIdKey: 'ARH-VOL-001',
      completionNotes: 'Coordinated distribution with Swargate police chowki team. Distributed all 300 ration packs without incident.',
      reviewNotes: 'Excellent coordination with the food bank truck and timely distribution. Beneficiary receipt list confirmed.',
    },
    {
      title: 'School Stationery & Backpack Assembly — Kothrud',
      description: 'Sort, pack, and label 250 school starter kits containing notebooks, geometry sets, and backpacks for Zilla Parishad primary students.',
      expectedHours: 3.0,
      actualHours: 3.0,
      approvedHours: 3.0,
      assignmentDate: pastDays(12),
      deadline: pastDays(8),
      submittedAt: pastDays(9),
      reviewedAt: pastDays(7),
      volunteerIdKey: 'ARH-VOL-001',
      completionNotes: 'Finished packing 250 bags with primary education textbooks, pencil boxes, and geometry kits. Stacked in dispatch bay.',
      reviewNotes: 'All kits were properly packed and verified against inventory sheets.',
    },
    {
      title: 'Weekly English & Math Tutoring — Hadapsar Center',
      description: 'Conduct foundational reading and basic arithmetic tutoring sessions for 6th and 7th grade students at our Hadapsar Community Center.',
      expectedHours: 3.0,
      actualHours: 3.0,
      approvedHours: 3.0,
      assignmentDate: pastDays(10),
      deadline: pastDays(6),
      submittedAt: pastDays(7),
      reviewedAt: pastDays(5),
      volunteerIdKey: 'ARH-VOL-002',
      completionNotes: 'Covered multiplication tables, division basics, and guided reading for chapter 4 of English textbook with 18 students.',
      reviewNotes: 'Student attendance recorded accurately; great student engagement observed by center coordinator.',
    },
    {
      title: 'Senior Citizen Health Camp Registration — Shivajinagar',
      description: 'Manage morning registration, vital signs queue coordination, and token distribution for the free geriatric health camp in Shivajinagar.',
      expectedHours: 5.0,
      actualHours: 5.0,
      approvedHours: 5.0,
      assignmentDate: pastDays(9),
      deadline: pastDays(5),
      submittedAt: pastDays(6),
      reviewedAt: pastDays(4),
      volunteerIdKey: 'ARH-VOL-002',
      completionNotes: 'Registered 145 senior citizens, helped with wheelchair access, and provided printed token numbers to doctors’ cabins.',
      reviewNotes: 'Handled elderly beneficiaries with great patience and care. Smooth clinic flow.',
    },
    {
      title: 'Mutha Riverbank Cleanup Drive — Deccan Gymkhana',
      description: 'Join the Saturday morning youth cleanup initiative along the Mutha riverfront. Collect plastic waste, segregate recyclables, and bag dry debris.',
      expectedHours: 4.0,
      actualHours: 4.5,
      approvedHours: 4.0,
      assignmentDate: pastDays(8),
      deadline: pastDays(4),
      submittedAt: pastDays(5),
      reviewedAt: pastDays(3),
      volunteerIdKey: 'ARH-VOL-003',
      completionNotes: 'Collected 14 bags of single-use plastics and bottle waste. Handed over segregated waste to PMC sanitation truck.',
      reviewNotes: 'Verified by clean-up supervisor. Approved for standard 4-hour volunteer slot.',
    },
    {
      title: 'Blood Donation Camp Volunteer Support — Camp Pune',
      description: 'Assist Red Cross medical staff with donor refreshment stations, token logistics, and issuing donor certificates at the Pune Camp center.',
      expectedHours: 6.0,
      actualHours: 6.0,
      approvedHours: 6.0,
      assignmentDate: pastDays(7),
      deadline: pastDays(3),
      submittedAt: pastDays(4),
      reviewedAt: pastDays(2),
      volunteerIdKey: 'ARH-VOL-003',
      completionNotes: 'Assisted 142 voluntary donors. Maintained donor recovery resting zone and distributed certificates & fruit juice.',
      reviewNotes: 'Superb dedication throughout the 6-hour donor camp. 142 units successfully collected.',
    },
    {
      title: 'Emergency Food Grain Packaging — Warje Warehouse',
      description: 'Weigh and seal 10kg monthly ration kits containing rice, dal, oil, and wheat flour for tribal welfare outreach programs.',
      expectedHours: 5.0,
      actualHours: 5.0,
      approvedHours: 5.0,
      assignmentDate: pastDays(6),
      deadline: pastDays(2),
      submittedAt: pastDays(3),
      reviewedAt: pastDays(1),
      volunteerIdKey: 'ARH-VOL-003',
      completionNotes: 'Weighed and machine-sealed 120 standard grain bags. Managed moisture sealing for monsoon dispatch.',
      reviewNotes: 'Accurate weighing and sealing. All 120 kits prepared on schedule.',
    },
    {
      title: 'Tree Plantation & Sapling Care — Vetal Tekdi',
      description: 'Plant 50 native tree saplings and install protective bamboo guards along the degraded slopes of Vetal Tekdi trail.',
      expectedHours: 4.0,
      actualHours: 4.0,
      approvedHours: 4.0,
      assignmentDate: pastDays(5),
      deadline: pastDays(2),
      submittedAt: pastDays(3),
      reviewedAt: pastDays(1),
      volunteerIdKey: 'ARH-VOL-004',
      completionNotes: 'Planted 50 neem, banyan, and peepal saplings with protective fencing and organic compost.',
      reviewNotes: 'Verified by Forest Dept liaison. Great work on watering and mulching.',
    },
    {
      title: 'Winter Blanket & Woolen Clothes Drive — Katraj',
      description: 'Sort, inspect, size-categorize, and distribute winter blankets and sweaters to construction laborers families in Katraj.',
      expectedHours: 4.0,
      actualHours: 3.5,
      approvedHours: 3.5,
      assignmentDate: pastDays(4),
      deadline: pastDays(1),
      submittedAt: pastDays(2),
      reviewedAt: pastDays(1),
      volunteerIdKey: 'ARH-VOL-004',
      completionNotes: 'Sorted 80 warm blankets and 65 jackets by child/adult sizes. Distributed directly to families at Katraj labor naka.',
      reviewNotes: 'Distribution completed smoothly within 3.5 hours. Accurate logs submitted.',
    },
  ];

  for (const t of approvedTasksData) {
    const volunteerId = volunteerMap.get(t.volunteerIdKey)!;
    const task = await prisma.task.create({
      data: {
        title: t.title,
        description: t.description,
        expectedHours: t.expectedHours,
        assignmentDate: t.assignmentDate,
        deadline: t.deadline,
        status: TaskStatus.APPROVED,
        assignedToId: volunteerId,
        createdById: admin.id,
      },
    });

    await prisma.taskSubmission.create({
      data: {
        taskId: task.id,
        volunteerId: volunteerId,
        actualHours: t.actualHours,
        completionNotes: t.completionNotes,
        submittedAt: t.submittedAt,
        reviewStatus: ReviewStatus.APPROVED,
        approvedHours: t.approvedHours,
        reviewNotes: t.reviewNotes,
        reviewedById: admin.id,
        reviewedAt: t.reviewedAt,
      },
    });
  }
  console.log(`✅ Seeded ${approvedTasksData.length} APPROVED tasks with verified submissions`);

  // --- B. SUBMITTED TASKS (5 tasks: awaiting admin review, 0 approved hours) ---
  const submittedTasksData = [
    {
      title: 'Slum Literacy Awareness Walk — Yerawada',
      description: 'Distribute educational leaflets and interact with parents regarding Right to Education (RTE) admissions in Yerawada community.',
      expectedHours: 3.0,
      actualHours: 3.0,
      assignmentDate: pastDays(3),
      deadline: pastDays(1),
      submittedAt: pastDays(1),
      volunteerIdKey: 'ARH-VOL-005',
      completionNotes: 'Walked through 4 basti lanes and spoke to 35 households. Distributed all 100 informational pamphlets regarding school admission dates.',
    },
    {
      title: 'Children Art & Storytelling Workshop — Bibvewadi',
      description: 'Facilitate a 3-hour weekend creative expression and story reading session for 30 children residing in shelter homes in Bibvewadi.',
      expectedHours: 3.0,
      actualHours: 3.5,
      assignmentDate: pastDays(4),
      deadline: pastDays(1),
      submittedAt: pastDays(1),
      volunteerIdKey: 'ARH-VOL-006',
      completionNotes: 'Organized drawing competition and clay modeling. Children participated enthusiastically. Stayed 30 minutes extra for cleanup.',
    },
    {
      title: 'Digital Literacy Basics for Women — Pimpri Center',
      description: 'Conduct introductory smartphone and digital payment safety training for women self-help group (SHG) members.',
      expectedHours: 4.0,
      actualHours: 4.0,
      assignmentDate: pastDays(3),
      deadline: futureDays(1),
      submittedAt: pastDays(1),
      volunteerIdKey: 'ARH-VOL-007',
      completionNotes: 'Taught 18 SHG members how to use UPI safely, verify SMS receipts, and access DigiLocker certificates.',
    },
    {
      title: 'Eye Check-up Camp Logistics — Kasba Peth',
      description: 'Guide elderly patients through ophthalmological screening stations and distribute reading glasses prescribed by doctors.',
      expectedHours: 5.0,
      actualHours: 5.0,
      assignmentDate: pastDays(2),
      deadline: futureDays(2),
      submittedAt: pastDays(1),
      volunteerIdKey: 'ARH-VOL-008',
      completionNotes: 'Supported 85 senior citizens during screening; assisted optometrists with glasses numbering and post-checkup drops.',
    },
    {
      title: 'Used Book Sorting & Community Library Setup — Dhankawadi',
      description: 'Categorize 500 donated Marathi and English books and arrange shelves for the new community study room in Dhankawadi.',
      expectedHours: 4.0,
      actualHours: 4.0,
      assignmentDate: pastDays(2),
      deadline: futureDays(1),
      submittedAt: pastDays(1),
      volunteerIdKey: 'ARH-VOL-009',
      completionNotes: 'Cataloged all 500 books by age group and subject. Prepared lending register and reference section markers.',
    },
  ];

  for (const t of submittedTasksData) {
    const volunteerId = volunteerMap.get(t.volunteerIdKey)!;
    const task = await prisma.task.create({
      data: {
        title: t.title,
        description: t.description,
        expectedHours: t.expectedHours,
        assignmentDate: t.assignmentDate,
        deadline: t.deadline,
        status: TaskStatus.SUBMITTED,
        assignedToId: volunteerId,
        createdById: admin.id,
      },
    });

    await prisma.taskSubmission.create({
      data: {
        taskId: task.id,
        volunteerId: volunteerId,
        actualHours: t.actualHours,
        completionNotes: t.completionNotes,
        submittedAt: t.submittedAt,
        reviewStatus: ReviewStatus.PENDING,
        approvedHours: 0.0,
        reviewNotes: null,
        reviewedById: null,
        reviewedAt: null,
      },
    });
  }
  console.log(`✅ Seeded ${submittedTasksData.length} SUBMITTED tasks awaiting admin review`);

  // --- C. REJECTED TASKS (3 tasks: rejection with feedback, 0 approved hours) ---
  const rejectedTasksData = [
    {
      title: 'Community Health Survey — Mangalwar Peth',
      description: 'Conduct household door-to-door survey on maternal health and immunization compliance.',
      expectedHours: 4.0,
      actualHours: 4.0,
      assignmentDate: pastDays(5),
      deadline: pastDays(2),
      submittedAt: pastDays(3),
      reviewedAt: pastDays(2),
      volunteerIdKey: 'ARH-VOL-010',
      completionNotes: 'Survey completed for some families in the area.',
      reviewNotes: 'The submitted survey sheet is missing house numbers and supervisor sign-off. Please resubmit with completed survey forms.',
    },
    {
      title: 'Cloth Bag Sewing & Eco-Friendly Drive — FC Road',
      description: 'Promote plastic-free shopping by distributing recycled cloth bags to street vendors and shoppers along FC Road.',
      expectedHours: 3.0,
      actualHours: 5.0,
      assignmentDate: pastDays(6),
      deadline: pastDays(3),
      submittedAt: pastDays(4),
      reviewedAt: pastDays(3),
      volunteerIdKey: 'ARH-VOL-011',
      completionNotes: 'Distributed bags on FC road with volunteers.',
      reviewNotes: 'Reported 5 actual hours for a scheduled 2-hour distribution slot without explanation. Please revise actual hours to reflect assigned time.',
    },
    {
      title: 'Youth Career Guidance Mentorship — Sinhagad Road',
      description: 'Share vocational guidance with 10th-grade students exploring ITI, diploma, and college admissions.',
      expectedHours: 2.0,
      actualHours: 2.0,
      assignmentDate: pastDays(7),
      deadline: pastDays(4),
      submittedAt: pastDays(5),
      reviewedAt: pastDays(4),
      volunteerIdKey: 'ARH-VOL-012',
      completionNotes: 'Met students briefly.',
      reviewNotes: 'Session notes are blank and student attendance sheet was not attached. Please contact the coordinator and resubmit with verified attendance.',
    },
  ];

  for (const t of rejectedTasksData) {
    const volunteerId = volunteerMap.get(t.volunteerIdKey)!;
    const task = await prisma.task.create({
      data: {
        title: t.title,
        description: t.description,
        expectedHours: t.expectedHours,
        assignmentDate: t.assignmentDate,
        deadline: t.deadline,
        status: TaskStatus.REJECTED,
        assignedToId: volunteerId,
        createdById: admin.id,
      },
    });

    await prisma.taskSubmission.create({
      data: {
        taskId: task.id,
        volunteerId: volunteerId,
        actualHours: t.actualHours,
        completionNotes: t.completionNotes,
        submittedAt: t.submittedAt,
        reviewStatus: ReviewStatus.REJECTED,
        approvedHours: 0.0,
        reviewNotes: t.reviewNotes,
        reviewedById: admin.id,
        reviewedAt: t.reviewedAt,
      },
    });
  }
  console.log(`✅ Seeded ${rejectedTasksData.length} REJECTED tasks with actionable feedback`);

  // --- D. ASSIGNED TASKS (8 tasks: pending volunteer action, no submission) ---
  const assignedTasksData = [
    {
      title: 'Dry Ration Kit Assembly for Monsoon Relief — Baner',
      description: 'Assemble non-perishable food kits including poha, pulses, tea, and jaggery for monsoon emergency relief reserves.',
      expectedHours: 4.0,
      assignmentDate: pastDays(1),
      deadline: futureDays(4),
      volunteerIdKey: 'ARH-VOL-013',
    },
    {
      title: 'Orphanage Sports Day Coordination — Bavdhan',
      description: 'Referee games, manage race heats, and coordinate prize distribution for 60 children at the annual sports meet.',
      expectedHours: 5.0,
      assignmentDate: now,
      deadline: futureDays(6),
      volunteerIdKey: 'ARH-VOL-014',
    },
    {
      title: 'Traffic Safety & Helmet Awareness Campaign — JM Road',
      description: 'Collaborate with Pune City Traffic Police to display road safety placards and hand out safety brochures at major junctions.',
      expectedHours: 2.0,
      assignmentDate: now,
      deadline: futureDays(3),
      volunteerIdKey: 'ARH-VOL-015',
    },
    {
      title: 'Community Compost Pit Construction — Pashan',
      description: 'Assist environmental team in digging compost trenches and segregating organic wet waste at Pashan community garden.',
      expectedHours: 3.0,
      assignmentDate: pastDays(1),
      deadline: futureDays(5),
      volunteerIdKey: 'ARH-VOL-016',
    },
    {
      title: 'Diwali Joy Gift Box Packing — Camp Warehouse',
      description: 'Pack festive gift boxes containing sweets, diyas, and handmade greeting cards prepared by underprivileged children.',
      expectedHours: 4.0,
      assignmentDate: now,
      deadline: futureDays(7),
      volunteerIdKey: 'ARH-VOL-001',
    },
    {
      title: 'Science Model Exhibition Support — Nigdi Pradhikaran',
      description: 'Guide school visitors through hands-on science experiments and assist young student demonstrators with exhibit setups.',
      expectedHours: 4.0,
      assignmentDate: pastDays(1),
      deadline: futureDays(4),
      volunteerIdKey: 'ARH-VOL-002',
    },
    {
      title: 'First Aid Kit Assembly & Inventory Audit — Kothrud',
      description: 'Inspect emergency medical kits, check expiry dates on antiseptics and bandages, and restock supplies.',
      expectedHours: 2.0,
      assignmentDate: now,
      deadline: futureDays(3),
      volunteerIdKey: 'ARH-VOL-004',
    },
    {
      title: 'Public Health Water Testing Camp — Khadki',
      description: 'Assist water quality testing technicians in collecting community tap water samples across 15 localities in Khadki.',
      expectedHours: 3.0,
      assignmentDate: pastDays(2),
      deadline: futureDays(5),
      volunteerIdKey: 'ARH-VOL-009',
    },
  ];

  for (const t of assignedTasksData) {
    const volunteerId = volunteerMap.get(t.volunteerIdKey)!;
    await prisma.task.create({
      data: {
        title: t.title,
        description: t.description,
        expectedHours: t.expectedHours,
        assignmentDate: t.assignmentDate,
        deadline: t.deadline,
        status: TaskStatus.ASSIGNED,
        assignedToId: volunteerId,
        createdById: admin.id,
      },
    });
  }
  console.log(`✅ Seeded ${assignedTasksData.length} ASSIGNED tasks`);

  // =========================================================================
  // 5. SUMMARY VALIDATION
  // =========================================================================
  const totalVolunteers = await prisma.user.count({ where: { role: Role.VOLUNTEER } });
  const activeVolunteers = await prisma.user.count({ where: { role: Role.VOLUNTEER, status: UserStatus.ACTIVE } });
  const inactiveVolunteers = await prisma.user.count({ where: { role: Role.VOLUNTEER, status: UserStatus.INACTIVE } });
  const totalTasks = await prisma.task.count();
  const totalSubmissions = await prisma.taskSubmission.count();
  const officialHoursAgg = await prisma.taskSubmission.aggregate({
    _sum: { approvedHours: true },
    where: { reviewStatus: ReviewStatus.APPROVED },
  });
  const totalOfficialHours = officialHoursAgg._sum.approvedHours || 0;

  console.log('\n====================================================');
  console.log('🎉 SEEDING COMPLETE — A RAY OF HOPE FOUNDATION');
  console.log('====================================================');
  console.log(`👥 Volunteers:        ${totalVolunteers} total (${activeVolunteers} active, ${inactiveVolunteers} inactive)`);
  console.log(`📋 Tasks:             ${totalTasks} total (8 Assigned, 5 Submitted, 9 Approved, 3 Rejected)`);
  console.log(`📝 Submissions:       ${totalSubmissions} total (5 Pending, 9 Approved, 3 Rejected)`);
  console.log(`⏱️  Official Hours:    ${totalOfficialHours} hrs (dynamically verified from approved submissions)`);
  console.log('====================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
