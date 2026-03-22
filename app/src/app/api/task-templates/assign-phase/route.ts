import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { JOURNEY_STAGE_TO_TASK_PHASES } from "@/lib/constants"

// POST — assign template tasks for a specific journey stage
// Supports: single student, multiple students, or all students in a stage
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { studentId, studentIds, stage, allInStage } = data as {
      studentId?: string
      studentIds?: string[]
      stage?: string
      allInStage?: boolean
    }

    if (!stage) {
      return NextResponse.json({ error: "stage is required" }, { status: 400 })
    }

    const taskPhases = JOURNEY_STAGE_TO_TASK_PHASES[stage]
    if (!taskPhases || taskPhases.length === 0) {
      return NextResponse.json({ error: "No task phases for this stage" }, { status: 400 })
    }

    // Determine target students
    let targetStudentIds: string[] = []

    if (allInStage) {
      // Push to all active students in this journey stage
      const profiles = await db.studentProfile.findMany({
        where: { journeyStage: stage as "EARLY_EXPLORATION" | "ACTIVE_PREP" | "APPLICATION_PHASE" | "POST_ACCEPTANCE" },
        select: { userId: true },
      })
      targetStudentIds = profiles.map(p => p.userId)
    } else if (studentIds && studentIds.length > 0) {
      targetStudentIds = studentIds
    } else if (studentId) {
      targetStudentIds = [studentId]
    } else {
      return NextResponse.json({ error: "Provide studentId, studentIds, or allInStage" }, { status: 400 })
    }

    if (targetStudentIds.length === 0) {
      return NextResponse.json({ success: true, tasksCreated: 0, studentsUpdated: 0, message: "No students found for this stage" })
    }

    // Get template items for the matching phases
    const template = await db.taskTemplate.findFirst({
      where: { isDefault: true },
    })

    if (!template) {
      return NextResponse.json({ error: "No default template found" }, { status: 400 })
    }

    const templateItems = await db.taskTemplateItem.findMany({
      where: {
        templateId: template.id,
        phase: { in: taskPhases as ("INTRODUCTION" | "PHASE_1" | "PHASE_2" | "ONGOING" | "FINAL")[] },
      },
      orderBy: { order: "asc" },
    })

    if (templateItems.length === 0) {
      return NextResponse.json({ success: true, tasksCreated: 0, studentsUpdated: 0, message: "No template items for this phase" })
    }

    let totalCreated = 0
    let studentsUpdated = 0

    for (const sid of targetStudentIds) {
      const existingTasks = await db.task.findMany({
        where: { userId: sid, templateId: template.id },
        select: { templateItemId: true },
      })
      const existingItemIds = new Set(existingTasks.map(t => t.templateItemId).filter(Boolean))

      const missingItems = templateItems.filter(item => !existingItemIds.has(item.id))

      if (missingItems.length > 0) {
        await db.task.createMany({
          data: missingItems.map(item => ({
            userId: sid,
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
        totalCreated += missingItems.length
        studentsUpdated++
      }
    }

    return NextResponse.json({
      success: true,
      tasksCreated: totalCreated,
      studentsUpdated,
      stage,
    })
  } catch (error) {
    console.error("Error assigning phase tasks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
