import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all local scholarships grouped by county
    const scholarships = await db.scholarship.findMany({
      where: { source: "LOCAL" },
      select: {
        county: true,
        cycleStatus: true,
        providerId: true,
      },
    })

    // Build county stats
    const countyMap = new Map<string, {
      county: string
      total: number
      confirmed: number
      pending: number
      notRenewed: number
      unknown: number
      providerIds: Set<string>
    }>()

    for (const s of scholarships) {
      const key = s.county || "Unassigned"
      if (!countyMap.has(key)) {
        countyMap.set(key, {
          county: key,
          total: 0,
          confirmed: 0,
          pending: 0,
          notRenewed: 0,
          unknown: 0,
          providerIds: new Set(),
        })
      }
      const entry = countyMap.get(key)!
      entry.total++
      if (s.cycleStatus === "CONFIRMED") entry.confirmed++
      else if (s.cycleStatus === "PENDING_CONFIRMATION") entry.pending++
      else if (s.cycleStatus === "NOT_RENEWED") entry.notRenewed++
      else entry.unknown++
      if (s.providerId) entry.providerIds.add(s.providerId)
    }

    const counties = Array.from(countyMap.values())
      .map((c) => ({
        county: c.county,
        total: c.total,
        confirmed: c.confirmed,
        pending: c.pending,
        notRenewed: c.notRenewed,
        unknown: c.unknown,
        providers: c.providerIds.size,
        confirmationRate: c.total > 0 ? Math.round((c.confirmed / c.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)

    const totals = {
      counties: counties.length,
      totalScholarships: scholarships.length,
      totalProviders: new Set(scholarships.map((s) => s.providerId).filter(Boolean)).size,
      totalConfirmed: counties.reduce((sum, c) => sum + c.confirmed, 0),
      totalPending: counties.reduce((sum, c) => sum + c.pending, 0),
    }

    return NextResponse.json({ counties, totals })
  } catch (error) {
    console.error("Error fetching coverage:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
