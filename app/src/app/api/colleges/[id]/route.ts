import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const college = await db.college.findUnique({
      where: { id },
      include: {
        applications: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { applications: true } },
      },
    })

    if (!college) {
      return NextResponse.json(
        { error: "College not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(college)
  } catch (error) {
    console.error("Error fetching college:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
