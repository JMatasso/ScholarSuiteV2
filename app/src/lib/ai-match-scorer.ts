/**
 * AI-enhanced scholarship matching (Stage 2).
 *
 * Takes pre-filtered matches from the rule engine (Stage 1) and enriches them
 * with semantic AI scoring using Claude. Evaluates how well a student's full
 * profile (activities, essays, goals, interests) aligns with each scholarship's
 * description and intent — beyond what structured field matching can capture.
 */

import Anthropic from "@anthropic-ai/sdk"
import { db } from "@/lib/db"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
})

const AI_MATCH_MODEL = process.env.AI_MATCH_MODEL || "claude-haiku-4-5-20241022"
const BATCH_SIZE = 10
const AI_SCORE_CACHE_DAYS = 7

interface ScholarshipForAI {
  id: string
  name: string
  provider: string | null
  amount: number | null
  deadline: Date | null
  description: string | null
  fieldsOfStudy: string[]
  tags?: { name: string }[]
}

interface StudentContext {
  // Basics
  name: string
  gpa: number | null
  gradeLevel: number | null
  intendedMajor: string | null
  major2: string | null
  major3: string | null
  state: string | null
  ethnicity: string | null
  isFirstGen: boolean
  isPellEligible: boolean
  hasFinancialNeed: boolean
  // Rich context
  activitiesText: string | null
  communityService: string | null
  leadershipRoles: string | null
  awards: string | null
  goals: string | null
  // Structured activities
  structuredActivities: {
    title: string
    category: string
    role: string | null
    description: string | null
    hoursPerWeek: number | null
    isLeadership: boolean
  }[]
  // Essay topics
  essayTopics: string[]
}

export interface AIMatchScore {
  scholarshipId: string
  aiScore: number
  aiReason: string
}

/**
 * Build a student context object from the database for AI scoring.
 */
export async function buildStudentContext(userId: string): Promise<StudentContext | null> {
  const profile = await db.studentProfile.findUnique({
    where: { userId },
    include: { user: { select: { name: true } } },
  })

  if (!profile) return null

  // Fetch structured activities (top 15 by hours)
  const activities = await db.activity.findMany({
    where: { userId },
    orderBy: { hoursPerWeek: "desc" },
    take: 15,
    select: {
      title: true,
      category: true,
      role: true,
      description: true,
      hoursPerWeek: true,
      isLeadership: true,
    },
  })

  // Fetch essay titles (not full content — just topics)
  const essays = await db.essay.findMany({
    where: { userId },
    select: { title: true },
    take: 10,
  })

  return {
    name: profile.user.name || "Student",
    gpa: profile.gpa,
    gradeLevel: profile.gradeLevel,
    intendedMajor: profile.intendedMajor,
    major2: profile.major2,
    major3: profile.major3,
    state: profile.state,
    ethnicity: profile.ethnicity,
    isFirstGen: profile.isFirstGen,
    isPellEligible: profile.isPellEligible,
    hasFinancialNeed: profile.hasFinancialNeed,
    activitiesText: profile.activities,
    communityService: profile.communityService,
    leadershipRoles: profile.leadershipRoles,
    awards: profile.awards,
    goals: profile.goals,
    structuredActivities: activities.map((a) => ({
      title: a.title,
      category: a.category,
      role: a.role,
      description: a.description,
      hoursPerWeek: a.hoursPerWeek,
      isLeadership: a.isLeadership,
    })),
    essayTopics: essays.map((e) => e.title).filter(Boolean),
  }
}

/**
 * Format the student profile into a concise text block for the AI prompt.
 */
function formatStudentProfile(ctx: StudentContext): string {
  const lines: string[] = []

  if (ctx.gpa) lines.push(`GPA: ${ctx.gpa}`)
  if (ctx.gradeLevel) lines.push(`Grade: ${ctx.gradeLevel}`)
  const majors = [ctx.intendedMajor, ctx.major2, ctx.major3].filter(Boolean)
  if (majors.length > 0) lines.push(`Major(s): ${majors.join(", ")}`)
  if (ctx.state) lines.push(`State: ${ctx.state}`)
  if (ctx.isFirstGen) lines.push(`First-generation college student`)
  if (ctx.isPellEligible) lines.push(`Pell Grant eligible`)
  if (ctx.hasFinancialNeed) lines.push(`Demonstrated financial need`)
  if (ctx.ethnicity) lines.push(`Background: ${ctx.ethnicity}`)

  // Structured activities
  if (ctx.structuredActivities.length > 0) {
    lines.push(`\nActivities:`)
    for (const a of ctx.structuredActivities) {
      const parts = [a.title]
      if (a.role) parts.push(`(${a.role})`)
      if (a.hoursPerWeek) parts.push(`— ${a.hoursPerWeek}hr/wk`)
      if (a.isLeadership) parts.push("[Leadership]")
      lines.push(`  - ${parts.join(" ")}`)
      if (a.description) lines.push(`    ${a.description.slice(0, 120)}`)
    }
  } else if (ctx.activitiesText) {
    lines.push(`\nActivities: ${ctx.activitiesText.slice(0, 300)}`)
  }

  if (ctx.communityService) lines.push(`\nCommunity Service: ${ctx.communityService.slice(0, 200)}`)
  if (ctx.leadershipRoles) lines.push(`\nLeadership: ${ctx.leadershipRoles.slice(0, 200)}`)
  if (ctx.awards) lines.push(`\nAwards: ${ctx.awards.slice(0, 200)}`)
  if (ctx.goals) lines.push(`\nGoals: ${ctx.goals.slice(0, 200)}`)
  if (ctx.essayTopics.length > 0) lines.push(`\nEssay Topics: ${ctx.essayTopics.join(", ")}`)

  return lines.join("\n")
}

/**
 * Format a batch of scholarships for the AI prompt.
 */
function formatScholarshipBatch(scholarships: ScholarshipForAI[]): string {
  return scholarships
    .map((s, i) => {
      const parts = [`[${i + 1}] "${s.name}"`]
      if (s.provider) parts.push(`by ${s.provider}`)
      if (s.amount) parts.push(`| $${s.amount.toLocaleString()}`)
      if (s.deadline) parts.push(`| Deadline: ${s.deadline.toISOString().split("T")[0]}`)
      if (s.fieldsOfStudy.length > 0) parts.push(`| Fields: ${s.fieldsOfStudy.join(", ")}`)
      if (s.tags && s.tags.length > 0) parts.push(`| Tags: ${s.tags.map((t) => t.name).join(", ")}`)
      const header = parts.join(" ")
      const desc = s.description ? `\n   ${s.description.slice(0, 400)}` : ""
      return header + desc
    })
    .join("\n\n")
}

const SCORING_SYSTEM_PROMPT = `You are a scholarship matching evaluator. Given a student profile and a batch of scholarships, evaluate how well the student fits each scholarship on a 0-100 scale.

Scoring guide:
- 90-100: Exceptional fit — student's profile, activities, and interests strongly align with the scholarship's purpose and criteria
- 70-89: Good fit — clear alignment in multiple areas (major, activities, background, or goals)
- 50-69: Moderate fit — some alignment but not a standout candidate for this specific scholarship
- 30-49: Weak fit — minimal alignment beyond basic eligibility
- 0-29: Poor fit — student does not align with the scholarship's intent despite being technically eligible

Consider:
1. How well the student's activities and interests match the scholarship's purpose
2. Whether the student's goals align with what the scholarship aims to support
3. Strength of the student's profile relative to likely competition
4. Any unique qualities that make this student stand out for this specific scholarship

Return ONLY a valid JSON array with one object per scholarship in order:
[{"id": 1, "score": 75, "reason": "One concise sentence explaining the match"}, ...]

Do NOT include any text outside the JSON array.`

/**
 * Score a batch of scholarships against a student using Claude AI.
 */
async function scoreBatch(
  scholarships: ScholarshipForAI[],
  studentProfile: string
): Promise<AIMatchScore[]> {
  const scholarshipText = formatScholarshipBatch(scholarships)

  const response = await client.messages.create({
    model: AI_MATCH_MODEL,
    max_tokens: 1024,
    system: SCORING_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `STUDENT PROFILE:\n${studentProfile}\n\nSCHOLARSHIPS TO EVALUATE:\n${scholarshipText}`,
      },
    ],
  })

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")

  // Parse JSON array from response
  let scores: { id: number; score: number; reason: string }[]
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    scores = jsonMatch ? JSON.parse(jsonMatch[0]) : []
  } catch {
    console.error("Failed to parse AI match scores:", text.slice(0, 200))
    return []
  }

  // Map back to scholarship IDs
  return scores
    .filter((s) => s.id >= 1 && s.id <= scholarships.length)
    .map((s) => ({
      scholarshipId: scholarships[s.id - 1].id,
      aiScore: Math.max(0, Math.min(100, s.score)),
      aiReason: s.reason || "",
    }))
}

/**
 * Run AI scoring on a set of pre-filtered scholarship matches.
 *
 * @param matches - Scholarships that passed Stage 1 (rule engine), sorted by rule score desc
 * @param userId - The student's user ID
 * @param limit - Max scholarships to AI-score (default 50)
 * @returns Array of AI scores, one per scholarship
 */
export async function aiScoreMatches(
  matches: ScholarshipForAI[],
  userId: string,
  limit = 50
): Promise<AIMatchScore[]> {
  const ctx = await buildStudentContext(userId)
  if (!ctx) return []

  // Check which matches already have fresh AI scores
  const scholarshipIds = matches.slice(0, limit).map((m) => m.id)
  const existingScores = await db.scholarshipMatch.findMany({
    where: {
      studentId: userId,
      scholarshipId: { in: scholarshipIds },
      aiScore: { not: null },
      aiScoredAt: {
        gte: new Date(Date.now() - AI_SCORE_CACHE_DAYS * 24 * 60 * 60 * 1000),
      },
    },
    select: { scholarshipId: true, aiScore: true, aiReason: true },
  })

  const cachedIds = new Set(existingScores.map((s) => s.scholarshipId))
  const cachedResults: AIMatchScore[] = existingScores.map((s) => ({
    scholarshipId: s.scholarshipId,
    aiScore: s.aiScore!,
    aiReason: s.aiReason || "",
  }))

  // Filter to only scholarships that need scoring
  const toScore = matches.slice(0, limit).filter((m) => !cachedIds.has(m.id))

  if (toScore.length === 0) return cachedResults

  const studentProfile = formatStudentProfile(ctx)

  // Process in batches of BATCH_SIZE, run batches in parallel
  const batches: ScholarshipForAI[][] = []
  for (let i = 0; i < toScore.length; i += BATCH_SIZE) {
    batches.push(toScore.slice(i, i + BATCH_SIZE))
  }

  const batchResults = await Promise.allSettled(
    batches.map((batch) => scoreBatch(batch, studentProfile))
  )

  const newResults: AIMatchScore[] = []
  for (const result of batchResults) {
    if (result.status === "fulfilled") {
      newResults.push(...result.value)
    }
  }

  // Persist AI scores to database
  const now = new Date()
  await Promise.allSettled(
    newResults.map((r) =>
      db.scholarshipMatch.updateMany({
        where: {
          scholarshipId: r.scholarshipId,
          studentId: userId,
        },
        data: {
          aiScore: r.aiScore,
          aiReason: r.aiReason,
          combinedScore: null, // Will be computed below
          aiScoredAt: now,
        },
      })
    )
  )

  return [...cachedResults, ...newResults]
}

/**
 * Compute the combined score from rule score and AI score.
 * Rule score handles eligibility, AI score handles fit quality.
 */
export function computeCombinedScore(ruleScore: number, aiScore: number): number {
  return Math.round(ruleScore * 0.4 + aiScore * 0.6)
}

/**
 * Full pipeline: run AI scoring on a student's top matches and update combined scores.
 * Call this after Stage 1 (rule engine) has completed.
 */
export async function runAIScoring(
  userId: string,
  topMatches: { scholarshipId: string; ruleScore: number; scholarship: ScholarshipForAI }[],
  limit = 50
): Promise<void> {
  const scholarships = topMatches.slice(0, limit).map((m) => m.scholarship)

  const aiScores = await aiScoreMatches(scholarships, userId, limit)

  // Build lookup: scholarshipId → aiScore
  const aiLookup = new Map(aiScores.map((s) => [s.scholarshipId, s]))

  // Update combined scores in database
  await Promise.allSettled(
    topMatches.slice(0, limit).map((m) => {
      const ai = aiLookup.get(m.scholarshipId)
      const combinedScore = ai
        ? computeCombinedScore(m.ruleScore, ai.aiScore)
        : m.ruleScore // Fall back to rule score if AI scoring failed

      return db.scholarshipMatch.updateMany({
        where: {
          scholarshipId: m.scholarshipId,
          studentId: userId,
        },
        data: { combinedScore },
      })
    })
  )
}
