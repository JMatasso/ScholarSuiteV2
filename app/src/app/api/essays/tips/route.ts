import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
})

const model = process.env.CHAT_AI_MODEL || "claude-haiku-4-5-20241022"

/**
 * Generate personalized essay prompts and writing tips based on the student's profile.
 * This is NOT an essay generator — it provides guidance, brainstorming angles,
 * and structural tips the student can use to write their own essay.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { essayPrompt, scholarshipName, essayType } = data

    // Get student profile for personalization
    const profile = await db.studentProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        firstName: true,
        gpa: true,
        gradeLevel: true,
        intendedMajor: true,
        highSchool: true,
        ethnicity: true,
        isFirstGen: true,
        isPellEligible: true,
        hasFinancialNeed: true,
        activities: true,
        communityService: true,
        leadershipRoles: true,
        awards: true,
        goals: true,
        city: true,
        state: true,
        county: true,
      },
    })

    // Get student's activities for richer context
    const activities = await db.activity.findMany({
      where: { userId: session.user.id },
      select: { title: true, category: true, description: true, role: true, impactStatement: true },
      take: 10,
    })

    const systemPrompt = `You are a scholarship essay writing coach. Your job is to help students brainstorm and plan their essays — NOT to write the essay for them.

Given a student's profile and an essay prompt (or type), provide:
1. Personalized brainstorming angles they could explore based on their actual experiences
2. Structural tips for this specific type of essay
3. Do's and don'ts
4. Opening line strategies (not actual lines, but approaches)
5. Key themes from their profile that would resonate

Return your response as valid JSON:
{
  "angles": [
    { "title": "<angle name>", "description": "<why this could work for them>", "profileConnection": "<which part of their profile supports this>" }
  ],
  "structure": {
    "recommended": "<recommended essay structure>",
    "tips": ["<structural tip 1>", "<structural tip 2>", ...]
  },
  "dos": ["<do 1>", "<do 2>", ...],
  "donts": ["<don't 1>", "<don't 2>", ...],
  "openingStrategies": ["<strategy 1>", "<strategy 2>", ...],
  "keyThemes": ["<theme from their profile>", ...],
  "wordBudget": "<if word limit is given, suggest how to allocate words across sections>"
}`

    let userMessage = ""
    if (essayPrompt) {
      userMessage += `Essay prompt: "${essayPrompt}"\n`
    }
    if (scholarshipName) {
      userMessage += `For: ${scholarshipName}\n`
    }
    if (essayType) {
      userMessage += `Essay type: ${essayType}\n`
    }

    userMessage += "\nStudent profile:\n"
    if (profile) {
      if (profile.firstName) userMessage += `Name: ${profile.firstName}\n`
      if (profile.intendedMajor) userMessage += `Intended major: ${profile.intendedMajor}\n`
      if (profile.gpa) userMessage += `GPA: ${profile.gpa}\n`
      if (profile.isFirstGen) userMessage += `First-generation college student\n`
      if (profile.hasFinancialNeed) userMessage += `Has demonstrated financial need\n`
      if (profile.ethnicity) userMessage += `Background: ${profile.ethnicity}\n`
      if (profile.city && profile.state) userMessage += `From: ${profile.city}, ${profile.state}\n`
      if (profile.activities) userMessage += `Activities summary: ${profile.activities}\n`
      if (profile.communityService) userMessage += `Community service: ${profile.communityService}\n`
      if (profile.leadershipRoles) userMessage += `Leadership: ${profile.leadershipRoles}\n`
      if (profile.awards) userMessage += `Awards: ${profile.awards}\n`
      if (profile.goals) userMessage += `Goals: ${profile.goals}\n`
    }

    if (activities.length > 0) {
      userMessage += "\nDetailed activities:\n"
      for (const act of activities) {
        userMessage += `- ${act.title} (${act.category})${act.role ? ` as ${act.role}` : ""}${act.impactStatement ? `: ${act.impactStatement}` : ""}\n`
      }
    }

    if (!essayPrompt && !essayType) {
      userMessage += "\nNo specific prompt given. Provide general scholarship essay writing tips personalized to this student's profile."
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

    let tips
    try {
      const jsonMatch = replyText.match(/\{[\s\S]*\}/)
      tips = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(replyText)
    } catch {
      tips = { raw: replyText }
    }

    return NextResponse.json(tips)
  } catch (error) {
    console.error("Error generating essay tips:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
