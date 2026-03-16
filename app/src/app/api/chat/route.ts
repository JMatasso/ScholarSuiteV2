import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/chat-rate-limit"
import { searchUserContext } from "@/lib/chat-rag"
import { generateChatResponse } from "@/lib/chat-ai"

export const POST = withAuth(async (session, request: NextRequest) => {
  const { role } = session.user
  if (role !== "STUDENT" && role !== "PARENT") {
    return NextResponse.json({ error: "Chat is available for students and parents" }, { status: 403 })
  }

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

  // RAG search
  const ragResult = await searchUserContext(session.user.id, message, role)

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

  // Call AI
  const aiResponse = await generateChatResponse(messages, ragResult.context)

  // Save assistant message
  await db.chatMessage.create({
    data: {
      conversationId: convoId,
      role: "ASSISTANT",
      content: aiResponse.reply,
      sources: ragResult.sources.length > 0 ? JSON.stringify(ragResult.sources) : null,
      tokenCount: aiResponse.inputTokens + aiResponse.outputTokens,
    },
  })

  // Update conversation timestamp
  await db.chatConversation.update({
    where: { id: convoId },
    data: { updatedAt: new Date() },
  })

  return NextResponse.json({
    conversationId: convoId,
    reply: aiResponse.reply,
    sources: ragResult.sources,
    remaining: rateLimit.remaining,
  })
})
