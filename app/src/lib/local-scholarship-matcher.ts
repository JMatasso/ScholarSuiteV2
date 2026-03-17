/**
 * Auto-match engine for local scholarships.
 * When a local scholarship is confirmed, find eligible students in that county
 * and auto-create applications + notifications.
 */

import { db } from "@/lib/db"
import { computeMatchScore } from "@/lib/scholarship-matcher"

export async function autoMatchLocalScholarship(scholarshipId: string) {
  const scholarship = await db.scholarship.findUnique({
    where: { id: scholarshipId },
  })

  if (!scholarship || scholarship.source !== "LOCAL") return

  // Find students in the same county and state
  const whereClause: Record<string, unknown> = {}
  if (scholarship.county) {
    whereClause.county = { equals: scholarship.county, mode: "insensitive" }
  }
  // Also check by state if no county
  if (!scholarship.county && scholarship.states.length > 0) {
    whereClause.state = { in: scholarship.states, mode: "insensitive" }
  }

  const students = await db.studentProfile.findMany({
    where: whereClause,
    select: {
      userId: true,
      gpa: true,
      gradeLevel: true,
      satScore: true,
      actScore: true,
      intendedMajor: true,
      ethnicity: true,
      citizenship: true,
      state: true,
      county: true,
      isFirstGen: true,
      isPellEligible: true,
      hasFinancialNeed: true,
    },
  })

  let matchCount = 0

  for (const student of students) {
    // Run match scoring
    const result = computeMatchScore(scholarship, {
      gpa: student.gpa,
      gradeLevel: student.gradeLevel,
      satScore: student.satScore,
      actScore: student.actScore,
      intendedMajor: student.intendedMajor,
      ethnicity: student.ethnicity,
      citizenship: student.citizenship,
      state: student.state,
      county: student.county,
      isFirstGen: student.isFirstGen,
      isPellEligible: student.isPellEligible,
      hasFinancialNeed: student.hasFinancialNeed,
    })

    // Low threshold for local scholarships — they're inherently relevant by county
    if (result.isExcluded || result.score < 40) continue

    // Skip if already has an application
    const existing = await db.scholarshipApplication.findFirst({
      where: { userId: student.userId, scholarshipId },
    })
    if (existing) continue

    // Create application
    await db.scholarshipApplication.create({
      data: {
        userId: student.userId,
        scholarshipId,
        status: "NOT_STARTED",
      },
    })

    // Create notification
    await db.notification.create({
      data: {
        userId: student.userId,
        title: "New Local Scholarship Match",
        message: `"${scholarship.name}" in ${scholarship.county || "your area"} has been added to your list.`,
        type: "LOCAL_SCHOLARSHIP_MATCH",
        link: `/student/scholarships/${scholarshipId}`,
      },
    })

    matchCount++
  }

  return matchCount
}

/**
 * Match a single student against all confirmed local scholarships in their county.
 * Called after onboarding when student sets their county.
 */
export async function autoMatchStudentToLocalScholarships(userId: string, county: string, state: string) {
  const student = await db.studentProfile.findUnique({
    where: { userId },
  })
  if (!student) return 0

  const scholarships = await db.scholarship.findMany({
    where: {
      source: "LOCAL",
      cycleStatus: "CONFIRMED",
      isActive: true,
      OR: [
        { county: { equals: county, mode: "insensitive" } },
        ...(state ? [{ states: { has: state } }] : []),
      ],
    },
  })

  let matchCount = 0

  for (const scholarship of scholarships) {
    const result = computeMatchScore(scholarship, {
      gpa: student.gpa,
      gradeLevel: student.gradeLevel,
      satScore: student.satScore,
      actScore: student.actScore,
      intendedMajor: student.intendedMajor,
      ethnicity: student.ethnicity,
      citizenship: student.citizenship,
      state: student.state,
      county: student.county,
      isFirstGen: student.isFirstGen,
      isPellEligible: student.isPellEligible,
      hasFinancialNeed: student.hasFinancialNeed,
    })

    if (result.isExcluded || result.score < 40) continue

    const existing = await db.scholarshipApplication.findFirst({
      where: { userId, scholarshipId: scholarship.id },
    })
    if (existing) continue

    await db.scholarshipApplication.create({
      data: {
        userId,
        scholarshipId: scholarship.id,
        status: "NOT_STARTED",
      },
    })

    await db.notification.create({
      data: {
        userId,
        title: "New Local Scholarship Match",
        message: `"${scholarship.name}" in ${scholarship.county || "your area"} has been added to your list.`,
        type: "LOCAL_SCHOLARSHIP_MATCH",
        link: `/student/scholarships/${scholarship.id}`,
      },
    })

    matchCount++
  }

  return matchCount
}
