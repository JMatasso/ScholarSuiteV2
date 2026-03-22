import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { computeJourneyStage } from "@/lib/journey";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const student = await db.user.findUnique({
      where: { id, role: "STUDENT" },
      include: {
        studentProfile: {
          include: {
            assignedAdmin: {
              select: { id: true, name: true, image: true },
            },
          },
        },
        school: true,
        scholarshipApps: {
          include: { scholarship: true },
          orderBy: { createdAt: "desc" },
        },
        tasks: {
          orderBy: [{ phase: "asc" }, { dueDate: "asc" }],
        },
        collegeApps: {
          orderBy: { createdAt: "desc" },
        },
        essays: {
          orderBy: { updatedAt: "desc" },
        },
        documents: {
          orderBy: { createdAt: "desc" },
        },
        financialPlans: {
          include: {
            semesters: { include: { incomeSources: true } },
          },
        },
        linkedParents: {
          include: {
            parent: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify user exists and is a student
    const student = await db.user.findUnique({
      where: { id, role: "STUDENT" },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Delete in order: related records first, then user (cascade handles profile)
    await db.$transaction([
      db.parentStudent.deleteMany({ where: { studentId: id } }),
      db.scholarshipApplication.deleteMany({ where: { userId: id } }),
      db.task.deleteMany({ where: { userId: id } }),
      db.essay.deleteMany({ where: { userId: id } }),
      db.activity.deleteMany({ where: { userId: id } }),
      db.meetingParticipant.deleteMany({ where: { userId: id } }),
      db.message.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } }),
      db.document.deleteMany({ where: { userId: id } }),
      db.notification.deleteMany({ where: { userId: id } }),
      db.studentProfile.deleteMany({ where: { userId: id } }),
      db.financialPlan.deleteMany({ where: { userId: id } }),
      db.user.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    // Handle admin assignment
    if (data.assignedAdminId !== undefined) {
      // Validate admin exists if not null
      if (data.assignedAdminId !== null) {
        const admin = await db.user.findFirst({
          where: { id: data.assignedAdminId, role: "ADMIN" },
        });
        if (!admin) {
          return NextResponse.json({ error: "Admin not found" }, { status: 404 });
        }
      }
      await db.studentProfile.upsert({
        where: { userId: id },
        update: { assignedAdminId: data.assignedAdminId },
        create: { userId: id, assignedAdminId: data.assignedAdminId },
      });
    }

    if (data.profile) {
      const p = data.profile;
      const profileUpdate: Record<string, unknown> = {};

      // String fields
      const stringFields = [
        "firstName", "lastName", "phone", "address", "city", "state", "zipCode",
        "county", "gpaType", "highSchool", "classRank", "classSize",
        "intendedMajor", "major2", "major3", "gender", "ethnicity", "citizenship",
        "militaryAffiliation", "disabilityStatus", "medicalConditions",
        "householdIncome", "financialSituation",
        "parent1Education", "parent1Profession", "parent1College",
        "parent2Education", "parent2Profession", "parent2College",
        "activities", "communityService", "leadershipRoles", "awards",
        "dreamSchools", "goals", "committedCollegeName",
      ];
      for (const f of stringFields) {
        if (p[f] !== undefined) profileUpdate[f] = p[f] || null;
      }

      // Date field
      if (p.dateOfBirth !== undefined) profileUpdate.dateOfBirth = p.dateOfBirth ? new Date(p.dateOfBirth) : null;

      // Float fields
      if (p.gpa !== undefined) profileUpdate.gpa = p.gpa ? parseFloat(p.gpa) : null;

      // Int fields
      const intFields = ["gradeLevel", "graduationYear", "graduationMonth", "satScore", "actScore"];
      for (const f of intFields) {
        if (p[f] !== undefined) profileUpdate[f] = p[f] ? parseInt(p[f]) : null;
      }

      // Boolean fields
      const boolFields = [
        "isFirstGen", "isPellEligible", "hasFinancialNeed",
        "interestedInLgbtScholarships", "parentsDivorced", "isDependentStudent",
        "doneApplying",
      ];
      for (const f of boolFields) {
        if (p[f] !== undefined) profileUpdate[f] = Boolean(p[f]);
      }

      // Enum fields
      if (p.status !== undefined) profileUpdate.status = p.status;
      if (p.postSecondaryPath !== undefined) profileUpdate.postSecondaryPath = p.postSecondaryPath || "COLLEGE";
      if (p.collegeJourneyStage !== undefined) profileUpdate.collegeJourneyStage = p.collegeJourneyStage || null;
      if (p.serviceTier !== undefined) profileUpdate.serviceTier = p.serviceTier || null;

      // Auto-calculate journey stage from graduation date if provided
      const gradYear = p.graduationYear ? parseInt(p.graduationYear) : undefined;
      const gradMonth = p.graduationMonth ? parseInt(p.graduationMonth) : undefined;
      if (gradYear) {
        profileUpdate.journeyStage = computeJourneyStage(gradYear, gradMonth);
      } else if (p.journeyStage !== undefined) {
        profileUpdate.journeyStage = p.journeyStage;
      }

      await db.studentProfile.upsert({
        where: { userId: id },
        update: profileUpdate,
        create: { userId: id, ...profileUpdate },
      });

      // Update user name if name fields changed
      if (p.firstName !== undefined || p.lastName !== undefined) {
        const existing = await db.studentProfile.findUnique({ where: { userId: id }, select: { firstName: true, lastName: true } });
        const first = p.firstName ?? existing?.firstName ?? "";
        const last = p.lastName ?? existing?.lastName ?? "";
        const fullName = [first, last].filter(Boolean).join(" ");
        if (fullName) {
          await db.user.update({ where: { id }, data: { name: fullName } });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
