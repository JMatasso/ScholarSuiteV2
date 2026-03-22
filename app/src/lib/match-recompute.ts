/**
 * Targeted match recomputation.
 *
 * After a scholarship refresh detects changes (especially deadline updates),
 * recompute matches ONLY for the changed scholarships against ALL students,
 * and create notifications for students who become newly eligible.
 */

import { db } from "@/lib/db"
import { computeMatchScore } from "@/lib/scholarship-matcher"
import { runAIScoring } from "@/lib/ai-match-scorer"
import { isAIMatchingEnabled } from "@/lib/feature-flags"

interface RecomputeResult {
  scholarshipId: string
  studentsMatched: number
  newlyEligible: number
  notificationsCreated: number
}

/**
 * Recompute matches for specific scholarships against all student profiles.
 * Creates notifications when a student becomes newly eligible
 * (was previously excluded or had no match, now has score > 0).
 */
export async function recomputeMatchesForScholarships(
  scholarshipIds: string[]
): Promise<RecomputeResult[]> {
  if (scholarshipIds.length === 0) return []

  // Fetch the updated scholarships
  const scholarships = await db.scholarship.findMany({
    where: { id: { in: scholarshipIds }, isActive: true },
  })

  // Fetch all student profiles
  const students = await db.studentProfile.findMany({
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
      isFirstGen: true,
      isPellEligible: true,
      hasFinancialNeed: true,
    },
  })

  if (students.length === 0) return []

  // Fetch existing matches for these scholarships to detect newly-eligible
  const existingMatches = await db.scholarshipMatch.findMany({
    where: { scholarshipId: { in: scholarshipIds } },
    select: { scholarshipId: true, studentId: true, score: true, isExcluded: true },
  })

  // Build lookup: scholarshipId:studentId → { score, isExcluded }
  const existingLookup = new Map<string, { score: number; isExcluded: boolean }>()
  for (const m of existingMatches) {
    existingLookup.set(`${m.scholarshipId}:${m.studentId}`, {
      score: m.score,
      isExcluded: m.isExcluded,
    })
  }

  const results: RecomputeResult[] = []

  for (const scholarship of scholarships) {
    let studentsMatched = 0
    let newlyEligible = 0
    const notifications: Array<{
      userId: string
      title: string
      message: string
      type: string
      link: string
    }> = []

    for (const student of students) {
      const match = computeMatchScore(scholarship, student)
      const key = `${scholarship.id}:${student.userId}`
      const prev = existingLookup.get(key)

      // Upsert the match
      await db.scholarshipMatch.upsert({
        where: {
          scholarshipId_studentId: {
            scholarshipId: scholarship.id,
            studentId: student.userId,
          },
        },
        update: {
          score: match.score,
          reasons: match.reasons,
          isExcluded: match.isExcluded,
        },
        create: {
          scholarshipId: scholarship.id,
          studentId: student.userId,
          score: match.score,
          reasons: match.reasons,
          isExcluded: match.isExcluded,
        },
      }).catch(() => {}) // Ignore race conditions

      if (!match.isExcluded && match.score > 0) {
        studentsMatched++

        // Check if this student is NEWLY eligible
        const wasExcludedOrAbsent = !prev || prev.isExcluded || prev.score === 0
        if (wasExcludedOrAbsent && match.score >= 60) {
          newlyEligible++
          const amount = scholarship.amount
            ? `$${scholarship.amount.toLocaleString()}`
            : "Award"
          notifications.push({
            userId: student.userId,
            title: "New scholarship match!",
            message: `${scholarship.name} (${amount}) is now available and matches your profile.`,
            type: "scholarship_match",
            link: "/student/scholarships",
          })
        }
      }
    }

    // Batch create notifications
    if (notifications.length > 0) {
      await db.notification.createMany({ data: notifications })
    }

    results.push({
      scholarshipId: scholarship.id,
      studentsMatched,
      newlyEligible,
      notificationsCreated: notifications.length,
    })
  }

  // Stage 2: Trigger AI scoring for students who have matches with changed scholarships
  // Gated by admin feature flag — defaults to OFF
  const aiEnabled = process.env.ANTHROPIC_API_KEY && scholarshipIds.length > 0
    ? await isAIMatchingEnabled()
    : false

  if (aiEnabled) {
    // Get unique students who matched, and kick off AI scoring in background
    const affectedStudents = new Set<string>()
    for (const student of students) {
      affectedStudents.add(student.userId)
    }

    for (const studentId of affectedStudents) {
      // Fetch this student's top matches for the changed scholarships
      const studentMatches = await db.scholarshipMatch.findMany({
        where: {
          studentId,
          scholarshipId: { in: scholarshipIds },
          isExcluded: false,
          score: { gt: 0 },
        },
        include: { scholarship: { include: { tags: true } } },
        orderBy: { score: "desc" },
        take: 50,
      })

      if (studentMatches.length > 0) {
        runAIScoring(
          studentId,
          studentMatches.map((m) => ({
            scholarshipId: m.scholarshipId,
            ruleScore: m.score,
            scholarship: m.scholarship,
          })),
          50
        ).catch((err) => console.error(`AI scoring failed for student ${studentId}:`, err))
      }
    }
  }

  return results
}

/**
 * Quick check: recompute matches for a single scholarship.
 * Used after admin approves a refresh change.
 */
export async function recomputeMatchesForOne(scholarshipId: string) {
  const results = await recomputeMatchesForScholarships([scholarshipId])
  return results[0] || null
}
