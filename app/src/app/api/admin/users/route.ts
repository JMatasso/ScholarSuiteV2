import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if ((session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admins = await db.user.findMany({
      where: { role: "ADMIN" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        isActive: true,
        isMasterAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(admins);
  } catch (error) {
    console.error("Admin users GET error:", error);
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

    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
    });
    if (!currentUser?.isMasterAdmin) {
      return NextResponse.json(
        { error: "Only master admins can manage admin accounts" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
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

    const hashedPassword = await hash(password, 12);

    const newAdmin = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "ADMIN",
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        isActive: true,
        isMasterAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(newAdmin, { status: 201 });
  } catch (error) {
    console.error("Admin users POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if ((session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
    });
    if (!currentUser?.isMasterAdmin) {
      return NextResponse.json(
        { error: "Only master admins can manage admin accounts" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, isActive } = body;

    if (!userId || typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "userId and isActive (boolean) are required" },
        { status: 400 }
      );
    }

    // Cannot deactivate yourself
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account" },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        isActive: true,
        isMasterAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Admin users PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if ((session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
    });
    if (!currentUser?.isMasterAdmin) {
      return NextResponse.json(
        { error: "Only master admins can manage admin accounts" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Cannot deactivate yourself
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account" },
        { status: 400 }
      );
    }

    const deactivatedUser = await db.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(deactivatedUser);
  } catch (error) {
    console.error("Admin users DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
