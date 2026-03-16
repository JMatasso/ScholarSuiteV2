import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

// POST — create a new lesson within a module (admin only)
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    if (!data.moduleId || !data.title) {
      return NextResponse.json({ error: "moduleId and title are required" }, { status: 400 })
    }

    // Get max order for this module
    const maxOrder = await db.lesson.aggregate({
      where: { moduleId: data.moduleId },
      _max: { order: true },
    })

    const lesson = await db.lesson.create({
      data: {
        moduleId: data.moduleId,
        title: data.title,
        content: data.content || null,
        videoUrl: data.videoUrl || null,
        externalUrl: data.externalUrl || null,
        type: data.type || "TEXT",
        order: data.order ?? (maxOrder._max.order || 0) + 1,
      },
    })

    return NextResponse.json(lesson, { status: 201 })
  } catch (error) {
    console.error("Error creating lesson:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH — update a lesson (admin only)
export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    if (!data.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.content !== undefined) updateData.content = data.content
    if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl
    if (data.externalUrl !== undefined) updateData.externalUrl = data.externalUrl
    if (data.type !== undefined) updateData.type = data.type
    if (data.order !== undefined) updateData.order = data.order

    const lesson = await db.lesson.update({
      where: { id: data.id },
      data: updateData,
    })

    return NextResponse.json(lesson)
  } catch (error) {
    console.error("Error updating lesson:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE — delete a lesson (admin only)
export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    if (!data.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    await db.lesson.delete({ where: { id: data.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting lesson:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
