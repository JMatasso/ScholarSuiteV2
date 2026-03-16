import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"

export const GET = withAuth(async (session, request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = parseInt(searchParams.get("limit") || "20", 10)
  const skip = (page - 1) * limit

  const [conversations, total] = await Promise.all([
    db.chatConversation.findMany({
      where: { userId: session.user.id, isActive: true },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, role: true, createdAt: true },
        },
      },
    }),
    db.chatConversation.count({
      where: { userId: session.user.id, isActive: true },
    }),
  ])

  const result = conversations.map((c) => ({
    id: c.id,
    title: c.title,
    updatedAt: c.updatedAt,
    lastMessage: c.messages[0] || null,
  }))

  return NextResponse.json({ conversations: result, total })
})
