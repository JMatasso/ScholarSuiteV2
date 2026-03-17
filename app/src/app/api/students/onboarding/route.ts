import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { StudentStatus } from "@/generated/prisma/client";
import { autoMatchStudentToLocalScholarships } from "@/lib/local-scholarship-matcher";
import { determineCounty } from "@/lib/county-lookup";

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
      county: data.county || determineCounty({ zipCode: data.zipCode, city: data.city, state: data.state }) || null,
      state: data.state || null,
      zipCode: data.zipCode || null,
      gpa: data.gpa ? parseFloat(data.gpa) : null,
      gpaType: data.gpaType || null,
      classRank: data.classRank || null,
      classSize: data.classSize || null,
      gradeLevel: data.gradeLevel ? parseInt(data.gradeLevel) : null,
      highSchool: data.highSchool || null,
      graduationYear: data.graduationYear ? parseInt(data.graduationYear) : null,
      satScore: data.satScore ? parseInt(data.satScore) : null,
      actScore: data.actScore ? parseInt(data.actScore) : null,
      intendedMajor: data.intendedMajor || null,
      major2: data.major2 || null,
      major3: data.major3 || null,
      gender: data.gender || null,
      ethnicity: data.ethnicity || null,
      citizenship: data.citizenship || null,
      isFirstGen: data.isFirstGen ?? false,
      hasFinancialNeed: data.hasFinancialNeed ?? false,
      militaryAffiliation: data.militaryAffiliation || null,
      disabilityStatus: data.disabilityStatus || null,
      medicalConditions: data.medicalConditions || null,
      parentsDivorced: data.parentsDivorced ?? false,
      isDependentStudent: data.isDependentStudent ?? true,
      householdIncome: data.householdIncome || null,
      financialSituation: data.financialSituation || null,
      parent1Education: data.parent1Education || null,
      parent1Profession: data.parent1Profession || null,
      parent1College: data.parent1College || null,
      parent2Education: data.parent2Education || null,
      parent2Profession: data.parent2Profession || null,
      parent2College: data.parent2College || null,
      interestedInLgbtScholarships: data.interestedInLgbtScholarships ?? false,
      // Auto-determine Pell eligibility from household income
      isPellEligible: data.isPellEligible ?? autoPellEligible(data.householdIncome),
      journeyStage: data.journeyStage || "EARLY_EXPLORATION",
      postSecondaryPath: data.postSecondaryPath || "COLLEGE",
      collegeJourneyStage: data.collegeJourneyStage || null,
      committedCollegeName: data.committedCollegeName || null,
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

    // Link to school if schoolId provided
    if (data.schoolId) {
      await db.user.update({
        where: { id: session.user.id },
        data: { schoolId: data.schoolId },
      })
    }

    // Update the user's display name if provided
    if (data.firstName || data.lastName) {
      const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ");
      if (fullName) {
        await db.user.update({
          where: { id: session.user.id },
          data: { name: fullName, ...(data.schoolId ? { schoolId: data.schoolId } : {}) },
        });
      }
    }

    // Auto-create CollegeApplication when student has decided on a college
    if (data.collegeJourneyStage === "DECIDED" && data.committedCollegeName) {
      // Check if an application for this college already exists
      const existing = await db.collegeApplication.findFirst({
        where: {
          userId: session.user.id,
          universityName: data.committedCollegeName,
        },
      });

      if (!existing) {
        await db.collegeApplication.create({
          data: {
            userId: session.user.id,
            universityName: data.committedCollegeName,
            status: "ACCEPTED",
            committed: true,
          },
        });
      } else {
        // Update existing application to mark as committed
        await db.collegeApplication.update({
          where: { id: existing.id },
          data: {
            status: "ACCEPTED",
            committed: true,
          },
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

/**
 * Auto-determine Pell Grant eligibility from household income.
 * Pell Grants are generally available to families earning under ~$60K.
 * Partial eligibility up to ~$75K depending on family size.
 */
function autoPellEligible(income: string | null | undefined): boolean {
  if (!income) return false
  const pellBrackets = ["Under $30,000", "$30,000 - $48,000", "$48,000 - $75,000"]
  return pellBrackets.includes(income)
}
