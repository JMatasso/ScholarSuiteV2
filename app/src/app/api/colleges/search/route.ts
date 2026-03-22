import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q") || ""

    if (q.length < 2) {
      return NextResponse.json([])
    }

    const colleges = await db.college.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { alias: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        scorecardId: true,
        name: true,
        city: true,
        state: true,
        type: true,
        acceptanceRate: true,
        inStateTuition: true,
        outOfStateTuition: true,
        roomAndBoard: true,
        booksSupplies: true,
      },
      orderBy: { name: "asc" },
      take: 10,
    })

    return NextResponse.json(colleges)
  } catch (error) {
    console.error("Error searching colleges:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
