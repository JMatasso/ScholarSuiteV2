import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
})

const model = process.env.CHAT_AI_MODEL || "claude-haiku-4-5-20241022"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const essay = await db.essay.findUnique({
      where: { id },
      include: {
        prompt: true,
        versions: { take: 1, orderBy: { version: "desc" } },
        application: { include: { scholarship: { select: { name: true } } } },
      },
    })

    if (!essay) {
      return NextResponse.json({ error: "Essay not found" }, { status: 404 })
    }

    // Get the latest content
    const content = essay.versions[0]?.content || essay.content
    if (!content || content.trim().length < 50) {
      return NextResponse.json(
        { error: "Essay must be at least 50 characters for AI review" },
        { status: 400 }
      )
    }

    // Get student profile for context
    const profile = await db.studentProfile.findUnique({
      where: { userId: essay.userId },
      select: {
        firstName: true,
        lastName: true,
        gpa: true,
        gradeLevel: true,
        intendedMajor: true,
        highSchool: true,
        isFirstGen: true,
        hasFinancialNeed: true,
        activities: true,
        communityService: true,
        leadershipRoles: true,
        awards: true,
        goals: true,
      },
    })

    const scholarshipName = essay.application?.scholarship?.name || null
    const promptText = essay.prompt?.content || null
    const wordLimit = essay.prompt?.wordLimit || null

    const systemPrompt = `You are an expert scholarship and college essay reviewer. You provide detailed, constructive feedback to help students strengthen their essays.

Your review should be encouraging but honest. Students need to know what works AND what to improve.

Return your response as valid JSON with this exact structure:
{
  "overallScore": <number 0-100>,
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "improvements": ["<specific improvement 1>", "<specific improvement 2>", ...],
  "categories": {
    "content": { "score": <0-100>, "feedback": "<1-2 sentences>" },
    "structure": { "score": <0-100>, "feedback": "<1-2 sentences>" },
    "voice": { "score": <0-100>, "feedback": "<1-2 sentences>" },
    "grammar": { "score": <0-100>, "feedback": "<1-2 sentences>" },
    "impact": { "score": <0-100>, "feedback": "<1-2 sentences>" }
  },
  "suggestions": ["<actionable rewrite suggestion 1>", "<actionable rewrite suggestion 2>", ...]
}

Scoring guide:
- 90-100: Excellent, ready to submit with minor polish
- 75-89: Strong, needs some refinement
- 60-74: Good foundation, needs meaningful revision
- 40-59: Needs significant work on multiple areas
- Below 40: Major rewrite recommended`

    let userMessage = `Please review this essay:\n\n---\n${content}\n---\n\nEssay title: "${essay.title}"`
    if (promptText) userMessage += `\n\nEssay prompt: "${promptText}"`
    if (wordLimit) userMessage += `\nWord limit: ${wordLimit} words (current: ~${content.split(/\s+/).length} words)`
    if (scholarshipName) userMessage += `\nFor scholarship: "${scholarshipName}"`
    if (profile) {
      const ctx = []
      if (profile.intendedMajor) ctx.push(`Intended major: ${profile.intendedMajor}`)
      if (profile.isFirstGen) ctx.push("First-generation college student")
      if (profile.hasFinancialNeed) ctx.push("Has financial need")
      if (profile.activities) ctx.push(`Activities: ${profile.activities}`)
      if (profile.goals) ctx.push(`Goals: ${profile.goals}`)
      if (ctx.length > 0) userMessage += `\n\nStudent context:\n${ctx.join("\n")}`
    }

    const response = await client.messages.create({
      model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    })

    const replyText = response.content
      .filter((block) => block.type === "text")
      .map((block) => {
        if (block.type === "text") return block.text
        return ""
      })
      .join("")

    // Parse JSON response
    let review
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = replyText.match(/\{[\s\S]*\}/)
      review = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(replyText)
    } catch {
      // If parsing fails, return raw text as summary
      review = {
        overallScore: null,
        summary: replyText,
        strengths: [],
        improvements: [],
        categories: {},
        suggestions: [],
      }
    }

    // Save review to database
    await db.essayReview.create({
      data: {
        essayId: id,
        feedback: JSON.stringify(review),
        score: review.overallScore || null,
      },
    })

    return NextResponse.json(review)
  } catch (error) {
    console.error("Error reviewing essay:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
