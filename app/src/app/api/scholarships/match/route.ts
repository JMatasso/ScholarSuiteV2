import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"
import { computeMatchScore, getMissingFields } from "@/lib/scholarship-matcher"
import { runAIScoring } from "@/lib/ai-match-scorer"
import { isAIMatchingEnabled } from "@/lib/feature-flags"

/**
 * POST /api/scholarships/match
 * Recompute scholarship matches for the current student.
 * Stage 1: rule engine, Stage 2: AI semantic scoring (top 50).
 */
export const POST = withAuth(async (session, request: NextRequest) => {
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Students only" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const includeAi = searchParams.get("includeAi") !== "false" // default true

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

  // Fetch active scholarships with future deadlines (or rolling/no deadline + enriched)
  const now = new Date()
  const scholarships = await db.scholarship.findMany({
    where: {
      isActive: true,
      OR: [
        { deadline: { gte: now } },
        { deadline: null, scrapeStatus: "CURRENT" },
      ],
    },
    include: { tags: true },
  })

  // Stage 1: Rule engine scoring
  const allScored = scholarships.map((s) => ({
    ...computeMatchScore(s, profile),
    scholarship: s,
  }))

  const results = allScored
    .filter((r) => !r.isExcluded && r.score > 0)
    .sort((a, b) => b.score - a.score)

  // Upsert matches into database
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
  const excludedIds = allScored
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

  // Stage 2: AI semantic scoring (non-blocking — runs after rule results are saved)
  // Gated by admin feature flag — defaults to OFF
  let aiScoringStarted = false
  const aiEnabled = includeAi && results.length > 0 && process.env.ANTHROPIC_API_KEY
    ? await isAIMatchingEnabled()
    : false

  if (aiEnabled) {
    aiScoringStarted = true
    // Run AI scoring in the background — don't block the response
    runAIScoring(
      session.user.id,
      results.map((r) => ({
        scholarshipId: r.scholarshipId,
        ruleScore: r.score,
        scholarship: r.scholarship,
      })),
      50
    ).catch((err) => console.error("AI scoring failed:", err))
  }

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
    aiScoringStarted,
  })
})

/**
 * GET /api/scholarships/match
 * Fetch pre-computed matches for the current student.
 * Returns combined scores (AI + rule) when available, falls back to rule score.
 */
export const GET = withAuth(async (session, request: NextRequest) => {
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Students only" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const minScore = parseFloat(searchParams.get("minScore") || "0")
  const minAmount = parseFloat(searchParams.get("minAmount") || "0")
  const maxAmount = parseFloat(searchParams.get("maxAmount") || "999999999")

  const now = new Date()
  const matches = await db.scholarshipMatch.findMany({
    where: {
      studentId: session.user.id,
      isExcluded: false,
      score: { gte: minScore },
      scholarship: {
        isActive: true,
        OR: [
          { deadline: { gte: now } },
          { deadline: null, scrapeStatus: "CURRENT" },
        ],
        ...(minAmount > 0 ? { amount: { gte: minAmount } } : {}),
        ...(maxAmount < 999999999 ? { amount: { lte: maxAmount } } : {}),
      },
    },
    include: {
      scholarship: {
        include: { tags: true },
      },
    },
    orderBy: [
      { combinedScore: { sort: "desc", nulls: "last" } },
      { score: "desc" },
    ],
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
      aiScore: m.aiScore,
      aiReason: m.aiReason,
      combinedScore: m.combinedScore,
      reasons: m.reasons,
      scholarship: m.scholarship,
    })),
    profileIncomplete: missingFields.length > 3,
    missingFields,
  })
})
