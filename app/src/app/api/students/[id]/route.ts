import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const student = await db.user.findUnique({
      where: { id, role: "STUDENT" },
      include: {
        studentProfile: true,
        school: true,
        scholarshipApps: {
          include: { scholarship: true },
          orderBy: { createdAt: "desc" },
        },
        tasks: {
          orderBy: { dueDate: "asc" },
        },
        essays: {
          orderBy: { updatedAt: "desc" },
        },
        documents: {
          orderBy: { createdAt: "desc" },
        },
        financialPlans: {
          include: {
            semesters: { include: { incomeSources: true } },
          },
        },
        linkedParents: {
          include: {
            parent: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    if (data.profile) {
      await db.studentProfile.upsert({
        where: { userId: id },
        update: data.profile,
        create: { userId: id, ...data.profile },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
