import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createActivityEvent, notifyLinkedParents } from "@/lib/activity-events";

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
    const targetUserId = (role === "ADMIN" && data.userId) ? data.userId : session.user.id;

    let scholarship;

    if (data.scholarshipId) {
      // Adding an existing scholarship from the database
      scholarship = await db.scholarship.findUnique({
        where: { id: data.scholarshipId },
      });
      if (!scholarship) {
        return NextResponse.json({ error: "Scholarship not found" }, { status: 404 });
      }
    } else if (data.customScholarship) {
      // Creating a custom scholarship and adding it
      const cs = data.customScholarship;
      if (!cs.name || typeof cs.name !== "string") {
        return NextResponse.json({ error: "Scholarship name is required" }, { status: 400 });
      }
      scholarship = await db.scholarship.create({
        data: {
          name: cs.name.trim(),
          provider: cs.provider?.trim() || null,
          amount: cs.amount ? parseFloat(cs.amount) : null,
          deadline: cs.deadline ? new Date(cs.deadline) : null,
          url: cs.url?.trim() || null,
          description: cs.description?.trim() || null,
          isActive: true,
        },
      });
    } else {
      return NextResponse.json({ error: "scholarshipId or customScholarship is required" }, { status: 400 });
    }

    // Check for duplicate
    const existing = await db.scholarshipApplication.findFirst({
      where: { userId: targetUserId, scholarshipId: scholarship.id },
    });
    if (existing) {
      return NextResponse.json({ error: "Application already exists for this scholarship", existing }, { status: 409 });
    }

    const application = await db.scholarshipApplication.create({
      data: {
        userId: targetUserId,
        scholarshipId: scholarship.id,
        progress: "NOT_STARTED",
        status: "PENDING",
      },
      include: { scholarship: true },
    });

    // Fire activity event for new scholarship application
    createActivityEvent({
      studentId: targetUserId,
      type: "SCHOLARSHIP_APP_SUBMITTED",
      title: `Scholarship application started: ${scholarship.name}`,
      description: `Application for "${scholarship.name}" has been created.`,
      metadata: { applicationId: application.id, scholarshipName: scholarship.name },
    })
    notifyLinkedParents({
      studentId: targetUserId,
      title: "New Scholarship Application",
      message: `Your student started a scholarship application for "${scholarship.name}".`,
      link: "/parent/applications",
      type: "SCHOLARSHIP_APP_SUBMITTED",
    })

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error("Error creating application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
