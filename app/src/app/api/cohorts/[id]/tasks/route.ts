import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { withRole } from "@/lib/api-middleware"

export const POST = withRole("ADMIN", async (_session, request) => {
  const segments = request.nextUrl.pathname.split("/")
  const cohortIdIndex = segments.indexOf("cohorts") + 1
  const cohortId = segments[cohortIdIndex]

  const { title, description, phase, track, priority, dueDate } =
    await request.json()

  if (!title) {
    return NextResponse.json(
      { error: "title is required" },
      { status: 400 }
    )
  }

  // Fetch all member userIds for this cohort
  const members = await db.cohortMember.findMany({
    where: { cohortId },
    select: { userId: true },
  })

  if (members.length === 0) {
    return NextResponse.json(
      { error: "Cohort has no members" },
      { status: 400 }
    )
  }

  const userIds = members.map((m) => m.userId)

  // Bulk create tasks for each member
  const taskResult = await db.task.createMany({
    data: userIds.map((userId) => ({
      userId,
      title,
      description: description || null,
      phase: phase || "INTRODUCTION",
      track: track || "SCHOLARSHIP",
      priority: priority || "MEDIUM",
      dueDate: dueDate ? new Date(dueDate) : null,
    })),
  })

  // Create a notification for each member
  await db.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      title: "New Task Assigned",
      message: `You've been assigned: ${title}`,
      type: "TASK",
      link: "/student/tasks",
    })),
  })

  return NextResponse.json({ created: taskResult.count })
})
