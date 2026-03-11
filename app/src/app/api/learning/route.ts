import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const modules = await db.learningModule.findMany({
      where: { isPublished: true },
      include: {
        lessons: {
          include: {
            progress: session.user.id
              ? { where: { userId: session.user.id } }
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
