import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

/** POST — add a new semester to a financial plan */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: planId } = await params;
    const role = (session.user as { role: string }).role;

    // Verify plan ownership
    const plan = await db.financialPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }
    if (role === "STUDENT" && plan.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();

    // Get the max order value for this plan
    const maxOrder = await db.financialSemester.aggregate({
      where: { planId },
      _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    const semester = await db.financialSemester.create({
      data: {
        planId,
        name: data.name,
        type: data.type || "CUSTOM",
        order: data.order ?? nextOrder,
        isCustom: true,
        tuition: data.tuition ?? 0,
        housing: data.housing ?? 0,
        food: data.food ?? 0,
        transportation: data.transportation ?? 0,
        books: data.books ?? 0,
        personal: data.personal ?? 0,
        other: data.other ?? 0,
      },
      include: { incomeSources: true },
    });

    return NextResponse.json(semester, { status: 201 });
  } catch (error) {
    console.error("Error adding semester:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
