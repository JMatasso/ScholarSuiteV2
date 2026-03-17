import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const newCycleYear = data.cycleYear

    if (!newCycleYear) {
      return NextResponse.json({ error: "cycleYear is required (e.g. '2027-2028')" }, { status: 400 })
    }

    // Flip all CONFIRMED local scholarships to PENDING_CONFIRMATION
    const result = await db.scholarship.updateMany({
      where: {
        source: "LOCAL",
        cycleStatus: "CONFIRMED",
        cycleYear: { not: newCycleYear },
      },
      data: {
        cycleStatus: "PENDING_CONFIRMATION",
      },
    })

    return NextResponse.json({
      success: true,
      flipped: result.count,
      newCycleYear,
      message: `${result.count} scholarships moved to Pending Confirmation for ${newCycleYear}`,
    })
  } catch (error) {
    console.error("Error rolling over cycle:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
