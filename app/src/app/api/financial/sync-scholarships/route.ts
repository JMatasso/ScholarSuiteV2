import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

/**
 * POST /api/financial/sync-scholarships
 * Syncs awarded scholarships into the financial plan as income sources.
 * Body: { allocations: Array<{ scholarshipAppId, scholarshipName, semesterAllocations: Array<{ semesterId, amount }> }> }
 */
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const { allocations } = await req.json()

    if (!Array.isArray(allocations)) {
      return NextResponse.json({ error: "allocations array required" }, { status: 400 })
    }

    // Get the user's financial plan
    const plan = await db.financialPlan.findFirst({
      where: { userId },
      include: {
        semesters: {
          include: { incomeSources: true, customExpenses: true },
          orderBy: { order: "asc" },
        },
      },
    })

    if (!plan) {
      return NextResponse.json({ error: "No financial plan found. Create a budget first." }, { status: 404 })
    }

    const planSemesterIds = new Set(plan.semesters.map((s) => s.id))

    // Process each scholarship allocation
    for (const alloc of allocations) {
      const { scholarshipName, semesterAllocations } = alloc as {
        scholarshipName: string
        semesterAllocations: Array<{ semesterId: string; amount: number }>
      }

      if (!scholarshipName || !Array.isArray(semesterAllocations)) continue

      // Remove existing income sources with this scholarship name (to avoid duplicates)
      for (const sem of plan.semesters) {
        const existing = sem.incomeSources.filter((s) => s.name === scholarshipName)
        for (const src of existing) {
          await db.incomeSource.delete({ where: { id: src.id } })
        }
      }

      // Create new income sources for each allocated semester
      for (const sa of semesterAllocations) {
        if (!planSemesterIds.has(sa.semesterId) || sa.amount <= 0) continue

        await db.incomeSource.create({
          data: {
            semesterId: sa.semesterId,
            name: scholarshipName,
            type: "Scholarship",
            amount: sa.amount,
            status: "CONFIRMED",
            isRecurring: semesterAllocations.length > 1,
          },
        })
      }
    }

    // Return updated plan
    const updatedPlan = await db.financialPlan.findFirst({
      where: { userId },
      include: {
        semesters: {
          include: { incomeSources: true, customExpenses: true },
          orderBy: { order: "asc" },
        },
      },
    })

    return NextResponse.json(updatedPlan)
  } catch (error) {
    console.error("Error syncing scholarships:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
