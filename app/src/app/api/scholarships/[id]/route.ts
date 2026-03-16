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
    const scholarship = await db.scholarship.findUnique({
      where: { id },
      include: { tags: true },
    })

    if (!scholarship) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(scholarship)
  } catch (error) {
    console.error("Error fetching scholarship:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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
    if (data.name !== undefined) updateData.name = data.name
    if (data.provider !== undefined) updateData.provider = data.provider
    if (data.amount !== undefined) updateData.amount = data.amount
    if (data.amountMax !== undefined) updateData.amountMax = data.amountMax
    if (data.deadline !== undefined) updateData.deadline = data.deadline ? new Date(data.deadline) : null
    if (data.description !== undefined) updateData.description = data.description
    if (data.url !== undefined) updateData.url = data.url
    if (data.minGpa !== undefined) updateData.minGpa = data.minGpa
    if (data.states !== undefined) updateData.states = data.states
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const scholarship = await db.scholarship.update({
      where: { id },
      data: updateData,
      include: { tags: true },
    })

    return NextResponse.json(scholarship)
  } catch (error) {
    console.error("Error updating scholarship:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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
    await db.scholarship.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting scholarship:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
