import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const role = (session.user as { role: string }).role;

    // If type=requests, return document requests for this student
    if (type === "requests") {
      const requests = await db.documentRequest.findMany({
        where: role === "ADMIN" ? {} : { studentId: session.user.id },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(requests);
    }

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

    const documents = await db.document.findMany({
      where,
      include: {
        user: { select: { name: true } },
        request: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
