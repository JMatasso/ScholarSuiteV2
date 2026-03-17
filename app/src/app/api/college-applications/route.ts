import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"
import { createActivityEvent, notifyLinkedParents } from "@/lib/activity-events"
import { generateCollegeAddedTasks } from "@/lib/college-task-generator"

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
      college: true,
      visits: true,
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
      // College link
      ...(data.collegeId !== undefined && { collegeId: data.collegeId || null }),
      // Classification
      ...(data.classification !== undefined && { classification: data.classification || null }),
      // Application details
      ...(data.platform !== undefined && { platform: data.platform || null }),
      ...(data.applicationFee !== undefined && {
        applicationFee: data.applicationFee != null ? parseFloat(data.applicationFee) : null,
      }),
      ...(data.feeWaiverUsed !== undefined && { feeWaiverUsed: data.feeWaiverUsed }),
      // Supplemental tracking
      ...(data.supplementalEssays !== undefined && { supplementalEssays: data.supplementalEssays ?? null }),
      ...(data.recommenders !== undefined && { recommenders: data.recommenders ?? null }),
      ...(data.transcriptSent !== undefined && { transcriptSent: data.transcriptSent }),
      ...(data.testScoresSent !== undefined && { testScoresSent: data.testScoresSent }),
      // Financial aid
      ...(data.financialAidDeadline !== undefined && {
        financialAidDeadline: data.financialAidDeadline ? new Date(data.financialAidDeadline) : null,
      }),
      ...(data.fafsaSent !== undefined && { fafsaSent: data.fafsaSent }),
      ...(data.cssProfileSent !== undefined && { cssProfileSent: data.cssProfileSent }),
      ...(data.aidPackage !== undefined && { aidPackage: data.aidPackage ?? null }),
      ...(data.netCostEstimate !== undefined && {
        netCostEstimate: data.netCostEstimate != null ? parseFloat(data.netCostEstimate) : null,
      }),
      // Decision
      ...(data.depositDeadline !== undefined && {
        depositDeadline: data.depositDeadline ? new Date(data.depositDeadline) : null,
      }),
      ...(data.depositPaid !== undefined && { depositPaid: data.depositPaid }),
      ...(data.committed !== undefined && { committed: data.committed }),
      // Sort order
      ...(data.listOrder !== undefined && { listOrder: parseInt(data.listOrder) }),
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

  // Auto-generate tasks for the new college application
  generateCollegeAddedTasks(session.user.id, app.universityName, app.id).catch(
    (err) => console.error("Failed to generate college-added tasks:", err)
  )

  return NextResponse.json(app, { status: 201 })
})
