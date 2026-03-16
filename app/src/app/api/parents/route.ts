import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import crypto from "crypto";

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
    const { name, email, phone, relationship, studentIds } = body;

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

    // Generate a random temporary password (parent will use forgot-password flow)
    const tempPassword = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await hash(tempPassword, 12);

    const parent = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "PARENT",
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
