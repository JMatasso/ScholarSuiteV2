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
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
