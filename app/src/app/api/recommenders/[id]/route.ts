import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

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
    const data = await req.json()

    // Verify ownership
    const existing = await db.recommender.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    const fields = ["name", "title", "email", "phone", "relationship", "category", "status", "notes", "thankYouSent"]
    for (const field of fields) {
      if (data[field] !== undefined) updateData[field] = data[field]
    }
    if (data.requestedAt !== undefined) updateData.requestedAt = data.requestedAt ? new Date(data.requestedAt) : null
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
    if (data.receivedAt !== undefined) updateData.receivedAt = data.receivedAt ? new Date(data.receivedAt) : null

    // Auto-set dates based on status changes
    if (data.status === "REQUESTED" && !data.requestedAt) {
      updateData.requestedAt = new Date()
    }
    if (data.status === "RECEIVED" && !data.receivedAt) {
      updateData.receivedAt = new Date()
    }

    const recommender = await db.recommender.update({
      where: { id },
      data: updateData,
    })

    // Update college app links if provided
    if (data.collegeAppIds !== undefined) {
      await db.recommenderCollegeApp.deleteMany({ where: { recommenderId: id } })
      if (data.collegeAppIds.length > 0) {
        await db.recommenderCollegeApp.createMany({
          data: data.collegeAppIds.map((appId: string) => ({
            recommenderId: id,
            collegeAppId: appId,
          })),
          skipDuplicates: true,
        })
      }
    }

    // Update scholarship app links if provided
    if (data.scholarshipAppIds !== undefined) {
      await db.recommenderScholarshipApp.deleteMany({ where: { recommenderId: id } })
      if (data.scholarshipAppIds.length > 0) {
        await db.recommenderScholarshipApp.createMany({
          data: data.scholarshipAppIds.map((appId: string) => ({
            recommenderId: id,
            scholarshipAppId: appId,
          })),
          skipDuplicates: true,
        })
      }
    }

    return NextResponse.json(recommender)
  } catch (error) {
    console.error("Error updating recommender:", error)
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
    const existing = await db.recommender.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await db.recommender.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting recommender:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
