import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await db.studentProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        personalComplete: true,
        academicComplete: true,
        backgroundComplete: true,
        financialComplete: true,
        activitiesComplete: true,
        goalsComplete: true,
        firstName: true,
        lastName: true,
        gpa: true,
        highSchool: true,
        ethnicity: true,
        citizenship: true,
      },
    })

    if (!profile) {
      return NextResponse.json({ percentage: 0 })
    }

    // Calculate completion based on flags or field presence
    const sections = [
      profile.personalComplete || !!(profile.firstName && profile.lastName),
      profile.academicComplete || !!(profile.gpa && profile.highSchool),
      profile.backgroundComplete || !!(profile.ethnicity || profile.citizenship),
      profile.financialComplete || false,
      profile.activitiesComplete || false,
      profile.goalsComplete || false,
    ]

    const completed = sections.filter(Boolean).length
    const percentage = Math.round((completed / sections.length) * 100)

    return NextResponse.json({ percentage, completed, total: sections.length })
  } catch (error) {
    console.error("Profile completion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
