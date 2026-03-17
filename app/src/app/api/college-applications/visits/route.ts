import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"
import { createActivityEvent, notifyLinkedParents } from "@/lib/activity-events"

export const GET = withAuth(async (session) => {
  const role = session.user.role

  let where: object = { userId: session.user.id }
  if (role === "ADMIN") {
    where = {}
  } else if (role === "PARENT") {
    const links = await db.parentStudent.findMany({
      where: { parentId: session.user.id },
      select: { studentId: true },
    })
    const studentIds = links.map((l) => l.studentId)
    where = { userId: { in: studentIds } }
  }

  // Get all visits for college applications belonging to the user(s)
  const apps = await db.collegeApplication.findMany({
    where,
    select: { id: true },
  })
  const appIds = apps.map((a) => a.id)

  const visits = await db.collegeVisit.findMany({
    where: { collegeApplicationId: { in: appIds } },
    include: {
      collegeApplication: {
        select: { id: true, universityName: true, userId: true },
      },
    },
    orderBy: { scheduledAt: "asc" },
  })

  return NextResponse.json(visits)
})

export const POST = withAuth(async (session, request: NextRequest) => {
  if (session.user.role !== "STUDENT") {
    return NextResponse.json(
      { error: "Only students can create visits" },
      { status: 403 }
    )
  }

  const data = await request.json()

  if (!data.collegeApplicationId || !data.scheduledAt) {
    return NextResponse.json(
      { error: "collegeApplicationId and scheduledAt are required" },
      { status: 400 }
    )
  }

  // Verify the application belongs to this student
  const app = await db.collegeApplication.findUnique({
    where: { id: data.collegeApplicationId },
  })

  if (!app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 })
  }

  if (app.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const scheduledAt = new Date(data.scheduledAt)
  const visitType = data.type || "CAMPUS_TOUR"

  // Create a CalendarEvent linked to the visit
  const calendarEvent = await db.calendarEvent.create({
    data: {
      title: `${app.universityName} - ${visitType.replace(/_/g, " ")}`,
      description: data.notes || null,
      date: scheduledAt,
      type: "COLLEGE_VISIT",
      linkedId: data.collegeApplicationId,
    },
  })

  // Create the visit
  const visit = await db.collegeVisit.create({
    data: {
      collegeApplicationId: data.collegeApplicationId,
      userId: session.user.id,
      type: visitType,
      scheduledAt,
      notes: data.notes?.trim() || null,
      calendarEventId: calendarEvent.id,
    },
  })

  // Create a task "Prepare for [college] [visit type]" due 1 day before
  const prepDate = new Date(scheduledAt)
  prepDate.setDate(prepDate.getDate() - 1)

  await db.task.create({
    data: {
      userId: session.user.id,
      title: `Prepare for ${app.universityName} ${visitType.replace(/_/g, " ").toLowerCase()}`,
      description: `Get ready for your upcoming ${visitType.replace(/_/g, " ").toLowerCase()} at ${app.universityName}.`,
      phase: "PHASE_1",
      track: "COLLEGE_PREP",
      status: "NOT_STARTED",
      priority: "MEDIUM",
      dueDate: prepDate,
    },
  })

  // Fire activity event
  createActivityEvent({
    studentId: session.user.id,
    type: "COLLEGE_VISIT_SCHEDULED",
    title: `Visit scheduled: ${app.universityName}`,
    description: `${visitType.replace(/_/g, " ")} scheduled for ${scheduledAt.toLocaleDateString()}.`,
    metadata: { visitId: visit.id, applicationId: app.id, university: app.universityName },
  })
  notifyLinkedParents({
    studentId: session.user.id,
    title: "College Visit Scheduled",
    message: `Your student scheduled a ${visitType.replace(/_/g, " ").toLowerCase()} at ${app.universityName} on ${scheduledAt.toLocaleDateString()}.`,
    link: "/parent/colleges",
    type: "COLLEGE_APP_SUBMITTED",
  })

  return NextResponse.json(visit, { status: 201 })
})
