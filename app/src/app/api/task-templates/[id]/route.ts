import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

// PATCH — update a template item
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const data = await req.json()

    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.phase !== undefined) updateData.phase = data.phase
    if (data.track !== undefined) updateData.track = data.track
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.order !== undefined) updateData.order = data.order
    if (data.documentFolder !== undefined) updateData.documentFolder = data.documentFolder
    if (data.requiresUpload !== undefined) updateData.requiresUpload = data.requiresUpload

    const item = await db.taskTemplateItem.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error("Error updating template item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE — remove a template item
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await db.taskTemplateItem.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting template item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
