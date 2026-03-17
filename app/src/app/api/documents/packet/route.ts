import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

/**
 * GET /api/documents/packet
 * Returns all student data needed for the Application Packet Builder.
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    const [profile, activities, essays] = await Promise.all([
      db.studentProfile.findUnique({
        where: { userId },
      }),
      db.activity.findMany({
        where: { userId },
        orderBy: { startDate: "desc" },
      }),
      db.essay.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      }),
    ])

    // Separate activities by type
    const awards = activities.filter((a) => a.isAward || a.category === "AWARD")
    const leadership = activities.filter((a) => a.isLeadership || a.category === "LEADERSHIP")
    const volunteer = activities.filter((a) => a.category === "VOLUNTEER")
    const athletics = activities.filter((a) => a.category === "ATHLETICS")
    const arts = activities.filter((a) => a.category === "ARTS")
    const work = activities.filter((a) => a.category === "WORK")
    const extracurriculars = activities.filter(
      (a) =>
        !a.isAward &&
        a.category !== "AWARD" &&
        a.category !== "VOLUNTEER" &&
        a.category !== "WORK"
    )

    return NextResponse.json({
      profile,
      activities: {
        all: activities,
        awards,
        leadership,
        volunteer,
        athletics,
        arts,
        work,
        extracurriculars,
      },
      essays: essays.map((e) => ({
        id: e.id,
        title: e.title,
        content: e.content,
        status: e.status,
        updatedAt: e.updatedAt,
      })),
    })
  } catch (error) {
    console.error("Error fetching packet data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
