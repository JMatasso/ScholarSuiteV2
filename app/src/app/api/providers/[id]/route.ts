import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const provider = await db.provider.findUnique({
      where: { id },
      include: {
        scholarships: {
          orderBy: { deadline: "asc" },
          select: {
            id: true,
            name: true,
            amount: true,
            deadline: true,
            cycleStatus: true,
            cycleYear: true,
            isActive: true,
          },
        },
      },
    })

    if (!provider) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(provider)
  } catch (error) {
    console.error("Error fetching provider:", error)
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
    const fields = ["name", "type", "county", "state", "contactName", "contactEmail", "contactPhone", "website", "notes", "status", "lastContactedAt"]
    for (const field of fields) {
      if (data[field] !== undefined) {
        updateData[field] = field === "lastContactedAt" && data[field] ? new Date(data[field]) : data[field]
      }
    }

    const provider = await db.provider.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(provider)
  } catch (error) {
    console.error("Error updating provider:", error)
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
    await db.provider.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting provider:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
