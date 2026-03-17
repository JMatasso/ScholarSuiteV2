import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"
import { createActivityEvent, notifyLinkedParents } from "@/lib/activity-events"
import {
  generateApplicationStartedTasks,
  generateAcceptedTasks,
  generateCommittedTasks,
} from "@/lib/college-task-generator"

export const GET = withAuth(
  async (session, request: NextRequest) => {
    const id = request.nextUrl.pathname.split("/").pop()!

    const app = await db.collegeApplication.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        college: true,
        visits: true,
      },
    })

    if (!app) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Ownership check for students
    if (session.user.role === "STUDENT" && app.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Parent check — must be linked
    if (session.user.role === "PARENT") {
      const link = await db.parentStudent.findFirst({
        where: { parentId: session.user.id, studentId: app.userId },
      })
      if (!link) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    return NextResponse.json(app)
  }
)

export const PATCH = withAuth(
  async (session, request: NextRequest) => {
    const id = request.nextUrl.pathname.split("/").pop()!

    const existing = await db.collegeApplication.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Only the owner or an admin can update
    if (
      session.user.role !== "ADMIN" &&
      existing.userId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const data = await request.json()

    const updated = await db.collegeApplication.update({
      where: { id },
      data: {
        ...(data.universityName !== undefined && {
          universityName: data.universityName.trim(),
        }),
        ...(data.applicationType !== undefined && {
          applicationType: data.applicationType,
        }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.deadline !== undefined && {
          deadline: data.deadline ? new Date(data.deadline) : null,
        }),
        ...(data.cost !== undefined && {
          cost: data.cost ? parseFloat(data.cost) : null,
        }),
        ...(data.isDream !== undefined && { isDream: data.isDream }),
        ...(data.isSafety !== undefined && { isSafety: data.isSafety }),
        ...(data.notes !== undefined && {
          notes: data.notes?.trim() || null,
        }),
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

    // Auto-generate tasks based on status transitions
    if (data.status === "IN_PROGRESS" && existing.status !== "IN_PROGRESS") {
      generateApplicationStartedTasks(
        existing.userId,
        updated.universityName,
        updated.applicationType,
        updated.deadline
      ).catch((err) =>
        console.error("Failed to generate application-started tasks:", err)
      )
    }

    if (data.status === "ACCEPTED" && existing.status !== "ACCEPTED") {
      generateAcceptedTasks(
        existing.userId,
        updated.universityName,
        updated.depositDeadline
      ).catch((err) =>
        console.error("Failed to generate accepted tasks:", err)
      )
    }

    if (data.committed === true && !existing.committed) {
      generateCommittedTasks(existing.userId, updated.universityName).catch(
        (err) =>
          console.error("Failed to generate committed tasks:", err)
      )
    }

    // Fire activity event when status changes to SUBMITTED
    if (data.status === "SUBMITTED" && existing.status !== "SUBMITTED") {
      createActivityEvent({
        studentId: existing.userId,
        type: "COLLEGE_APP_SUBMITTED",
        title: `College application submitted: ${updated.universityName}`,
        description: `Application to "${updated.universityName}" has been submitted.`,
        metadata: { applicationId: updated.id, university: updated.universityName },
      })
      notifyLinkedParents({
        studentId: existing.userId,
        title: "College Application Submitted",
        message: `Your student submitted their application to "${updated.universityName}"!`,
        link: "/parent/colleges",
        type: "COLLEGE_APP_SUBMITTED",
      })
    }

    return NextResponse.json(updated)
  }
)

export const DELETE = withAuth(
  async (session, request: NextRequest) => {
    const id = request.nextUrl.pathname.split("/").pop()!

    const existing = await db.collegeApplication.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Only the owner or an admin can delete
    if (
      session.user.role !== "ADMIN" &&
      existing.userId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await db.collegeApplication.delete({ where: { id } })

    return NextResponse.json({ success: true })
  }
)
