import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = (session.user as { role: string }).role

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
  } catch (error) {
    console.error("Onboarding status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
