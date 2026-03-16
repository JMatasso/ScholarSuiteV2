import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/chat-rate-limit"
import { searchUserContext } from "@/lib/chat-rag"
import { generateChatResponse } from "@/lib/chat-ai"
import { tryRuleBasedResponse } from "@/lib/chat-rules"

export const POST = withAuth(async (session, request: NextRequest) => {
  const { role } = session.user

  const { conversationId, message } = await request.json()

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 })
  }

  if (message.length > 2000) {
    return NextResponse.json({ error: "Message too long (max 2000 characters)" }, { status: 400 })
  }

  // Rate limit check
  const rateLimit = await checkRateLimit(session.user.id)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later.", resetAt: rateLimit.resetAt },
      { status: 429 }
    )
  }

  // Get or create conversation
  let convoId = conversationId
  if (convoId) {
    const existing = await db.chatConversation.findFirst({
      where: { id: convoId, userId: session.user.id, isActive: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }
  } else {
    const title = message.slice(0, 60) + (message.length > 60 ? "..." : "")
    const convo = await db.chatConversation.create({
      data: { userId: session.user.id, title },
    })
    convoId = convo.id
  }

  // Save user message
  await db.chatMessage.create({
    data: {
      conversationId: convoId,
      role: "USER",
      content: message.trim(),
    },
  })

  // Layer 1: Try rule-based response first (instant, free, always works)
  const ruleResult = tryRuleBasedResponse(message, session.user.name || "", role)
  if (ruleResult) {
    await db.chatMessage.create({
      data: {
        conversationId: convoId,
        role: "ASSISTANT",
        content: ruleResult.reply,
        sources: ruleResult.sources ? JSON.stringify(ruleResult.sources) : null,
      },
    })
    await db.chatConversation.update({
      where: { id: convoId },
      data: { updatedAt: new Date() },
    })
    return NextResponse.json({
      conversationId: convoId,
      reply: ruleResult.reply,
      sources: ruleResult.sources || [],
      remaining: rateLimit.remaining,
    })
  }

  // Layer 2+3: RAG search then AI (non-fatal if they fail)
  let ragResult = { context: "", sources: [] as { type: string; id: string; label: string }[], hasRelevantData: false }
  try {
    ragResult = await searchUserContext(session.user.id, message, role)
  } catch (ragError) {
    console.error("RAG search failed:", ragError)
  }

  // Get conversation history (last 10 messages)
  const history = await db.chatMessage.findMany({
    where: { conversationId: convoId },
    orderBy: { createdAt: "asc" },
    take: 20,
    select: { role: true, content: true },
  })

  const messages = history.map((m) => ({
    role: m.role.toLowerCase() as "user" | "assistant",
    content: m.content,
  }))

  // Try AI first, fall back to RAG-only response
  let reply: string
  let tokenCount: number | null = null

  try {
    const aiResponse = await generateChatResponse(messages, ragResult.context)
    reply = aiResponse.reply
    tokenCount = aiResponse.inputTokens + aiResponse.outputTokens
  } catch (aiError) {
    console.error("AI call failed, falling back to RAG-only response:", aiError)

    // Build a helpful response from RAG data alone
    if (ragResult.hasRelevantData) {
      reply = "I found some relevant information from your data:\n\n" + ragResult.context
        .split("\n\n")
        .map((section) => {
          const lines = section.split("\n")
          const header = lines[0]?.replace(/^\[|\]$/g, "")
          const items = lines.slice(1).join("\n")
          return `**${header}**\n${items}`
        })
        .join("\n\n")
      reply += "\n\n*Note: AI assistant is temporarily unavailable. Showing data from your account.*"
    } else {
      reply = "I'm sorry, I couldn't find specific information related to your question in your account data, and the AI assistant is temporarily unavailable. Please try again later, or check the relevant section of the app directly."
    }
  }

  // Save assistant message
  await db.chatMessage.create({
    data: {
      conversationId: convoId,
      role: "ASSISTANT",
      content: reply,
      sources: ragResult.sources.length > 0 ? JSON.stringify(ragResult.sources) : null,
      tokenCount,
    },
  })

  // Update conversation timestamp
  await db.chatConversation.update({
    where: { id: convoId },
    data: { updatedAt: new Date() },
  })

  return NextResponse.json({
    conversationId: convoId,
    reply,
    sources: ragResult.sources,
    remaining: rateLimit.remaining,
  })
})
