import { NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"
import { calculateGpa, type CourseInput, type WeightedScale } from "@/lib/gpa"
import { computeJourneyStage } from "@/lib/journey"

export const GET = withAuth(async (session) => {
  const userId = session.user.id

  const [
    profile,
    collegeAppsByStatus,
    scholarshipAppsByStatus,
    scholarshipAwarded,
    committedCollege,
    academicYears,
  ] = await Promise.all([
    // 1. Student profile
    db.studentProfile.findUnique({
      where: { userId },
      select: {
        gpa: true,
        gpaType: true,
        weightedGpaScale: true,
        classRank: true,
        classSize: true,
        gradeLevel: true,
        graduationYear: true,
        graduationMonth: true,
        satScore: true,
        actScore: true,
        journeyStage: true,
        intendedMajor: true,
        collegeJourneyStage: true,
        committedCollegeName: true,
        doneApplying: true,
      },
    }),

    // 2. College applications grouped by status
    db.collegeApplication.groupBy({
      by: ["status"],
      where: { userId },
      _count: { status: true },
    }),

    // 3. Scholarship applications grouped by status
    db.scholarshipApplication.groupBy({
      by: ["status"],
      where: { userId },
      _count: { status: true },
    }),

    // 4. Total awarded amount
    db.scholarshipApplication.aggregate({
      where: { userId, status: "AWARDED" },
      _sum: { amountAwarded: true },
    }),

    // 5. Committed college
    db.collegeApplication.findFirst({
      where: { userId, committed: true },
      select: { universityName: true },
    }),

    // 6. Academic courses for GPA calculation
    db.academicYear.findMany({
      where: { userId },
      include: { courses: true },
      orderBy: { year: "asc" },
    }),
  ])

  // --- Calculate GPA from courses ---
  const allCourses: CourseInput[] = academicYears.flatMap((ay) =>
    ay.courses.map((c) => ({
      grade: c.grade,
      credits: c.credits,
      type: c.type as CourseInput["type"],
      status: c.status as CourseInput["status"],
    }))
  )

  const weightedScale: WeightedScale =
    (profile?.weightedGpaScale as WeightedScale) || "5.0"
  const gpaResult = calculateGpa(allCourses, weightedScale)

  // --- College apps summary ---
  const collegeStatusMap: Record<string, number> = {}
  for (const row of collegeAppsByStatus) {
    collegeStatusMap[row.status] = row._count.status
  }
  const collegeTotal = Object.values(collegeStatusMap).reduce(
    (sum, n) => sum + n,
    0
  )

  // --- Scholarship apps summary ---
  const scholarshipStatusMap: Record<string, number> = {}
  for (const row of scholarshipAppsByStatus) {
    scholarshipStatusMap[row.status] = row._count.status
  }
  const scholarshipTotal = Object.values(scholarshipStatusMap).reduce(
    (sum, n) => sum + n,
    0
  )
  const scholarshipActive =
    (scholarshipStatusMap["IN_PROGRESS"] ?? 0) +
    (scholarshipStatusMap["SUBMITTED"] ?? 0)

  // --- Academic summary ---
  const totalCourses = allCourses.length
  const apCourses = allCourses.filter((c) => c.type === "AP").length
  const honorsCourses = allCourses.filter((c) => c.type === "HONORS").length
  const completedCredits = allCourses
    .filter((c) => c.status === "COMPLETED")
    .reduce((sum, c) => sum + c.credits, 0)

  // --- Current semester string ---
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const semester = month >= 1 && month <= 6 ? `Spring ${year}` : `Fall ${year}`

  return NextResponse.json({
    gradeLevel: profile?.gradeLevel ?? null,
    graduationYear: profile?.graduationYear ?? null,
    graduationMonth: profile?.graduationMonth ?? null,
    journeyStage: profile?.graduationYear
      ? computeJourneyStage(profile.graduationYear, profile.graduationMonth)
      : (profile?.journeyStage ?? null),
    semester,
    gpa: {
      unweighted: gpaResult.unweighted,
      weighted: gpaResult.weighted,
      scale: weightedScale,
    },
    classRank: profile?.classRank ?? null,
    classSize: profile?.classSize ?? null,
    satScore: profile?.satScore ?? null,
    actScore: profile?.actScore ?? null,
    intendedMajor: profile?.intendedMajor ?? null,
    collegeApps: {
      total: collegeTotal,
      submitted: collegeStatusMap["SUBMITTED"] ?? 0,
      accepted: collegeStatusMap["ACCEPTED"] ?? 0,
      committed: committedCollege?.universityName ?? null,
    },
    scholarshipApps: {
      total: scholarshipTotal,
      active: scholarshipActive,
      awarded: scholarshipStatusMap["AWARDED"] ?? 0,
      totalAwarded: scholarshipAwarded._sum.amountAwarded ?? 0,
    },
    academicSummary: {
      totalCourses,
      apCourses,
      honorsCourses,
      completedCredits,
    },
  })
})
