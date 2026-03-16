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
        firstName: true,
      },
    })

    // Consider onboarding needed if no profile or key fields are empty
    const needsOnboarding = !profile || (!profile.personalComplete && !profile.firstName)
    return NextResponse.json({ needsOnboarding, role })
  }

  if (role === "PARENT") {
    const profile = await db.parentProfile.findUnique({
      where: { userId: session.user.id },
      select: { phone: true, relationship: true },
    })

    const needsOnboarding = !profile || (!profile.phone && !profile.relationship)
    return NextResponse.json({ needsOnboarding, role })
  }

  // Admins don't require onboarding
  return NextResponse.json({ needsOnboarding: false, role })
})
