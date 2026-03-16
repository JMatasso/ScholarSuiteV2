import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"

export const GET = withAuth(async (session, request: NextRequest) => {
  const conversationId = request.nextUrl.pathname.split("/").pop()!

  const conversation = await db.chatConversation.findFirst({
    where: { id: conversationId, userId: session.user.id, isActive: true },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          sources: true,
          createdAt: true,
        },
      },
    },
  })

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
  }

  return NextResponse.json({
    id: conversation.id,
    title: conversation.title,
    messages: conversation.messages.map((m) => ({
      ...m,
      sources: m.sources ? JSON.parse(m.sources) : [],
    })),
    createdAt: conversation.createdAt,
  })
})

export const DELETE = withAuth(async (session, request: NextRequest) => {
  const conversationId = request.nextUrl.pathname.split("/").pop()!

  const conversation = await db.chatConversation.findFirst({
    where: { id: conversationId, userId: session.user.id },
  })

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
  }

  await db.chatConversation.update({
    where: { id: conversationId },
    data: { isActive: false },
  })

  return NextResponse.json({ success: true })
})
