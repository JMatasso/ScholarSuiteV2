import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

// POST — assign default template tasks to all students who don't have them yet
export async function POST() {
  try {
    const session = await auth()
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const template = await db.taskTemplate.findFirst({
      where: { isDefault: true },
      include: { items: { orderBy: { order: "asc" } } },
    })

    if (!template || template.items.length === 0) {
      return NextResponse.json({ error: "No default template found" }, { status: 400 })
    }

    // Find all active students
    const students = await db.user.findMany({
      where: { role: "STUDENT", isActive: true },
      select: { id: true },
    })

    // For each student, find which template items they're missing
    let totalCreated = 0
    for (const student of students) {
      const existingTasks = await db.task.findMany({
        where: { userId: student.id, templateId: template.id },
        select: { templateItemId: true },
      })
      const existingItemIds = new Set(existingTasks.map((t) => t.templateItemId).filter(Boolean))

      const missingItems = template.items.filter((item) => !existingItemIds.has(item.id))

      if (missingItems.length > 0) {
        await db.task.createMany({
          data: missingItems.map((item) => ({
            userId: student.id,
            title: item.title,
            description: item.description,
            phase: item.phase,
            track: item.track,
            priority: item.priority,
            documentFolder: item.documentFolder,
            templateId: template.id,
            templateItemId: item.id,
          })),
        })
        totalCreated += missingItems.length
      }
    }

    return NextResponse.json({
      success: true,
      studentsUpdated: students.length,
      tasksCreated: totalCreated,
    })
  } catch (error) {
    console.error("Error assigning template:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
