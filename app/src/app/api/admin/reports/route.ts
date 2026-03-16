import { NextRequest, NextResponse } from "next/server"
import { withRole } from "@/lib/api-middleware"
import { db } from "@/lib/db"

export const GET = withRole("ADMIN", async (session, request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const end = endDate ? new Date(endDate) : new Date()
  // Set end to end of day
  end.setHours(23, 59, 59, 999)

  // Get assigned student IDs (or all if none assigned)
  const assigned = await db.studentProfile.findMany({
    where: { assignedAdminId: session.user.id },
    select: { userId: true },
  })

  let studentIds: string[]
  if (assigned.length > 0) {
    studentIds = assigned.map((s) => s.userId)
  } else {
    const all = await db.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true },
    })
    studentIds = all.map((s) => s.id)
  }

  if (studentIds.length === 0) {
    return NextResponse.json({
      summary: { tasksCompleted: 0, essaysUpdated: 0, applicationsSubmitted: 0, messagesExchanged: 0 },
      students: [],
    })
  }

  // Aggregate queries in parallel
  const [
    tasksCompleted,
    essaysUpdated,
    applicationsSubmitted,
    messagesExchanged,
    studentDetails,
  ] = await Promise.all([
    db.task.count({
      where: {
        userId: { in: studentIds },
        status: "DONE",
        updatedAt: { gte: start, lte: end },
      },
    }),
    db.essay.count({
      where: {
        userId: { in: studentIds },
        updatedAt: { gte: start, lte: end },
      },
    }),
    db.scholarshipApplication.count({
      where: {
        userId: { in: studentIds },
        createdAt: { gte: start, lte: end },
      },
    }),
    db.message.count({
      where: {
        OR: [
          { senderId: { in: studentIds } },
          { receiverId: { in: studentIds } },
        ],
        createdAt: { gte: start, lte: end },
      },
    }),
    // Per-student breakdown
    db.user.findMany({
      where: { id: { in: studentIds } },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        tasks: {
          where: { status: "DONE", updatedAt: { gte: start, lte: end } },
          select: { id: true },
        },
        essays: {
          where: { updatedAt: { gte: start, lte: end } },
          select: { id: true },
        },
        scholarshipApps: {
          where: { createdAt: { gte: start, lte: end } },
          select: { id: true },
        },
        sentMessages: {
          where: { createdAt: { gte: start, lte: end } },
          select: { id: true },
        },
      },
    }),
  ])

  const students = studentDetails.map((s) => ({
    id: s.id,
    name: s.name || s.email,
    image: s.image,
    tasksCompleted: s.tasks.length,
    essaysUpdated: s.essays.length,
    applicationsSubmitted: s.scholarshipApps.length,
    messagesExchanged: s.sentMessages.length,
  }))

  return NextResponse.json({
    summary: { tasksCompleted, essaysUpdated, applicationsSubmitted, messagesExchanged },
    students,
  })
})
