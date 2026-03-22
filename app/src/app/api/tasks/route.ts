import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as { role: string }).role;

    let where: object = { userId: session.user.id };
    if (role === "ADMIN") {
      where = {};
    } else if (role === "PARENT") {
      // Fetch linked student IDs for this parent
      const links = await db.parentStudent.findMany({
        where: { parentId: session.user.id },
        select: { studentId: true },
      });
      const studentIds = links.map((l) => l.studentId);
      where = { userId: { in: studentIds } };
    }

    const tasks = await db.task.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, image: true } },
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    const task = await db.task.create({
      data: {
        userId: data.userId || session.user.id,
        title: data.title,
        description: data.description,
        phase: data.phase || "INTRODUCTION",
        track: data.track || "SCHOLARSHIP",
        priority: data.priority || "MEDIUM",
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        documentFolder: data.documentFolder || null,
        requiresUpload: data.requiresUpload || false,
        notifyParent: data.notifyParent || false,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
