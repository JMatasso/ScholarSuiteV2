import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
})

const model = process.env.CHAT_AI_MODEL || "claude-haiku-4-5-20241022"

/**
 * AI-enhance resume/brag sheet entries.
 * Takes activity descriptions and turns them into polished impact statements.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { activityIds, mode } = data
    // mode: "enhance" (improve descriptions) | "impact" (generate impact statements)

    // Get the student's activities
    const where: Record<string, unknown> = { userId: session.user.id }
    if (activityIds?.length > 0) {
      where.id = { in: activityIds }
    }

    const activities = await db.activity.findMany({
      where,
      select: {
        id: true,
        title: true,
        category: true,
        organization: true,
        role: true,
        description: true,
        impactStatement: true,
        startDate: true,
        endDate: true,
        isOngoing: true,
        hoursPerWeek: true,
        totalHours: true,
        skillsGained: true,
        isLeadership: true,
        isAward: true,
      },
      take: 20,
    })

    if (activities.length === 0) {
      return NextResponse.json({ error: "No activities found" }, { status: 404 })
    }

    // Get student profile for context
    const profile = await db.studentProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        intendedMajor: true,
        goals: true,
        gradeLevel: true,
      },
    })

    const systemPrompt = mode === "impact"
      ? `You are a college admissions expert who helps students write powerful impact statements for their activities and achievements.

For each activity, generate a concise, quantified impact statement (1-2 sentences) that:
- Uses strong action verbs
- Quantifies results when possible (numbers, percentages, dollar amounts)
- Shows the student's initiative and leadership
- Connects to broader impact on their community or field
- Is written in first person

Return your response as valid JSON:
{
  "enhancements": [
    {
      "activityId": "<id>",
      "impactStatement": "<polished 1-2 sentence impact statement>",
      "actionVerbs": ["<strong verb used>", ...]
    }
  ]
}`
      : `You are a resume writing expert who helps students polish their activity descriptions for scholarship and college applications.

For each activity, improve the description to be more compelling:
- Use strong action verbs
- Be specific about responsibilities and achievements
- Quantify where possible
- Keep it concise (2-3 sentences max)
- Make it relevant to their academic/career goals

Return your response as valid JSON:
{
  "enhancements": [
    {
      "activityId": "<id>",
      "enhancedDescription": "<improved 2-3 sentence description>",
      "enhancedRole": "<improved role title if applicable, or null>"
    }
  ]
}`

    let userMessage = "Please enhance these activities:\n\n"
    for (const act of activities) {
      userMessage += `Activity ID: ${act.id}\n`
      userMessage += `Title: ${act.title}\n`
      userMessage += `Category: ${act.category}\n`
      if (act.organization) userMessage += `Organization: ${act.organization}\n`
      if (act.role) userMessage += `Role: ${act.role}\n`
      if (act.description) userMessage += `Current description: ${act.description}\n`
      if (act.impactStatement) userMessage += `Current impact statement: ${act.impactStatement}\n`
      if (act.hoursPerWeek) userMessage += `Hours/week: ${act.hoursPerWeek}\n`
      if (act.totalHours) userMessage += `Total hours: ${act.totalHours}\n`
      if (act.skillsGained?.length) userMessage += `Skills: ${act.skillsGained.join(", ")}\n`
      if (act.isLeadership) userMessage += `Leadership role: Yes\n`
      if (act.isAward) userMessage += `Award: Yes\n`
      userMessage += "\n"
    }

    if (profile?.intendedMajor) {
      userMessage += `Student's intended major: ${profile.intendedMajor}\n`
    }
    if (profile?.goals) {
      userMessage += `Student's goals: ${profile.goals}\n`
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

    let result
    try {
      const jsonMatch = replyText.match(/\{[\s\S]*\}/)
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(replyText)
    } catch {
      result = { raw: replyText }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error enhancing resume:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Apply AI enhancements to activities.
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { updates } = data
    // updates: [{ activityId, description?, impactStatement?, role? }]

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 })
    }

    let applied = 0
    for (const update of updates) {
      const activity = await db.activity.findUnique({
        where: { id: update.activityId },
        select: { userId: true },
      })
      if (!activity || activity.userId !== session.user.id) continue

      const updateData: Record<string, unknown> = {}
      if (update.description) updateData.description = update.description
      if (update.impactStatement) updateData.impactStatement = update.impactStatement
      if (update.role) updateData.role = update.role

      if (Object.keys(updateData).length > 0) {
        await db.activity.update({
          where: { id: update.activityId },
          data: updateData,
        })
        applied++
      }
    }

    return NextResponse.json({ success: true, applied })
  } catch (error) {
    console.error("Error applying enhancements:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
