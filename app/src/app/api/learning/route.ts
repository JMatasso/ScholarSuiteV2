import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as { role: string }).role;
    const subject = request.nextUrl.searchParams.get("subject");
    const includeUnpublished = role === "ADMIN";

    // Build where clause
    const where: Record<string, unknown> = {};
    if (!includeUnpublished) where.isPublished = true;
    if (subject === "COLLEGE_PREP" || subject === "SCHOLARSHIP") {
      where.subject = subject;
    }

    // For student/parent, determine userId for progress tracking
    let progressUserId = session.user.id;
    if (role === "PARENT") {
      const studentId = request.nextUrl.searchParams.get("studentId");
      if (studentId) {
        const link = await db.parentStudent.findFirst({
          where: { parentId: session.user.id, studentId },
        });
        if (link) progressUserId = studentId;
      }
    }

    const modules = await db.learningModule.findMany({
      where,
      include: {
        lessons: {
          include: {
            progress: (role !== "ADMIN")
              ? { where: { userId: progressUserId } }
              : false,
          },
          orderBy: { order: "asc" },
        },
        prerequisite: { select: { id: true, title: true } },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(modules);
  } catch (error) {
    console.error("Error fetching modules:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    const module = await db.learningModule.create({
      data: {
        title: data.title,
        description: data.description,
        icon: data.icon,
        imageUrl: data.imageUrl,
        subject: data.subject || "COLLEGE_PREP",
        category: data.category,
        order: data.order || 0,
        isPublished: data.isPublished || false,
        prerequisiteId: data.prerequisiteId,
      },
    });

    return NextResponse.json(module, { status: 201 });
  } catch (error) {
    console.error("Error creating module:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
