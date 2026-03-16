import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

// POST — mark a lesson as complete (or toggle)
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    if (!data.lessonId) {
      return NextResponse.json({ error: "lessonId is required" }, { status: 400 })
    }

    const isCompleted = data.isCompleted !== false

    const progress = await db.learningProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: data.lessonId,
        },
      },
      update: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
      create: {
        userId: session.user.id,
        lessonId: data.lessonId,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    })

    return NextResponse.json(progress)
  } catch (error) {
    console.error("Error updating progress:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
