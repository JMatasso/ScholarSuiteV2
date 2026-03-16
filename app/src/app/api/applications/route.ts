import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as { role: string }).role;

    let where: object = { userId: session.user.id };
    if (role === "ADMIN") {
      where = {};
    } else if (role === "PARENT") {
      // Fetch linked student IDs for this parent
      const links = await db.parentStudent.findMany({
        where: { parentId: session.user.id },
        select: { studentId: true },
      });
      const studentIds = links.map((l) => l.studentId);
      where = { userId: { in: studentIds } };
    }

    const applications = await db.scholarshipApplication.findMany({
      where,
      include: {
        scholarship: true,
        checklists: true,
        essays: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const role = (session.user as { role: string }).role;

    if (!data.scholarshipId || typeof data.scholarshipId !== "string") {
      return NextResponse.json({ error: "scholarshipId is required" }, { status: 400 });
    }

    // Verify scholarship exists and is active
    const scholarship = await db.scholarship.findUnique({
      where: { id: data.scholarshipId },
    });
    if (!scholarship) {
      return NextResponse.json({ error: "Scholarship not found" }, { status: 404 });
    }

    // Determine which user to create the application for
    const targetUserId = (role === "ADMIN" && data.userId) ? data.userId : session.user.id;

    // Check for duplicate
    const existing = await db.scholarshipApplication.findFirst({
      where: { userId: targetUserId, scholarshipId: data.scholarshipId },
    });
    if (existing) {
      return NextResponse.json({ error: "Application already exists for this scholarship", existing }, { status: 409 });
    }

    const application = await db.scholarshipApplication.create({
      data: {
        userId: targetUserId,
        scholarshipId: data.scholarshipId,
        status: "NOT_STARTED",
      },
      include: { scholarship: true },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error("Error creating application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
