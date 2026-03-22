import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as { role: string }).role;
    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get("role");

    if (role === "ADMIN") {
      // Lightweight list for push dialogs, pickers, etc.
      const minimal = searchParams.get("minimal");
      if (minimal === "true") {
        const students = await db.user.findMany({
          where: { role: "STUDENT", isActive: true },
          select: {
            id: true,
            name: true,
            email: true,
            studentProfile: { select: { journeyStage: true } },
          },
          orderBy: { name: "asc" },
        });
        return NextResponse.json(students);
      }

      // Admin can query PARENT role users for the parents page
      if (roleFilter === "PARENT") {
        const parents = await db.user.findMany({
          where: { role: "PARENT" },
          include: {
            parentProfile: true,
            linkedStudents: {
              include: {
                student: { select: { id: true, name: true, email: true, image: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(parents);
      }

      const students = await db.user.findMany({
        where: { role: "STUDENT" },
        include: {
          studentProfile: {
            include: {
              assignedAdmin: {
                select: { id: true, name: true, image: true },
              },
            },
          },
          school: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(students);
    }

    if (role === "PARENT") {
      // Return linked students for this parent
      const links = await db.parentStudent.findMany({
        where: { parentId: session.user.id },
        include: {
          student: {
            include: {
              studentProfile: true,
              school: true,
            },
          },
        },
      });
      const students = links.map((l) => l.student);
      return NextResponse.json(students);
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    // If admin provides a temporary password, hash it and flag for change
    let hashedPassword: string | undefined;
    if (data.tempPassword) {
      const { hash } = await import("bcryptjs");
      hashedPassword = await hash(data.tempPassword, 10);
    }

    const user = await db.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: "STUDENT",
        ...(hashedPassword ? { password: hashedPassword, mustChangePassword: true } : {}),
      },
    });

    if (data.phone || data.school || data.gpa) {
      await db.studentProfile.create({
        data: {
          userId: user.id,
          phone: data.phone || null,
          highSchool: data.school || null,
          gpa: data.gpa ? parseFloat(data.gpa) : null,
        },
      });
    }

    // Tasks are no longer auto-assigned on student creation.
    // Admins push task templates to students on demand from /admin/templates.

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
