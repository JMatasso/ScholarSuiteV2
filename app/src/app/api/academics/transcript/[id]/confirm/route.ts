import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"
import type { CourseType, CourseStatus } from "@/generated/prisma/client"

interface CourseInput {
  name: string
  year: number
  type?: string
  credits?: number
  semester?: string
  grade?: string
  status?: string
  apScore?: number
  ibScore?: number
  subject?: string
}

const YEAR_LABELS: Record<number, string> = {
  9: "Freshman",
  10: "Sophomore",
  11: "Junior",
  12: "Senior",
}

export const POST = withAuth(async (session, request: NextRequest) => {
  // Extract id from the URL: /api/academics/transcript/[id]/confirm
  const segments = request.nextUrl.pathname.split("/")
  const confirmIdx = segments.indexOf("confirm")
  const id = segments[confirmIdx - 1]

  // Verify the transcript upload exists and belongs to user
  const upload = await db.transcriptUpload.findUnique({
    where: { id },
  })

  if (!upload || upload.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (upload.status !== "REVIEW") {
    return NextResponse.json(
      { error: "Transcript must be in REVIEW status to confirm" },
      { status: 400 }
    )
  }

  const body = await request.json()
  const {
    courses,
    gpa,
    weightedGpa,
    classRank,
    classSize,
    weightedGpaScale,
  } = body as {
    courses: CourseInput[]
    gpa?: number
    weightedGpa?: number
    classRank?: string
    classSize?: string
    weightedGpaScale?: string
  }

  if (!courses || !Array.isArray(courses)) {
    return NextResponse.json(
      { error: "courses array is required" },
      { status: 400 }
    )
  }

  let coursesCreated = 0
  let coursesUpdated = 0

  // Group courses by year
  const coursesByYear = new Map<number, CourseInput[]>()
  for (const course of courses) {
    const year = course.year
    if (!coursesByYear.has(year)) {
      coursesByYear.set(year, [])
    }
    coursesByYear.get(year)!.push(course)
  }

  // Process each year
  for (const [year, yearCourses] of coursesByYear) {
    // Upsert the academic year
    const academicYear = await db.academicYear.upsert({
      where: {
        userId_year: {
          userId: session.user.id,
          year,
        },
      },
      update: {},
      create: {
        userId: session.user.id,
        year,
        label: YEAR_LABELS[year] || `Grade ${year}`,
      },
      include: { courses: true },
    })

    // Process each course
    for (const course of yearCourses) {
      // Check if a course with the same name already exists in this year
      const existingCourse = academicYear.courses.find(
        (c) => c.name.toLowerCase() === course.name.toLowerCase()
      )

      if (existingCourse) {
        // Update existing course
        await db.course.update({
          where: { id: existingCourse.id },
          data: {
            type: (course.type || existingCourse.type) as CourseType,
            credits: course.credits ?? existingCourse.credits,
            semester: course.semester || existingCourse.semester,
            grade: course.grade || existingCourse.grade,
            status: (course.status || existingCourse.status) as CourseStatus,
            subject: course.subject || existingCourse.subject,
            apScore: course.apScore ?? existingCourse.apScore,
            ibScore: course.ibScore ?? existingCourse.ibScore,
          },
        })
        coursesUpdated++
      } else {
        // Create new course
        await db.course.create({
          data: {
            academicYearId: academicYear.id,
            name: course.name,
            type: (course.type || "REGULAR") as CourseType,
            credits: course.credits ?? 1.0,
            semester: course.semester || null,
            grade: course.grade || null,
            status: (course.status || "COMPLETED") as CourseStatus,
            subject: course.subject || null,
            apScore: course.apScore || null,
            ibScore: course.ibScore || null,
          },
        })
        coursesCreated++
      }
    }
  }

  // Update StudentProfile with GPA and rank info
  const profileUpdate: Record<string, unknown> = {}
  if (gpa !== undefined) profileUpdate.gpa = gpa
  if (classRank !== undefined) profileUpdate.classRank = classRank
  if (classSize !== undefined) profileUpdate.classSize = classSize
  if (weightedGpaScale !== undefined)
    profileUpdate.weightedGpaScale = weightedGpaScale

  if (Object.keys(profileUpdate).length > 0) {
    await db.studentProfile.updateMany({
      where: { userId: session.user.id },
      data: profileUpdate,
    })
  }

  // Update transcript upload status
  await db.transcriptUpload.update({
    where: { id },
    data: { status: "CONFIRMED" },
  })

  return NextResponse.json({
    success: true,
    coursesCreated,
    coursesUpdated,
  })
})
