import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { autoMatchLocalScholarship } from "@/lib/local-scholarship-matcher"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { scholarshipId, cycleYear } = data

    if (!scholarshipId) {
      return NextResponse.json({ error: "scholarshipId is required" }, { status: 400 })
    }

    const scholarship = await db.scholarship.findUnique({
      where: { id: scholarshipId },
    })

    if (!scholarship || scholarship.source !== "LOCAL") {
      return NextResponse.json({ error: "Local scholarship not found" }, { status: 404 })
    }

    // Save previous deadline to history
    const prevHistory = (scholarship.previousDeadlines as unknown as Array<Record<string, unknown>>) || []
    if (scholarship.deadline && scholarship.cycleYear) {
      prevHistory.push({
        year: scholarship.cycleYear,
        deadline: scholarship.deadline.toISOString(),
        amount: scholarship.amount,
      })
    }

    // Update scholarship as confirmed
    const updated = await db.scholarship.update({
      where: { id: scholarshipId },
      data: {
        cycleStatus: "CONFIRMED",
        cycleYear: cycleYear || getCurrentCycleYear(),
        confirmedAt: new Date(),
        confirmedBy: session.user.id,
        isActive: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        previousDeadlines: prevHistory as any,
      },
    })

    // Auto-match to eligible students (fire-and-forget)
    if (updated.autoMatch) {
      autoMatchLocalScholarship(updated.id).catch((e) =>
        console.error("Auto-match failed:", e)
      )
    }

    // Fulfill notify-me subscriptions
    const notifyRequests = await db.scholarshipNotifyRequest.findMany({
      where: { scholarshipId },
    })

    if (notifyRequests.length > 0) {
      await db.notification.createMany({
        data: notifyRequests.map((nr) => ({
          userId: nr.userId,
          title: "Local Scholarship Confirmed",
          message: `"${updated.name}" has been confirmed for ${updated.cycleYear}. Check your applications!`,
          type: "LOCAL_SCHOLARSHIP_CONFIRMED",
          link: `/student/scholarships/${updated.id}`,
        })),
      })

      // Auto-add to applications for notified students
      for (const nr of notifyRequests) {
        const existing = await db.scholarshipApplication.findFirst({
          where: { userId: nr.userId, scholarshipId },
        })
        if (!existing) {
          await db.scholarshipApplication.create({
            data: {
              userId: nr.userId,
              scholarshipId,
              progress: "NOT_STARTED",
              status: "PENDING",
            },
          }).catch(() => {}) // Ignore duplicates
        }
      }

      // Clean up notify requests
      await db.scholarshipNotifyRequest.deleteMany({
        where: { scholarshipId },
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error confirming scholarship:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function getCurrentCycleYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  // Academic year: Aug-Jul. Before August = previous year's cycle
  const startYear = now.getMonth() >= 7 ? year : year - 1
  return `${startYear}-${startYear + 1}`
}
