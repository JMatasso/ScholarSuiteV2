import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if ((session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
  } catch (error) {
    console.error("Parents GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if ((session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, phone, relationship, studentIds, tempPassword } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Check email uniqueness
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email is already in use" },
        { status: 409 }
      );
    }

    // Hash temp password if provided
    let hashedPassword: string | undefined;
    if (tempPassword) {
      const { hash } = await import("bcryptjs");
      hashedPassword = await hash(tempPassword, 10);
    }

    const parent = await db.user.create({
      data: {
        name,
        email,
        role: "PARENT",
        ...(hashedPassword ? { password: hashedPassword, mustChangePassword: true } : {}),
        parentProfile: {
          create: {
            phone: phone || null,
            relationship: relationship || null,
          },
        },
        ...(studentIds && studentIds.length > 0
          ? {
              linkedStudents: {
                create: studentIds.map((studentId: string) => ({
                  studentId,
                })),
              },
            }
          : {}),
      },
      include: {
        parentProfile: true,
        linkedStudents: {
          include: {
            student: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    // Remove password from response
    const { password: _, ...parentWithoutPassword } = parent;

    return NextResponse.json(parentWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Parents POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
