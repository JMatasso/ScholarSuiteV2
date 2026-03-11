import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create Admin user
  const adminPassword = await hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@scholarsuite.com" },
    update: {},
    create: {
      email: "admin@scholarsuite.com",
      name: "Dr. Sarah Mitchell",
      password: adminPassword,
      role: "ADMIN",
      isMasterAdmin: true,
    },
  });

  // Create Student users
  const studentPassword = await hash("student123", 12);
  const students = await Promise.all([
    prisma.user.upsert({
      where: { email: "alex.johnson@email.com" },
      update: {},
      create: {
        email: "alex.johnson@email.com",
        name: "Alex Johnson",
        password: studentPassword,
        role: "STUDENT",
      },
    }),
    prisma.user.upsert({
      where: { email: "maya.patel@email.com" },
      update: {},
      create: {
        email: "maya.patel@email.com",
        name: "Maya Patel",
        password: studentPassword,
        role: "STUDENT",
      },
    }),
    prisma.user.upsert({
      where: { email: "jordan.williams@email.com" },
      update: {},
      create: {
        email: "jordan.williams@email.com",
        name: "Jordan Williams",
        password: studentPassword,
        role: "STUDENT",
      },
    }),
  ]);

  // Create Student Profiles
  await Promise.all([
    prisma.studentProfile.upsert({
      where: { userId: students[0].id },
      update: {},
      create: {
        userId: students[0].id,
        firstName: "Alex",
        lastName: "Johnson",
        gpa: 3.7,
        gradeLevel: 12,
        highSchool: "Lincoln High School",
        graduationYear: 2026,
        satScore: 1380,
        state: "California",
        citizenship: "US Citizen",
        isFirstGen: true,
        isPellEligible: true,
        intendedMajor: "Computer Science",
        journeyStage: "ACTIVE_PREP",
        status: "ACTIVE",
        personalComplete: true,
        academicComplete: true,
        backgroundComplete: true,
        financialComplete: true,
        activitiesComplete: true,
        goalsComplete: false,
      },
    }),
    prisma.studentProfile.upsert({
      where: { userId: students[1].id },
      update: {},
      create: {
        userId: students[1].id,
        firstName: "Maya",
        lastName: "Patel",
        gpa: 3.9,
        gradeLevel: 11,
        highSchool: "Edison Academy",
        graduationYear: 2027,
        actScore: 32,
        state: "Texas",
        citizenship: "US Citizen",
        intendedMajor: "Pre-Med",
        journeyStage: "EARLY_EXPLORATION",
        status: "ACTIVE",
        personalComplete: true,
        academicComplete: true,
        backgroundComplete: false,
      },
    }),
    prisma.studentProfile.upsert({
      where: { userId: students[2].id },
      update: {},
      create: {
        userId: students[2].id,
        firstName: "Jordan",
        lastName: "Williams",
        gpa: 3.4,
        gradeLevel: 12,
        highSchool: "Westfield Prep",
        graduationYear: 2026,
        satScore: 1250,
        state: "New York",
        citizenship: "US Citizen",
        hasFinancialNeed: true,
        intendedMajor: "Business Administration",
        journeyStage: "APPLICATION_PHASE",
        status: "ACTIVE",
        personalComplete: true,
        academicComplete: true,
        backgroundComplete: true,
        financialComplete: true,
        activitiesComplete: true,
        goalsComplete: true,
      },
    }),
  ]);

  // Create Parent
  const parentPassword = await hash("parent123", 12);
  const parent = await prisma.user.upsert({
    where: { email: "parent.johnson@email.com" },
    update: {},
    create: {
      email: "parent.johnson@email.com",
      name: "Robert Johnson",
      password: parentPassword,
      role: "PARENT",
    },
  });

  await prisma.parentProfile.upsert({
    where: { userId: parent.id },
    update: {},
    create: {
      userId: parent.id,
      relationship: "Father",
    },
  });

  await prisma.parentStudent.upsert({
    where: { parentId_studentId: { parentId: parent.id, studentId: students[0].id } },
    update: {},
    create: { parentId: parent.id, studentId: students[0].id },
  });

  // Create Scholarships
  const scholarships = await Promise.all([
    prisma.scholarship.create({
      data: {
        name: "Gates Millennium Scholars",
        provider: "Bill & Melinda Gates Foundation",
        amount: 50000,
        deadline: new Date("2026-09-15"),
        description: "Full scholarship for outstanding minority students with significant financial need.",
        states: [],
        citizenships: ["US Citizen"],
        gradeLevels: [12],
        requiresPell: true,
        minGpa: 3.3,
      },
    }),
    prisma.scholarship.create({
      data: {
        name: "Coca-Cola Scholars Program",
        provider: "Coca-Cola Scholars Foundation",
        amount: 20000,
        deadline: new Date("2026-10-31"),
        description: "Achievement-based scholarship for high school seniors.",
        states: [],
        citizenships: ["US Citizen", "Permanent Resident"],
        gradeLevels: [12],
        minGpa: 3.0,
      },
    }),
    prisma.scholarship.create({
      data: {
        name: "Dell Scholars Program",
        provider: "Michael & Susan Dell Foundation",
        amount: 20000,
        deadline: new Date("2026-12-01"),
        description: "For students who have overcome significant obstacles to pursue education.",
        states: [],
        citizenships: ["US Citizen"],
        gradeLevels: [12],
        requiresPell: true,
        requiresFinancialNeed: true,
        minGpa: 2.4,
      },
    }),
    prisma.scholarship.create({
      data: {
        name: "California Dream Act Service Incentive Grant",
        provider: "California Student Aid Commission",
        amount: 5000,
        deadline: new Date("2026-03-02"),
        states: ["California"],
        gradeLevels: [12],
      },
    }),
    prisma.scholarship.create({
      data: {
        name: "STEM Leaders of Tomorrow",
        provider: "National Science Foundation",
        amount: 10000,
        deadline: new Date("2026-04-15"),
        fieldsOfStudy: ["Computer Science", "Engineering", "Mathematics", "Biology"],
        minGpa: 3.5,
        gradeLevels: [11, 12],
      },
    }),
  ]);

  // Create Applications
  await Promise.all([
    prisma.scholarshipApplication.create({
      data: {
        userId: students[0].id,
        scholarshipId: scholarships[0].id,
        status: "IN_PROGRESS",
        checklists: {
          create: [
            { title: "Complete personal statement", isCompleted: true, order: 1 },
            { title: "Request recommendation letters", isCompleted: true, order: 2 },
            { title: "Submit transcript", isCompleted: false, order: 3 },
            { title: "Financial documents", isCompleted: false, order: 4 },
          ],
        },
      },
    }),
    prisma.scholarshipApplication.create({
      data: {
        userId: students[0].id,
        scholarshipId: scholarships[1].id,
        status: "SUBMITTED",
      },
    }),
    prisma.scholarshipApplication.create({
      data: {
        userId: students[0].id,
        scholarshipId: scholarships[4].id,
        status: "AWARDED",
        amountAwarded: 10000,
      },
    }),
  ]);

  // Create Tasks
  await Promise.all([
    prisma.task.create({
      data: {
        userId: students[0].id,
        title: "Complete FAFSA application",
        description: "Submit the Free Application for Federal Student Aid",
        phase: "PHASE_1",
        track: "SCHOLARSHIP",
        priority: "HIGH",
        dueDate: new Date("2026-03-15"),
        status: "IN_PROGRESS",
      },
    }),
    prisma.task.create({
      data: {
        userId: students[0].id,
        title: "Draft personal statement for Gates Scholarship",
        phase: "PHASE_1",
        track: "SCHOLARSHIP",
        priority: "HIGH",
        dueDate: new Date("2026-04-01"),
        status: "NOT_STARTED",
      },
    }),
    prisma.task.create({
      data: {
        userId: students[0].id,
        title: "Research target universities",
        phase: "INTRODUCTION",
        track: "COLLEGE_PREP",
        priority: "MEDIUM",
        dueDate: new Date("2026-03-20"),
        status: "DONE",
      },
    }),
    prisma.task.create({
      data: {
        userId: students[0].id,
        title: "Request letters of recommendation",
        phase: "PHASE_2",
        track: "COLLEGE_PREP",
        priority: "HIGH",
        dueDate: new Date("2026-04-15"),
        notifyParent: true,
      },
    }),
  ]);

  // Create School
  await prisma.school.upsert({
    where: { joinCode: "LINCOLN2026" },
    update: {},
    create: {
      name: "Lincoln High School",
      city: "Los Angeles",
      state: "California",
      joinCode: "LINCOLN2026",
      email: "admin@lincolnhs.edu",
    },
  });

  console.log("Seed complete!");
  console.log("Login credentials:");
  console.log("  Admin:   admin@scholarsuite.com / admin123");
  console.log("  Student: alex.johnson@email.com / student123");
  console.log("  Parent:  parent.johnson@email.com / parent123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
