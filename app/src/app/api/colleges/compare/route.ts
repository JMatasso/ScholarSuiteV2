import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "ids must be a non-empty array" },
        { status: 400 }
      )
    }

    if (ids.length > 4) {
      return NextResponse.json(
        { error: "Maximum 4 colleges can be compared at once" },
        { status: 400 }
      )
    }

    const colleges = await db.college.findMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json(colleges)
  } catch (error) {
    console.error("Error comparing colleges:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
