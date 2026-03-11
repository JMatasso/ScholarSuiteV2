import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    const essay = await db.essay.findUnique({
      where: { id },
    });

    if (!essay) {
      return NextResponse.json({ error: "Essay not found" }, { status: 404 });
    }

    const role = (session.user as { role: string }).role;
    if (role !== "ADMIN" && essay.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await db.essay.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });

    // If content is updated, create a new version
    if (data.content !== undefined) {
      const lastVersion = await db.essayVersion.findFirst({
        where: { essayId: id },
        orderBy: { version: "desc" },
      });
      await db.essayVersion.create({
        data: {
          essayId: id,
          content: data.content,
          version: (lastVersion?.version ?? 0) + 1,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating essay:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
