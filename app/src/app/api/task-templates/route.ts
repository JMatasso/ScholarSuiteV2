import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { DEFAULT_TEMPLATE_ITEMS } from "@/lib/constants"

// GET — fetch the default template with all items
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let template = await db.taskTemplate.findFirst({
      where: { isDefault: true },
      include: {
        items: { orderBy: { order: "asc" } },
      },
    })

    // Auto-seed the default template if it doesn't exist
    if (!template) {
      template = await db.taskTemplate.create({
        data: {
          name: "ScholarShape Standard Program",
          description: "Default task template assigned to all new students",
          isDefault: true,
          items: {
            create: DEFAULT_TEMPLATE_ITEMS.map((item) => ({
              title: item.title,
              description: item.description,
              phase: item.phase as "INTRODUCTION" | "PHASE_1" | "PHASE_2" | "ONGOING" | "FINAL",
              track: (item.track || "SCHOLARSHIP") as "SCHOLARSHIP" | "COLLEGE_PREP" | "COLLEGE_APP" | "FINANCIAL" | "ACADEMIC" | "GENERAL",
              priority: item.priority as "LOW" | "MEDIUM" | "HIGH",
              order: item.order,
              documentFolder: "documentFolder" in item ? (item as { documentFolder: string }).documentFolder : null,
              requiresUpload: "requiresUpload" in item ? (item as { requiresUpload: boolean }).requiresUpload : false,
            })),
          },
        },
        include: {
          items: { orderBy: { order: "asc" } },
        },
      })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error("Error fetching template:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST — add a new item to the default template
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    let template = await db.taskTemplate.findFirst({ where: { isDefault: true } })
    if (!template) {
      return NextResponse.json({ error: "No default template found. Fetch GET first to seed." }, { status: 400 })
    }

    const maxOrder = await db.taskTemplateItem.aggregate({
      where: { templateId: template.id },
      _max: { order: true },
    })

    const item = await db.taskTemplateItem.create({
      data: {
        templateId: template.id,
        title: data.title,
        description: data.description || null,
        phase: data.phase || "INTRODUCTION",
        track: data.track || "SCHOLARSHIP",
        priority: data.priority || "MEDIUM",
        order: data.order ?? (maxOrder._max.order || 0) + 1,
        documentFolder: data.documentFolder || null,
        requiresUpload: data.requiresUpload ?? false,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error("Error creating template item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
