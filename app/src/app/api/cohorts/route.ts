import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cohorts = await db.cohort.findMany({
      include: {
        members: { include: { user: { select: { id: true, name: true, image: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(cohorts);
  } catch (error) {
    console.error("Error fetching cohorts:", error);
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

    const cohort = await db.cohort.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
      },
    });

    return NextResponse.json(cohort, { status: 201 });
  } catch (error) {
    console.error("Error creating cohort:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
