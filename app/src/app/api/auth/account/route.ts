import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hash, compare } from "bcryptjs";

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password, currentPassword, image } = body;

    // If changing password or email, currentPassword is required
    if ((password || email) && !currentPassword) {
      return NextResponse.json(
        { error: "Current password is required to change password or email" },
        { status: 400 }
      );
    }

    // Validate current password if provided
    if (currentPassword) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
      });

      if (!user || !user.password) {
        return NextResponse.json(
          { error: "User not found or no password set" },
          { status: 400 }
        );
      }

      const isValid = await compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 403 }
        );
      }
    }

    // If changing email, check uniqueness
    if (email) {
      const existing = await db.user.findUnique({ where: { email } });
      if (existing && existing.id !== session.user.id) {
        return NextResponse.json(
          { error: "Email is already in use" },
          { status: 409 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (image !== undefined) updateData.image = image;
    if (password) {
      updateData.password = await hash(password, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Account update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
