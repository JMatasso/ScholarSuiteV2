import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

/** PATCH — update a semester's cost fields */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; semId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: planId, semId } = await params;
    const role = (session.user as { role: string }).role;

    const plan = await db.financialPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }
    if (role === "STUDENT" && plan.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();

    const allowedFields = [
      "name", "type", "order", "tuition", "housing", "food",
      "transportation", "books", "personal", "other",
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in data) updateData[key] = data[key];
    }

    const semester = await db.financialSemester.update({
      where: { id: semId },
      data: updateData,
      include: { incomeSources: true },
    });

    return NextResponse.json(semester);
  } catch (error) {
    console.error("Error updating semester:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** DELETE — remove a semester */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; semId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: planId, semId } = await params;
    const role = (session.user as { role: string }).role;

    const plan = await db.financialPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }
    if (role === "STUDENT" && plan.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.financialSemester.delete({ where: { id: semId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting semester:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
