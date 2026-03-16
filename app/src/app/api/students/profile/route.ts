import { NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"

export const GET = withAuth(async (session) => {
  const profile = await db.studentProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  return NextResponse.json({
    firstName: profile.firstName || "",
    lastName: profile.lastName || "",
    dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString().split("T")[0] : "",
    phone: profile.phone || "",
    address: profile.address || "",
    city: profile.city || "",
    state: profile.state || "",
    zipCode: profile.zipCode || "",
    gpa: profile.gpa?.toString() || "",
    gradeLevel: profile.gradeLevel?.toString() || "",
    highSchool: profile.highSchool || "",
    graduationYear: profile.graduationYear?.toString() || "",
    satScore: profile.satScore?.toString() || "",
    actScore: profile.actScore?.toString() || "",
    intendedMajor: profile.intendedMajor || "",
    ethnicity: profile.ethnicity || "",
    citizenship: profile.citizenship || "",
    isFirstGen: profile.isFirstGen || false,
    isPellEligible: profile.isPellEligible || false,
    hasFinancialNeed: profile.hasFinancialNeed || false,
    journeyStage: profile.journeyStage || "EARLY_EXPLORATION",
    postSecondaryPath: profile.postSecondaryPath || "COLLEGE",
    activities: profile.activities || "",
    communityService: profile.communityService || "",
    leadershipRoles: profile.leadershipRoles || "",
    awards: profile.awards || "",
    dreamSchools: profile.dreamSchools || "",
    goals: profile.goals || "",
    tourComplete: profile.tourComplete || false,
    personalComplete: profile.personalComplete || false,
    academicComplete: profile.academicComplete || false,
    backgroundComplete: profile.backgroundComplete || false,
    financialComplete: profile.financialComplete || false,
    activitiesComplete: profile.activitiesComplete || false,
    goalsComplete: profile.goalsComplete || false,
  })
})
