import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"
import { createActivityEvent } from "@/lib/activity-events"

export const PATCH = withAuth(
  async (session, request: NextRequest) => {
    const id = request.nextUrl.pathname.split("/").pop()!

    const visit = await db.collegeVisit.findUnique({
      where: { id },
      include: {
        collegeApplication: {
          select: { id: true, universityName: true, userId: true },
        },
      },
    })

    if (!visit) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Only the owner, an admin, or a linked parent can update
    let canAccess = visit.userId === session.user.id || session.user.role === "ADMIN"
    if (!canAccess && session.user.role === "PARENT") {
      const link = await db.parentStudent.findFirst({
        where: { parentId: session.user.id, studentId: visit.userId },
      })
      canAccess = !!link
    }
    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const data = await request.json()

    const updated = await db.collegeVisit.update({
      where: { id },
      data: {
        ...(data.completed !== undefined && { completed: data.completed }),
        ...(data.notes !== undefined && { notes: data.notes?.trim() || null }),
        ...(data.rating !== undefined && { rating: data.rating != null ? parseInt(data.rating) : null }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.scheduledAt !== undefined && {
          scheduledAt: new Date(data.scheduledAt),
        }),
      },
    })

    // If visit was marked completed, fire activity event
    if (data.completed === true && !visit.completed) {
      createActivityEvent({
        studentId: visit.userId,
        type: "COLLEGE_VISIT_COMPLETED",
        title: `Visit completed: ${visit.collegeApplication.universityName}`,
        description: `${visit.type.replace(/_/g, " ")} at ${visit.collegeApplication.universityName} has been completed.`,
        metadata: {
          visitId: visit.id,
          applicationId: visit.collegeApplication.id,
          university: visit.collegeApplication.universityName,
          rating: data.rating ?? null,
        },
      })
    }

    return NextResponse.json(updated)
  }
)

export const DELETE = withAuth(
  async (session, request: NextRequest) => {
    const id = request.nextUrl.pathname.split("/").pop()!

    const visit = await db.collegeVisit.findUnique({
      where: { id },
    })

    if (!visit) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Only the owner or an admin can delete
    if (
      session.user.role !== "ADMIN" &&
      visit.userId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete associated calendar event if it exists
    if (visit.calendarEventId) {
      await db.calendarEvent.delete({
        where: { id: visit.calendarEventId },
      }).catch(() => {
        // Calendar event may have already been deleted
      })
    }

    await db.collegeVisit.delete({ where: { id } })

    return NextResponse.json({ success: true })
  }
)
