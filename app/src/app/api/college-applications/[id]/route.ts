import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"

export const GET = withAuth(
  async (session, request: NextRequest) => {
    const id = request.nextUrl.pathname.split("/").pop()!

    const app = await db.collegeApplication.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
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
      },
    })

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
