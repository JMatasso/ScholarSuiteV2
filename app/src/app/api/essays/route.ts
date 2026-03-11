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
    const where = role === "ADMIN" ? {} : { userId: session.user.id };

    const essays = await db.essay.findMany({
      where,
      include: {
        application: { include: { scholarship: true } },
        versions: { orderBy: { version: "desc" }, take: 1 },
        reviews: { orderBy: { createdAt: "desc" }, take: 1 },
        prompt: true,
        user: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(essays);
  } catch (error) {
    console.error("Error fetching essays:", error);
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

    const essay = await db.essay.create({
      data: {
        userId: session.user.id,
        title: data.title,
        content: data.content || "",
        applicationId: data.applicationId,
        promptId: data.promptId,
      },
    });

    await db.essayVersion.create({
      data: {
        essayId: essay.id,
        content: data.content || "",
        version: 1,
      },
    });

    return NextResponse.json(essay, { status: 201 });
  } catch (error) {
    console.error("Error creating essay:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
