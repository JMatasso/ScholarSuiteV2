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

  const apps = await db.collegeApplication.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(apps)
})

export const POST = withAuth(async (session, request: NextRequest) => {
  if (session.user.role !== "STUDENT") {
    return NextResponse.json(
      { error: "Only students can create college applications" },
      { status: 403 }
    )
  }

  const data = await request.json()

  if (!data.universityName?.trim()) {
    return NextResponse.json(
      { error: "University name is required" },
      { status: 400 }
    )
  }

  const app = await db.collegeApplication.create({
    data: {
      userId: session.user.id,
      universityName: data.universityName.trim(),
      applicationType: data.applicationType || "REGULAR",
      status: data.status || "RESEARCHING",
      deadline: data.deadline ? new Date(data.deadline) : null,
      cost: data.cost ? parseFloat(data.cost) : null,
      isDream: data.isDream ?? false,
      isSafety: data.isSafety ?? false,
      notes: data.notes?.trim() || null,
    },
  })

  // Fire activity event for new college application
  createActivityEvent({
    studentId: session.user.id,
    type: "COLLEGE_APP_SUBMITTED",
    title: `College application added: ${app.universityName}`,
    description: `Application to "${app.universityName}" has been created.`,
    metadata: { applicationId: app.id, university: app.universityName },
  })
  notifyLinkedParents({
    studentId: session.user.id,
    title: "New College Application",
    message: `Your student added a college application for "${app.universityName}".`,
    link: "/parent/colleges",
    type: "COLLEGE_APP_SUBMITTED",
  })

  return NextResponse.json(app, { status: 201 })
})
