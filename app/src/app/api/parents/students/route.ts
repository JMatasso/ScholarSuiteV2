import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if ((session.user as { role: string }).role !== "PARENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const links = await db.parentStudent.findMany({
      where: { parentId: session.user.id },
      include: {
        student: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return NextResponse.json(links.map((l) => l.student));
  } catch (error) {
    console.error("Parent students GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
