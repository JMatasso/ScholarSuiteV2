import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, relationship, studentIds } = body;

    // Verify parent exists
    const parent = await db.user.findUnique({
      where: { id, role: "PARENT" },
    });
    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    // Check email uniqueness if changing
    if (email && email !== parent.email) {
      const existing = await db.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json(
          { error: "Email is already in use" },
          { status: 409 }
        );
      }
    }

    // Update user fields
    const userData: Record<string, unknown> = {};
    if (name !== undefined) userData.name = name;
    if (email !== undefined) userData.email = email;

    if (Object.keys(userData).length > 0) {
      await db.user.update({ where: { id }, data: userData });
    }

    // Update profile fields
    const profileData: Record<string, unknown> = {};
    if (phone !== undefined) profileData.phone = phone;
    if (relationship !== undefined) profileData.relationship = relationship;

    if (Object.keys(profileData).length > 0) {
      await db.parentProfile.upsert({
        where: { userId: id },
        update: profileData,
        create: { userId: id, ...profileData },
      });
    }

    // Update student links if provided
    if (studentIds !== undefined) {
      await db.parentStudent.deleteMany({ where: { parentId: id } });
      if (studentIds.length > 0) {
        await db.parentStudent.createMany({
          data: studentIds.map((studentId: string) => ({
            parentId: id,
            studentId,
          })),
        });
      }
    }

    // Return updated parent
    const updated = await db.user.findUnique({
      where: { id },
      include: {
        parentProfile: true,
        linkedStudents: {
          include: {
            student: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Parent PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const parent = await db.user.findUnique({
      where: { id, role: "PARENT" },
    });
    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    await db.$transaction([
      db.parentStudent.deleteMany({ where: { parentId: id } }),
      db.meetingParticipant.deleteMany({ where: { userId: id } }),
      db.message.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } }),
      db.document.deleteMany({ where: { userId: id } }),
      db.notification.deleteMany({ where: { userId: id } }),
      db.parentProfile.deleteMany({ where: { userId: id } }),
      db.user.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Parent DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
