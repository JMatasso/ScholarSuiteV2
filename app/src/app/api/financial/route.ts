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
    const studentId = searchParams.get("studentId");

    const userId =
      (session.user as { role: string }).role === "ADMIN" && studentId
        ? studentId
        : session.user.id;

    const plan = await db.financialPlan.findFirst({
      where: { userId },
      include: {
        semesters: {
          include: { incomeSources: true },
          orderBy: { name: "asc" },
        },
      },
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error fetching financial plan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    const plan = await db.financialPlan.create({
      data: {
        userId: session.user.id,
        semesters: {
          create: (data.semesters || []).map(
            (s: {
              name: string;
              tuition?: number;
              housing?: number;
              food?: number;
              transportation?: number;
              books?: number;
              personal?: number;
              other?: number;
            }) => ({
              name: s.name,
              tuition: s.tuition || 0,
              housing: s.housing || 0,
              food: s.food || 0,
              transportation: s.transportation || 0,
              books: s.books || 0,
              personal: s.personal || 0,
              other: s.other || 0,
            })
          ),
        },
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Error creating financial plan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
