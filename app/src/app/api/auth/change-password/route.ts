import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Both fields are required" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: session.user.id } });
    if (!user || !user.password) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { compare, hash } = await import("bcryptjs");
    const isValid = await compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json({ error: "New password must be different from current password" }, { status: 400 });
    }

    const hashedPassword = await hash(newPassword, 10);
    await db.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword, mustChangePassword: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
