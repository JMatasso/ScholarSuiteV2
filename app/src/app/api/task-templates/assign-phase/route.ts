import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { JOURNEY_STAGE_TO_TASK_PHASES, DEFAULT_TEMPLATE_ITEMS } from "@/lib/constants"

// POST — assign template tasks for a specific journey stage to a single student
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { studentId, stage } = data as { studentId: string; stage?: string }

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 })
    }

    // Look up the student's journey stage if not provided
    let targetStage = stage
    if (!targetStage) {
      const profile = await db.studentProfile.findUnique({
        where: { userId: studentId },
        select: { journeyStage: true },
      })
      targetStage = profile?.journeyStage || "EARLY_EXPLORATION"
    }

    // Get matching task phases for this journey stage
    const taskPhases = JOURNEY_STAGE_TO_TASK_PHASES[targetStage]
    if (!taskPhases || taskPhases.length === 0) {
      return NextResponse.json({ error: "No task phases for this stage" }, { status: 400 })
    }

    // Try to find a DB template first; fall back to constants
    const template = await db.taskTemplate.findFirst({
      where: { isDefault: true },
    })

    let templateId: string | null = template?.id || null

    if (template) {
      // Use DB template items
      const templateItems = await db.taskTemplateItem.findMany({
        where: {
          templateId: template.id,
          phase: { in: taskPhases as ("INTRODUCTION" | "PHASE_1" | "PHASE_2" | "ONGOING" | "FINAL")[] },
        },
        orderBy: { order: "asc" },
      })

      if (templateItems.length > 0) {
        const existingTasks = await db.task.findMany({
          where: { userId: studentId, templateId: template.id },
          select: { templateItemId: true },
        })
        const existingItemIds = new Set(
          existingTasks.map((t) => t.templateItemId).filter(Boolean)
        )

        const missingItems = templateItems.filter(
          (item) => !existingItemIds.has(item.id)
        )

        if (missingItems.length === 0) {
          return NextResponse.json({
            success: true,
            tasksCreated: 0,
            message: "All phase tasks already assigned",
          })
        }

        await db.task.createMany({
          data: missingItems.map((item) => ({
            userId: studentId,
            title: item.title,
            description: item.description,
            phase: item.phase,
            track: item.track,
            priority: item.priority,
            documentFolder: item.documentFolder,
            requiresUpload: item.requiresUpload,
            templateId: template.id,
            templateItemId: item.id,
          })),
        })

        return NextResponse.json({
          success: true,
          tasksCreated: missingItems.length,
          stage: targetStage,
        })
      }
    }

    // Fallback: use DEFAULT_TEMPLATE_ITEMS from constants
    const phaseItems = DEFAULT_TEMPLATE_ITEMS.filter(
      (item) => taskPhases.includes(item.phase)
    )

    if (phaseItems.length === 0) {
      return NextResponse.json({
        success: true,
        tasksCreated: 0,
        message: "No template items found for this phase",
      })
    }

    // Deduplicate: check existing tasks by title
    const existingTasks = await db.task.findMany({
      where: { userId: studentId },
      select: { title: true },
    })
    const existingTitles = new Set(existingTasks.map((t) => t.title))

    const missingItems = phaseItems.filter(
      (item) => !existingTitles.has(item.title)
    )

    if (missingItems.length === 0) {
      return NextResponse.json({
        success: true,
        tasksCreated: 0,
        message: "All phase tasks already assigned",
      })
    }

    await db.task.createMany({
      data: missingItems.map((item) => {
        const rec = item as { title: string; description: string; phase: string; track?: string; priority: string; documentFolder?: string; requiresUpload?: boolean; order: number }
        return {
          userId: studentId,
          title: rec.title,
          description: rec.description,
          phase: rec.phase as "INTRODUCTION" | "PHASE_1" | "PHASE_2" | "ONGOING" | "FINAL",
          track: (rec.track || "SCHOLARSHIP") as "SCHOLARSHIP" | "COLLEGE_PREP" | "COLLEGE_APP" | "FINANCIAL" | "ACADEMIC" | "GENERAL",
          priority: rec.priority as "LOW" | "MEDIUM" | "HIGH",
          documentFolder: rec.documentFolder || null,
          requiresUpload: rec.requiresUpload || false,
          templateId: templateId,
        }
      }),
    })

    return NextResponse.json({
      success: true,
      tasksCreated: missingItems.length,
      stage: targetStage,
    })
  } catch (error) {
    console.error("Error assigning phase tasks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
