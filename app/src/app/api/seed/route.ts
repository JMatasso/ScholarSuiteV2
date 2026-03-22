import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hash } from "bcryptjs"

export async function GET(req: NextRequest) {
  return POST(req)
}

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")

  if (!process.env.SEED_SECRET || secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Admin
    const adminPassword = await hash("admin123", 12)
    await db.user.upsert({
      where: { email: "admin@scholarsuite.com" },
      update: {},
      create: {
        email: "admin@scholarsuite.com",
        name: "Dr. Sarah Mitchell",
        password: adminPassword,
        role: "ADMIN",
        isMasterAdmin: true,
      },
    })

    // Students
    const studentPassword = await hash("student123", 12)
    const students = await Promise.all([
      db.user.upsert({
        where: { email: "alex.johnson@email.com" },
        update: {},
        create: {
          email: "alex.johnson@email.com",
          name: "Alex Johnson",
          password: studentPassword,
          role: "STUDENT",
        },
      }),
      db.user.upsert({
        where: { email: "maya.patel@email.com" },
        update: {},
        create: {
          email: "maya.patel@email.com",
          name: "Maya Patel",
          password: studentPassword,
          role: "STUDENT",
        },
      }),
    ])

    // Student Profiles
    await Promise.all([
      db.studentProfile.upsert({
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
      db.studentProfile.upsert({
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
    ])

    // Parent
    const parentPassword = await hash("parent123", 12)
    const parent = await db.user.upsert({
      where: { email: "parent.johnson@email.com" },
      update: {},
      create: {
        email: "parent.johnson@email.com",
        name: "Robert Johnson",
        password: parentPassword,
        role: "PARENT",
      },
    })

    await db.parentProfile.upsert({
      where: { userId: parent.id },
      update: {},
      create: {
        userId: parent.id,
        relationship: "Father",
      },
    })

    await db.parentStudent.upsert({
      where: { parentId_studentId: { parentId: parent.id, studentId: students[0].id } },
      update: {},
      create: { parentId: parent.id, studentId: students[0].id },
    })

    // Scholarships (use upsert by name via findFirst + create pattern to stay idempotent)
    const scholarshipData = [
      {
        name: "Gates Millennium Scholars",
        provider: "Bill & Melinda Gates Foundation",
        amount: 50000,
        deadline: new Date("2026-09-15"),
        description: "Full scholarship for outstanding minority students with significant financial need.",
        states: [] as string[],
        citizenships: ["US Citizen"],
        gradeLevels: [12],
        requiresPell: true,
        minGpa: 3.3,
      },
      {
        name: "Coca-Cola Scholars Program",
        provider: "Coca-Cola Scholars Foundation",
        amount: 20000,
        deadline: new Date("2026-10-31"),
        description: "Achievement-based scholarship for high school seniors.",
        states: [] as string[],
        citizenships: ["US Citizen", "Permanent Resident"],
        gradeLevels: [12],
        minGpa: 3.0,
      },
      {
        name: "STEM Leaders of Tomorrow",
        provider: "National Science Foundation",
        amount: 10000,
        deadline: new Date("2026-04-15"),
        fieldsOfStudy: ["Computer Science", "Engineering", "Mathematics", "Biology"],
        minGpa: 3.5,
        gradeLevels: [11, 12],
      },
    ]

    const scholarships = await Promise.all(
      scholarshipData.map(async (data) => {
        const existing = await db.scholarship.findFirst({ where: { name: data.name } })
        if (existing) return existing
        return db.scholarship.create({ data })
      })
    )

    // Applications for Student 1 (idempotent: only create if none exist)
    const existingApps = await db.scholarshipApplication.findMany({
      where: { userId: students[0].id },
    })

    if (existingApps.length === 0) {
      await Promise.all([
        db.scholarshipApplication.create({
          data: {
            userId: students[0].id,
            scholarshipId: scholarships[0].id,
            progress: "IN_PROGRESS",
            status: "PENDING",
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
        db.scholarshipApplication.create({
          data: {
            userId: students[0].id,
            scholarshipId: scholarships[1].id,
            progress: "SUBMITTED",
            status: "PENDING",
          },
        }),
      ])
    }

    // Tasks for Student 1 (idempotent: only create if none exist)
    const existingTasks = await db.task.findMany({
      where: { userId: students[0].id },
    })

    if (existingTasks.length === 0) {
      await Promise.all([
        db.task.create({
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
        db.task.create({
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
        db.task.create({
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
      ])
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      credentials: {
        admin: { email: "admin@scholarsuite.com", password: "admin123" },
        student1: { email: "alex.johnson@email.com", password: "student123" },
        student2: { email: "maya.patel@email.com", password: "student123" },
        parent: { email: "parent.johnson@email.com", password: "parent123" },
      },
    })
  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json(
      { error: "Seed failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
