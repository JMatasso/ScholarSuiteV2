import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const county = searchParams.get("county") || ""
    const state = searchParams.get("state") || ""
    const cycleStatus = searchParams.get("cycleStatus") || ""
    const search = searchParams.get("search") || ""
    const pending = searchParams.get("pending") === "true"

    const where: Record<string, unknown> = { source: "LOCAL" }

    if (county) where.county = { contains: county, mode: "insensitive" }
    if (state) where.states = { has: state }
    if (cycleStatus) where.cycleStatus = cycleStatus
    if (pending) where.isActive = false
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { provider: { contains: search, mode: "insensitive" } },
      ]
    }

    const scholarships = await db.scholarship.findMany({
      where,
      include: {
        providerOrg: { select: { id: true, name: true, type: true, county: true, state: true } },
        tags: true,
        _count: { select: { applications: true } },
      },
      orderBy: { deadline: "asc" },
    })

    return NextResponse.json(scholarships)
  } catch (error) {
    console.error("Error fetching local scholarships:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
