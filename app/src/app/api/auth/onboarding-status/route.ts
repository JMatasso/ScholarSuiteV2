import { NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"

export const GET = withAuth(async (session) => {
  const role = session.user.role

  if (role === "STUDENT") {
    const profile = await db.studentProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        personalComplete: true,
        academicComplete: true,
        backgroundComplete: true,
        financialComplete: true,
        activitiesComplete: true,
        goalsComplete: true,
        tourComplete: true,
        firstName: true,
      },
    })

    const needsOnboarding = !profile || (!profile.personalComplete && !profile.firstName)
    const completionFlags = profile ? {
      personal: profile.personalComplete,
      academic: profile.academicComplete,
      background: profile.backgroundComplete,
      financial: profile.financialComplete,
      activities: profile.activitiesComplete,
      goals: profile.goalsComplete,
      tour: profile.tourComplete,
    } : null

    const flags = completionFlags ? Object.values(completionFlags) : []
    const completionPercentage = flags.length ? Math.round(flags.filter(Boolean).length / flags.length * 100) : 0

    return NextResponse.json({ needsOnboarding, role, completionFlags, completionPercentage })
  }

  if (role === "PARENT") {
    const profile = await db.parentProfile.findUnique({
      where: { userId: session.user.id },
      select: { phone: true, relationship: true, tourComplete: true },
    })

    const needsOnboarding = !profile || (!profile.phone && !profile.relationship)
    const completionFlags = profile ? {
      contact: !!(profile.phone && profile.relationship),
      tour: profile.tourComplete,
    } : null
    const completionPercentage = completionFlags ? Math.round(Object.values(completionFlags).filter(Boolean).length / Object.values(completionFlags).length * 100) : 0

    return NextResponse.json({ needsOnboarding, role, completionFlags, completionPercentage })
  }

  // Admins don't require onboarding
  return NextResponse.json({ needsOnboarding: false, role })
})
