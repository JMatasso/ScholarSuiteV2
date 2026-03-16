import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content, targetRole, cohortId } = await req.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Determine recipients
    let recipientIds: string[] = []

    if (cohortId) {
      // Send to specific cohort members
      const members = await db.cohortMember.findMany({
        where: { cohortId },
        select: { userId: true },
      })
      recipientIds = members.map((m) => m.userId)
    } else if (targetRole === "AT_RISK") {
      // Send to at-risk students
      const students = await db.user.findMany({
        where: {
          role: "STUDENT",
          isActive: true,
          studentProfile: { status: "AT_RISK" },
        },
        select: { id: true },
      })
      recipientIds = students.map((s) => s.id)
    } else if (targetRole) {
      // Send to all users of a specific role
      const users = await db.user.findMany({
        where: { role: targetRole, isActive: true },
        select: { id: true },
      })
      recipientIds = users.map((u) => u.id)
    } else {
      // Send to all active students and parents
      const users = await db.user.findMany({
        where: {
          isActive: true,
          role: { in: ["STUDENT", "PARENT"] },
        },
        select: { id: true },
      })
      recipientIds = users.map((u) => u.id)
    }

    // Filter out the sender
    recipientIds = recipientIds.filter((id) => id !== session.user.id)

    if (recipientIds.length === 0) {
      return NextResponse.json({ error: "No recipients found" }, { status: 400 })
    }

    // Create messages for each recipient
    await db.message.createMany({
      data: recipientIds.map((receiverId) => ({
        senderId: session.user.id,
        receiverId,
        content: content.trim(),
      })),
    })

    return NextResponse.json({ sent: recipientIds.length }, { status: 201 })
  } catch (error) {
    console.error("Broadcast error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
