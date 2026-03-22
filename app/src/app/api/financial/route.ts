import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { SemesterType } from "@/generated/prisma/client";

/**
 * Build default semester data from a college's cost fields.
 * Creates 8 semesters (Fall/Spring × 4 years).
 * Tuition and room/board are per-year figures in the DB, so we split by 2.
 */
function buildSemestersFromCollege(college: {
  inStateTuition?: number | null;
  outOfStateTuition?: number | null;
  roomAndBoard?: number | null;
  booksSupplies?: number | null;
}, studentState?: string | null, collegeState?: string | null) {
  // Use in-state tuition if student's state matches the college's state, otherwise out-of-state
  const isInState = studentState && collegeState && studentState.toLowerCase() === collegeState.toLowerCase();
  const yearlyTuition = (isInState ? college.inStateTuition : college.outOfStateTuition)
    ?? college.inStateTuition ?? college.outOfStateTuition ?? 0;
  const yearlyRoomBoard = college.roomAndBoard ?? 0;
  const yearlyBooks = college.booksSupplies ?? 0;

  const semesterTuition = Math.round(yearlyTuition / 2);
  const semesterHousing = Math.round((yearlyRoomBoard * 0.6) / 2); // ~60% housing
  const semesterFood = Math.round((yearlyRoomBoard * 0.4) / 2);    // ~40% food
  const semesterBooks = Math.round(yearlyBooks / 2);

  const years = ["Freshman", "Sophomore", "Junior", "Senior"];
  const terms: Array<{ label: string; type: "FALL" | "SPRING" }> = [
    { label: "Fall", type: "FALL" },
    { label: "Spring", type: "SPRING" },
  ];

  let order = 0;
  return years.flatMap((year) =>
    terms.map((term) => ({
      name: `${year} ${term.label}`,
      type: term.type,
      order: order++,
      isCustom: false,
      tuition: semesterTuition,
      housing: semesterHousing,
      food: semesterFood,
      transportation: 0,
      books: semesterBooks,
      personal: 0,
      other: 0,
    }))
  );
}

/**
 * Build blank 8-semester plan (all costs zero) for manual entry.
 */
function buildBlankSemesters() {
  const years = ["Freshman", "Sophomore", "Junior", "Senior"];
  const terms: Array<{ label: string; type: "FALL" | "SPRING" }> = [
    { label: "Fall", type: "FALL" },
    { label: "Spring", type: "SPRING" },
  ];

  let order = 0;
  return years.flatMap((year) =>
    terms.map((term) => ({
      name: `${year} ${term.label}`,
      type: term.type,
      order: order++,
      isCustom: false,
      tuition: 0,
      housing: 0,
      food: 0,
      transportation: 0,
      books: 0,
      personal: 0,
      other: 0,
    }))
  );
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const role = (session.user as { role: string }).role;

    let userId = session.user.id;

    if (studentId && role === "ADMIN") {
      userId = studentId;
    } else if (studentId && role === "PARENT") {
      // Parents can only view their linked students' financial data
      const link = await db.parentStudent.findFirst({
        where: { parentId: session.user.id, studentId },
      });
      if (!link) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      userId = studentId;
    }

    // Check for existing plan
    let plan = await db.financialPlan.findFirst({
      where: { userId },
      include: {
        semesters: {
          include: { incomeSources: true },
          orderBy: { order: "asc" },
        },
      },
    });

    // Auto-generate plan if none exists and the student has a committed or accepted college with cost data
    if (!plan) {
      const committedApp = await db.collegeApplication.findFirst({
        where: {
          userId,
          OR: [
            { committed: true },
            { status: "ACCEPTED" },
          ],
        },
        include: {
          college: {
            select: {
              inStateTuition: true,
              outOfStateTuition: true,
              roomAndBoard: true,
              booksSupplies: true,
              state: true,
            },
          },
        },
        orderBy: [
          { committed: "desc" },  // committed first
          { updatedAt: "desc" },
        ],
      });

      if (committedApp?.college) {
        const college = committedApp.college;
        const hasCostData = college.inStateTuition != null || college.outOfStateTuition != null;

        if (hasCostData) {
          // Get student's state for in-state vs out-of-state determination
          const profile = await db.studentProfile.findUnique({
            where: { userId },
            select: { state: true },
          });

          const semesters = buildSemestersFromCollege(college, profile?.state, college.state);

          plan = await db.financialPlan.create({
            data: {
              userId,
              semesters: { create: semesters },
            },
            include: {
              semesters: {
                include: { incomeSources: true },
                orderBy: { order: "asc" },
              },
            },
          });
        }
      }
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error fetching financial plan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    // Delete existing plan if present (switching schools or recreating)
    await db.financialPlan.deleteMany({ where: { userId: session.user.id } });

    let semesterData: Array<{
      name: string;
      type?: SemesterType;
      order?: number;
      isCustom?: boolean;
      tuition: number;
      housing: number;
      food: number;
      transportation: number;
      books: number;
      personal: number;
      other: number;
    }>;

    if (data.collegeId) {
      // Create plan from a specific college's cost data
      const college = await db.college.findUnique({
        where: { id: data.collegeId },
        select: {
          inStateTuition: true,
          outOfStateTuition: true,
          roomAndBoard: true,
          booksSupplies: true,
          state: true,
        },
      });
      if (!college) {
        return NextResponse.json({ error: "College not found" }, { status: 404 });
      }

      const profile = await db.studentProfile.findUnique({
        where: { userId: session.user.id },
        select: { state: true },
      });

      semesterData = buildSemestersFromCollege(college, profile?.state, college.state);
    } else if (data.blank) {
      // Create a blank 8-semester plan with zero costs
      semesterData = buildBlankSemesters();
    } else if (data.semesters) {
      semesterData = data.semesters.map(
        (s: {
          name: string;
          tuition?: number;
          housing?: number;
          food?: number;
          transportation?: number;
          books?: number;
          personal?: number;
          other?: number;
        }) => ({
          name: s.name,
          tuition: s.tuition || 0,
          housing: s.housing || 0,
          food: s.food || 0,
          transportation: s.transportation || 0,
          books: s.books || 0,
          personal: s.personal || 0,
          other: s.other || 0,
        })
      );
    } else {
      semesterData = buildBlankSemesters();
    }

    const plan = await db.financialPlan.create({
      data: {
        userId: session.user.id,
        semesters: { create: semesterData },
      },
      include: {
        semesters: {
          include: { incomeSources: true },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Error creating financial plan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
