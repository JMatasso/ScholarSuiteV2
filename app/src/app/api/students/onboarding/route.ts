import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { StudentStatus } from "@/generated/prisma/client";
import { autoMatchStudentToLocalScholarships } from "@/lib/local-scholarship-matcher";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    const profileData = {
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      phone: data.phone || null,
      address: data.address || null,
      city: data.city || null,
      county: data.county || null,
      state: data.state || null,
      zipCode: data.zipCode || null,
      gpa: data.gpa ? parseFloat(data.gpa) : null,
      gradeLevel: data.gradeLevel ? parseInt(data.gradeLevel) : null,
      highSchool: data.highSchool || null,
      graduationYear: data.graduationYear ? parseInt(data.graduationYear) : null,
      satScore: data.satScore ? parseInt(data.satScore) : null,
      actScore: data.actScore ? parseInt(data.actScore) : null,
      intendedMajor: data.intendedMajor || null,
      ethnicity: data.ethnicity || null,
      citizenship: data.citizenship || null,
      isFirstGen: data.isFirstGen ?? false,
      isPellEligible: data.isPellEligible ?? false,
      hasFinancialNeed: data.hasFinancialNeed ?? false,
      journeyStage: data.journeyStage || "EARLY_EXPLORATION",
      postSecondaryPath: data.postSecondaryPath || "COLLEGE",
      activities: data.activities || null,
      communityService: data.communityService || null,
      leadershipRoles: data.leadershipRoles || null,
      awards: data.awards || null,
      dreamSchools: data.dreamSchools || null,
      goals: data.goals || null,
      tourComplete: data.tourComplete ?? false,
      personalComplete: !!(data.firstName && data.lastName),
      academicComplete: !!(data.highSchool && data.gpa),
      backgroundComplete: !!(data.citizenship),
      financialComplete: !!(data.postSecondaryPath),
      activitiesComplete: !!(data.activities),
      goalsComplete: !!(data.goals),
      status: StudentStatus.ACTIVE,
    };

    const profile = await db.studentProfile.upsert({
      where: { userId: session.user.id },
      update: profileData,
      create: {
        userId: session.user.id,
        ...profileData,
      },
    });

    // Update the user's display name if provided
    if (data.firstName || data.lastName) {
      const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ");
      if (fullName) {
        await db.user.update({
          where: { id: session.user.id },
          data: { name: fullName },
        });
      }
    }

    // Auto-match local scholarships if student has county/state (fire-and-forget)
    if (data.county && data.state) {
      autoMatchStudentToLocalScholarships(session.user.id, data.county, data.state).catch((e) =>
        console.error("Local scholarship auto-match failed:", e)
      )
    }

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error("Error saving onboarding profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
