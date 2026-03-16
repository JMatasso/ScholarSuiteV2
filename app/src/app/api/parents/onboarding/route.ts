import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.parentProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        phone: true,
        relationship: true,
        notifyTasks: true,
        notifyDeadlines: true,
        notifyAwards: true,
        notifyMessages: true,
        tourComplete: true,
      },
    });

    if (!profile) {
      return NextResponse.json({});
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Parent onboarding GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if ((session.user as { role: string }).role !== "PARENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      phone,
      relationship,
      notifyTasks,
      notifyDeadlines,
      notifyAwards,
      notifyMessages,
    } = body;

    // Update user name if provided
    const fullName = [firstName, lastName].filter(Boolean).join(" ");
    if (fullName) {
      await db.user.update({
        where: { id: session.user.id },
        data: { name: fullName },
      });
    }

    // Upsert parent profile
    await db.parentProfile.upsert({
      where: { userId: session.user.id },
      update: {
        phone: phone || null,
        relationship: relationship || null,
        notifyTasks: notifyTasks ?? true,
        notifyDeadlines: notifyDeadlines ?? true,
        notifyAwards: notifyAwards ?? true,
        notifyMessages: notifyMessages ?? true,
        tourComplete: body.tourComplete ?? false,
      },
      create: {
        userId: session.user.id,
        phone: phone || null,
        relationship: relationship || null,
        notifyTasks: notifyTasks ?? true,
        notifyDeadlines: notifyDeadlines ?? true,
        notifyAwards: notifyAwards ?? true,
        notifyMessages: notifyMessages ?? true,
        tourComplete: body.tourComplete ?? false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Parent onboarding POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
