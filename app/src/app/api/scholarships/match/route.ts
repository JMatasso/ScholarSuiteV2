import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"
import { computeMatchScore, getMissingFields } from "@/lib/scholarship-matcher"

/**
 * POST /api/scholarships/match
 * Recompute scholarship matches for the current student.
 */
export const POST = withAuth(async (session) => {
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Students only" }, { status: 403 })
  }

  const profile = await db.studentProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!profile) {
    return NextResponse.json({
      matches: [],
      profileIncomplete: true,
      missingFields: ["Complete your profile to get matched"],
      total: 0,
    })
  }

  const missingFields = getMissingFields(profile)
  const profileIncomplete = missingFields.length > 3

  // Fetch all active scholarships
  const scholarships = await db.scholarship.findMany({
    where: { isActive: true },
    include: { tags: true },
  })

  // Compute matches
  const results = scholarships
    .map((s) => ({
      ...computeMatchScore(s, profile),
      scholarship: s,
    }))
    .filter((r) => !r.isExcluded && r.score > 0)
    .sort((a, b) => b.score - a.score)

  // Upsert matches into database (fire-and-forget style, don't block response)
  const upsertPromises = results.map((r) =>
    db.scholarshipMatch
      .upsert({
        where: {
          scholarshipId_studentId: {
            scholarshipId: r.scholarshipId,
            studentId: session.user.id,
          },
        },
        update: {
          score: r.score,
          reasons: r.reasons,
          isExcluded: false,
        },
        create: {
          scholarshipId: r.scholarshipId,
          studentId: session.user.id,
          score: r.score,
          reasons: r.reasons,
          isExcluded: false,
        },
      })
      .catch((e) => console.error("Match upsert failed:", e))
  )

  // Also mark excluded scholarships
  const excludedIds = scholarships
    .map((s) => computeMatchScore(s, profile))
    .filter((r) => r.isExcluded)
    .map((r) => r.scholarshipId)

  if (excludedIds.length > 0) {
    upsertPromises.push(
      ...excludedIds.map((sid) =>
        db.scholarshipMatch
          .upsert({
            where: {
              scholarshipId_studentId: {
                scholarshipId: sid,
                studentId: session.user.id,
              },
            },
            update: { score: 0, isExcluded: true },
            create: {
              scholarshipId: sid,
              studentId: session.user.id,
              score: 0,
              reasons: [],
              isExcluded: true,
            },
          })
          .catch(() => {})
      )
    )
  }

  await Promise.all(upsertPromises)

  return NextResponse.json({
    matches: results.map((r) => ({
      id: `${r.scholarshipId}-${session.user.id}`,
      scholarshipId: r.scholarshipId,
      score: r.score,
      reasons: r.reasons,
      scholarship: r.scholarship,
    })),
    profileIncomplete,
    missingFields,
    total: scholarships.length,
    matched: results.length,
  })
})

/**
 * GET /api/scholarships/match
 * Fetch pre-computed matches for the current student.
 */
export const GET = withAuth(async (session, request: NextRequest) => {
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Students only" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const minScore = parseFloat(searchParams.get("minScore") || "0")
  const minAmount = parseFloat(searchParams.get("minAmount") || "0")
  const maxAmount = parseFloat(searchParams.get("maxAmount") || "999999999")

  const matches = await db.scholarshipMatch.findMany({
    where: {
      studentId: session.user.id,
      isExcluded: false,
      score: { gte: minScore },
      scholarship: {
        isActive: true,
        ...(minAmount > 0 ? { amount: { gte: minAmount } } : {}),
        ...(maxAmount < 999999999 ? { amount: { lte: maxAmount } } : {}),
      },
    },
    include: {
      scholarship: {
        include: { tags: true },
      },
    },
    orderBy: { score: "desc" },
    take: 100,
  })

  // Also get profile completeness
  const profile = await db.studentProfile.findUnique({
    where: { userId: session.user.id },
  })
  const missingFields = profile ? getMissingFields(profile) : ["Complete your profile"]

  return NextResponse.json({
    matches: matches.map((m) => ({
      id: m.id,
      scholarshipId: m.scholarshipId,
      score: m.score,
      reasons: m.reasons,
      scholarship: m.scholarship,
    })),
    profileIncomplete: missingFields.length > 3,
    missingFields,
  })
})
