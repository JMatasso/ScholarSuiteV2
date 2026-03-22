import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const role = (session.user as { role: string }).role

    const application = await db.scholarshipApplication.findUnique({
      where: { id },
      include: {
        scholarship: true,
        checklists: true,
        essays: {
          include: { versions: { take: 1, orderBy: { version: "desc" } } },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    })

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    // Authorization: student can only see their own, parent must be linked
    if (role === "STUDENT" && application.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (role === "PARENT") {
      const link = await db.parentStudent.findFirst({
        where: { parentId: session.user.id, studentId: application.userId },
      })
      if (!link) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error("Error fetching application:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const role = (session.user as { role: string }).role
    const data = await req.json()

    // Verify ownership
    const existing = await db.scholarshipApplication.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    if (role === "STUDENT" && existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (role === "PARENT") {
      return NextResponse.json({ error: "Parents cannot modify applications" }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {}
    if (data.progress !== undefined) updateData.progress = data.progress
    if (data.status !== undefined) updateData.status = data.status
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.amountAwarded !== undefined) updateData.amountAwarded = data.amountAwarded
    if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring

    const application = await db.scholarshipApplication.update({
      where: { id },
      data: updateData,
      include: {
        scholarship: true,
        checklists: true,
        essays: true,
        user: { select: { id: true, name: true, email: true } },
      },
    })

    // Auto-create proof-of-award task when status changes to AWARDED
    if (data.status === "AWARDED" && application.scholarship) {
      const scholarshipName = application.scholarship.name
      const proofTitle = `Upload proof of award: ${scholarshipName}`
      const existingProofTask = await db.task.findFirst({
        where: { userId: existing.userId, title: proofTitle },
      })
      if (!existingProofTask) {
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 7)
        await db.task.create({
          data: {
            userId: existing.userId,
            title: proofTitle,
            description: `Upload a screenshot of the award email or acceptance notification for "${scholarshipName}".`,
            phase: "ONGOING",
            track: "SCHOLARSHIP",
            priority: "HIGH",
            requiresUpload: true,
            documentFolder: "Acceptance Letters",
            dueDate,
            notifyParent: true,
          },
        })
      }
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error("Error updating application:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const role = (session.user as { role: string }).role

    const existing = await db.scholarshipApplication.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    if (role === "STUDENT" && existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (role === "PARENT") {
      return NextResponse.json({ error: "Parents cannot delete applications" }, { status: 403 })
    }

    await db.scholarshipApplication.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting application:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
