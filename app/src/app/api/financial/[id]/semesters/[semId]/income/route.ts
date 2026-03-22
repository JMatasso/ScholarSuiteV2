import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

/** POST — add an income source to a semester */
export async function POST(
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

    // Verify semester belongs to plan
    const semester = await db.financialSemester.findFirst({
      where: { id: semId, planId },
    });
    if (!semester) {
      return NextResponse.json({ error: "Semester not found" }, { status: 404 });
    }

    const data = await req.json();

    // If recurring, create the income source on multiple semesters
    if (data.isRecurring && Array.isArray(data.applyToSemesterIds)) {
      const semesterIds: string[] = data.applyToSemesterIds;
      // Verify all semesters belong to this plan
      const validSemesters = await db.financialSemester.findMany({
        where: { id: { in: semesterIds }, planId },
        select: { id: true },
      });
      const validIds = new Set(validSemesters.map((s) => s.id));

      const sources = await db.$transaction(
        semesterIds
          .filter((id) => validIds.has(id))
          .map((sid) =>
            db.incomeSource.create({
              data: {
                semesterId: sid,
                name: data.name,
                type: data.type || "Other",
                amount: data.amount ?? 0,
                status: data.status || "CONFIRMED",
                isRecurring: true,
              },
            })
          )
      );
      return NextResponse.json(sources, { status: 201 });
    }

    const source = await db.incomeSource.create({
      data: {
        semesterId: semId,
        name: data.name,
        type: data.type || "Other",
        amount: data.amount ?? 0,
        status: data.status || "CONFIRMED",
        isRecurring: data.isRecurring || false,
      },
    });

    return NextResponse.json(source, { status: 201 });
  } catch (error) {
    console.error("Error adding income source:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** PATCH — update an income source (pass sourceId in body) */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; semId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: planId } = await params;
    const role = (session.user as { role: string }).role;

    const plan = await db.financialPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }
    if (role === "STUDENT" && plan.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    if (!data.sourceId) {
      return NextResponse.json({ error: "sourceId required" }, { status: 400 });
    }

    const allowedFields = ["name", "type", "amount", "status", "isRecurring"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in data) updateData[key] = data[key];
    }

    const source = await db.incomeSource.update({
      where: { id: data.sourceId },
      data: updateData,
    });

    return NextResponse.json(source);
  } catch (error) {
    console.error("Error updating income source:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** DELETE — remove an income source (sourceId in query param) */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; semId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: planId } = await params;
    const role = (session.user as { role: string }).role;

    const plan = await db.financialPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }
    if (role === "STUDENT" && plan.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const sourceId = searchParams.get("sourceId");
    if (!sourceId) {
      return NextResponse.json({ error: "sourceId required" }, { status: 400 });
    }

    await db.incomeSource.delete({ where: { id: sourceId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting income source:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
