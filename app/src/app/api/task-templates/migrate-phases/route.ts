import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

// POST — one-time migration: move all template items and student tasks to FINAL phase (Senior Spring)
export async function POST() {
  try {
    const session = await auth()
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update all template items to FINAL
    const templateResult = await db.taskTemplateItem.updateMany({
      where: {
        phase: { in: ["INTRODUCTION", "PHASE_1", "PHASE_2", "ONGOING"] },
      },
      data: { phase: "FINAL" },
    })

    // Update all existing student tasks to FINAL
    const taskResult = await db.task.updateMany({
      where: {
        phase: { in: ["INTRODUCTION", "PHASE_1", "PHASE_2", "ONGOING"] },
      },
      data: { phase: "FINAL" },
    })

    return NextResponse.json({
      templateItemsUpdated: templateResult.count,
      studentTasksUpdated: taskResult.count,
    })
  } catch (error) {
    console.error("Error migrating phases:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
