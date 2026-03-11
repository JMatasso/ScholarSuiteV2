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
      // Admin can query PARENT role users for the parents page
      if (roleFilter === "PARENT") {
        const parents = await db.user.findMany({
          where: { role: "PARENT" },
          include: {
            parentProfile: true,
            linkedStudents: {
              include: {
                student: { select: { id: true, name: true, email: true } },
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
          studentProfile: true,
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

    const user = await db.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: "STUDENT",
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

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
