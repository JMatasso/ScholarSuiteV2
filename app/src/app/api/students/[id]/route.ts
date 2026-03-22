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
        studentProfile: {
          include: {
            assignedAdmin: {
              select: { id: true, name: true, image: true },
            },
          },
        },
        school: true,
        scholarshipApps: {
          include: { scholarship: true },
          orderBy: { createdAt: "desc" },
        },
        tasks: {
          orderBy: [{ phase: "asc" }, { dueDate: "asc" }],
        },
        collegeApps: {
          orderBy: { createdAt: "desc" },
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
              select: { id: true, name: true, email: true, image: true },
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify user exists and is a student
    const student = await db.user.findUnique({
      where: { id, role: "STUDENT" },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Delete in order: related records first, then user (cascade handles profile)
    await db.$transaction([
      db.parentStudent.deleteMany({ where: { studentId: id } }),
      db.scholarshipApplication.deleteMany({ where: { userId: id } }),
      db.task.deleteMany({ where: { userId: id } }),
      db.essay.deleteMany({ where: { userId: id } }),
      db.activity.deleteMany({ where: { userId: id } }),
      db.meetingParticipant.deleteMany({ where: { userId: id } }),
      db.message.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } }),
      db.document.deleteMany({ where: { userId: id } }),
      db.notification.deleteMany({ where: { userId: id } }),
      db.studentProfile.deleteMany({ where: { userId: id } }),
      db.financialPlan.deleteMany({ where: { userId: id } }),
      db.user.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting student:", error);
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

    // Handle admin assignment
    if (data.assignedAdminId !== undefined) {
      // Validate admin exists if not null
      if (data.assignedAdminId !== null) {
        const admin = await db.user.findFirst({
          where: { id: data.assignedAdminId, role: "ADMIN" },
        });
        if (!admin) {
          return NextResponse.json({ error: "Admin not found" }, { status: 404 });
        }
      }
      await db.studentProfile.upsert({
        where: { userId: id },
        update: { assignedAdminId: data.assignedAdminId },
        create: { userId: id, assignedAdminId: data.assignedAdminId },
      });
    }

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
