import { NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"

export const GET = withAuth(async (session) => {
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
})
