import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows: Record<string, string>[] = await req.json();

    // Pre-fetch default template for auto-assignment
    const template = await db.taskTemplate.findFirst({
      where: { isDefault: true },
      include: { items: { orderBy: { order: "asc" } } },
    });

    let created = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const email = row.email || row.Email;
      if (!email) continue;

      try {
        const existing = await db.user.findUnique({ where: { email } });
        if (existing) {
          errors.push(`Skipped ${email}: already exists`);
          continue;
        }

        const user = await db.user.create({
          data: {
            email,
            name: row.name || row.Name || email,
            role: "STUDENT",
          },
        });

        await db.studentProfile.create({
          data: {
            userId: user.id,
            firstName: row.firstName || row.first_name || null,
            lastName: row.lastName || row.last_name || null,
            phone: row.phone || null,
            gpa: row.gpa ? parseFloat(row.gpa) : null,
            highSchool: row.school || row.highSchool || row.high_school || null,
          },
        });

        // Auto-assign tasks from default template
        if (template && template.items.length > 0) {
          try {
            await db.task.createMany({
              data: template.items.map((item) => ({
                userId: user.id,
                title: item.title,
                description: item.description,
                phase: item.phase,
                track: item.track,
                priority: item.priority,
                documentFolder: item.documentFolder,
                templateId: template.id,
                templateItemId: item.id,
              })),
            });
          } catch (taskErr) {
            console.error(`Failed to assign tasks to ${email}:`, taskErr);
          }
        }

        created++;
      } catch (err) {
        errors.push(`Failed to import ${email}: ${err}`);
      }
    }

    return NextResponse.json({ created, errors }, { status: 201 });
  } catch (error) {
    console.error("Error importing students:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
