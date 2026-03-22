import { NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"

const GRADE_POINTS: Record<string, number> = {
  "A+": 4.0,
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  "D+": 1.3,
  D: 1.0,
  "D-": 0.7,
  F: 0.0,
}

function getWeightBoost(
  courseType: string,
  scale: string | null
): number {
  if (!scale) return 0
  const isHonors = courseType === "HONORS"
  const isAdvanced =
    courseType === "AP" || courseType === "IB" || courseType === "DUAL_CREDIT"

  if (scale === "6.0") {
    if (isHonors) return 1.0
    if (isAdvanced) return 2.0
  } else {
    // default to 5.0 scale
    if (isHonors) return 0.5
    if (isAdvanced) return 1.0
  }
  return 0
}

export const GET = withAuth(async (session) => {
  // Fetch student profile for weighted scale
  const profile = await db.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { weightedGpaScale: true },
  })

  const weightedScale = profile?.weightedGpaScale || "5.0"

  // Fetch all academic years with courses
  const academicYears = await db.academicYear.findMany({
    where: { userId: session.user.id },
    include: { courses: true },
    orderBy: { year: "asc" },
  })

  const allCourses = academicYears.flatMap((ay) => ay.courses)
  const completedCourses = allCourses.filter((c) => c.status === "COMPLETED")
  const plannedOrInProgress = allCourses.filter(
    (c) => c.status === "PLANNED" || c.status === "IN_PROGRESS"
  )
  const apCourses = allCourses.filter((c) => c.type === "AP")
  const honorsCourses = allCourses.filter((c) => c.type === "HONORS")

  // Calculate cumulative GPA from completed courses
  let totalUnweightedPoints = 0
  let totalWeightedPoints = 0
  let totalCompletedCredits = 0
  let totalCredits = 0

  for (const course of allCourses) {
    totalCredits += course.credits
  }

  for (const course of completedCourses) {
    if (!course.grade || !(course.grade in GRADE_POINTS)) continue
    const basePoints = GRADE_POINTS[course.grade]
    const boost = getWeightBoost(course.type, weightedScale)

    totalUnweightedPoints += basePoints * course.credits
    totalWeightedPoints += (basePoints + boost) * course.credits
    totalCompletedCredits += course.credits
  }

  const cumulativeUnweighted =
    totalCompletedCredits > 0
      ? Math.round((totalUnweightedPoints / totalCompletedCredits) * 100) / 100
      : 0
  const cumulativeWeighted =
    totalCompletedCredits > 0
      ? Math.round((totalWeightedPoints / totalCompletedCredits) * 100) / 100
      : 0

  // Projected GPA: include in-progress and planned courses (assume current grade or estimate)
  let projUnweightedPoints = totalUnweightedPoints
  let projWeightedPoints = totalWeightedPoints
  let projCredits = totalCompletedCredits

  for (const course of plannedOrInProgress) {
    if (course.grade && course.grade in GRADE_POINTS) {
      const basePoints = GRADE_POINTS[course.grade]
      const boost = getWeightBoost(course.type, weightedScale)
      projUnweightedPoints += basePoints * course.credits
      projWeightedPoints += (basePoints + boost) * course.credits
      projCredits += course.credits
    }
  }

  const projectedUnweighted =
    projCredits > 0
      ? Math.round((projUnweightedPoints / projCredits) * 100) / 100
      : cumulativeUnweighted
  const projectedWeighted =
    projCredits > 0
      ? Math.round((projWeightedPoints / projCredits) * 100) / 100
      : cumulativeWeighted

  // GPA by year
  const byYear = academicYears.map((ay) => {
    let uw = 0
    let w = 0
    let cr = 0

    for (const course of ay.courses) {
      if (course.status !== "COMPLETED" || !course.grade) continue
      if (!(course.grade in GRADE_POINTS)) continue
      const base = GRADE_POINTS[course.grade]
      const boost = getWeightBoost(course.type, weightedScale)
      uw += base * course.credits
      w += (base + boost) * course.credits
      cr += course.credits
    }

    return {
      year: ay.year,
      label: ay.label,
      unweighted: cr > 0 ? Math.round((uw / cr) * 100) / 100 : 0,
      weighted: cr > 0 ? Math.round((w / cr) * 100) / 100 : 0,
      credits: ay.courses.reduce((sum, c) => sum + c.credits, 0),
    }
  })

  // Average AP score
  const apScores = apCourses
    .filter((c) => c.apScore != null)
    .map((c) => c.apScore!)
  const averageApScore =
    apScores.length > 0
      ? Math.round((apScores.reduce((a, b) => a + b, 0) / apScores.length) * 10) / 10
      : null

  return NextResponse.json({
    cumulative: {
      unweighted: cumulativeUnweighted,
      weighted: cumulativeWeighted,
      totalCredits,
      completedCredits: totalCompletedCredits,
    },
    projected: {
      unweighted: projectedUnweighted,
      weighted: projectedWeighted,
    },
    byYear,
    weightedScale,
    totalCourses: allCourses.length,
    completedCourses: completedCourses.length,
    apCourses: apCourses.length,
    honorsCourses: honorsCourses.length,
    averageApScore,
  })
})
