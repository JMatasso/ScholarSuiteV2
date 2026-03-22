import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { TASK_PHASE_TO_JOURNEY_STAGE } from "@/lib/constants"
import { computeJourneyStage } from "@/lib/journey"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = session.user.role
    const searchParams = request.nextUrl.searchParams
    let studentId = searchParams.get("studentId")

    // Determine which student to fetch
    if (role === "STUDENT") {
      studentId = session.user.id
    } else if (role === "PARENT") {
      if (!studentId) {
        return NextResponse.json({ error: "studentId required" }, { status: 400 })
      }
      // Validate parent-student link
      const link = await db.parentStudent.findFirst({
        where: { parentId: session.user.id, studentId },
      })
      if (!link) {
        return NextResponse.json({ error: "Not linked to this student" }, { status: 403 })
      }
    } else if (role === "ADMIN") {
      if (!studentId) {
        return NextResponse.json({ error: "studentId required" }, { status: 400 })
      }
    }

    if (!studentId) {
      return NextResponse.json({ error: "studentId required" }, { status: 400 })
    }

    // Fetch student profile
    const profile = await db.studentProfile.findUnique({
      where: { userId: studentId },
      select: {
        journeyStage: true,
        serviceTier: true,
        gradeLevel: true,
        graduationYear: true,
        graduationMonth: true,
      },
    })

    // Recalculate journey stage from graduation date so it stays current
    let journeyStage = profile?.journeyStage || "EARLY_EXPLORATION"
    if (profile?.graduationYear) {
      const computed = computeJourneyStage(profile.graduationYear, profile.graduationMonth)
      if (computed !== journeyStage) {
        journeyStage = computed
        await db.studentProfile.update({
          where: { userId: studentId },
          data: { journeyStage: computed },
        })
      }
    }

    // Fetch tasks
    const tasks = await db.task.findMany({
      where: { userId: studentId },
      select: { phase: true, status: true },
    })

    // Group tasks by journey stage
    const tasksByStage: Record<string, { total: number; completed: number }> = {
      EARLY_EXPLORATION: { total: 0, completed: 0 },
      ACTIVE_PREP: { total: 0, completed: 0 },
      APPLICATION_PHASE: { total: 0, completed: 0 },
      POST_ACCEPTANCE: { total: 0, completed: 0 },
    }

    for (const task of tasks) {
      const stage = TASK_PHASE_TO_JOURNEY_STAGE[task.phase] || "EARLY_EXPLORATION"
      if (tasksByStage[stage]) {
        tasksByStage[stage].total++
        if (task.status === "DONE") {
          tasksByStage[stage].completed++
        }
      }
    }

    // Fetch scholarship applications
    const applications = await db.scholarshipApplication.findMany({
      where: { userId: studentId },
      include: {
        scholarship: {
          select: { name: true, amount: true, deadline: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({
      journeyStage,
      serviceTier: profile?.serviceTier || null,
      gradeLevel: profile?.gradeLevel || null,
      graduationYear: profile?.graduationYear || null,
      tasksByStage,
      applications: applications.map((a) => ({
        id: a.id,
        status: a.status,
        amountAwarded: a.amountAwarded,
        scholarship: a.scholarship,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("Timeline API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
