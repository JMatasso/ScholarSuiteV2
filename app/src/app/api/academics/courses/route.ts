import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"
import type { CourseType, CourseStatus } from "@/generated/prisma/client"

export const GET = withAuth(async (session) => {
  const academicYears = await db.academicYear.findMany({
    where: { userId: session.user.id },
    include: { courses: { orderBy: { name: "asc" } } },
    orderBy: { year: "asc" },
  })

  return NextResponse.json(academicYears)
})

export const POST = withAuth(async (session, request: NextRequest) => {
  const body = await request.json()
  const { year, label, courses } = body

  if (!year || !label) {
    return NextResponse.json(
      { error: "year and label are required" },
      { status: 400 }
    )
  }

  // Upsert the academic year
  const academicYear = await db.academicYear.upsert({
    where: {
      userId_year: {
        userId: session.user.id,
        year,
      },
    },
    update: { label },
    create: {
      userId: session.user.id,
      year,
      label,
    },
  })

  // Create courses if provided
  if (courses && Array.isArray(courses) && courses.length > 0) {
    await db.course.createMany({
      data: courses.map(
        (c: {
          name: string
          type?: string
          credits?: number
          semester?: string
          grade?: string
          status?: string
          subject?: string
          apScore?: number
          ibScore?: number
        }) => ({
          academicYearId: academicYear.id,
          name: c.name,
          type: (c.type || "REGULAR") as CourseType,
          credits: c.credits ?? 1.0,
          semester: c.semester || null,
          grade: c.grade || null,
          status: (c.status || "PLANNED") as CourseStatus,
          subject: c.subject || null,
          apScore: c.apScore || null,
          ibScore: c.ibScore || null,
        })
      ),
    })
  }

  // Return the academic year with its courses
  const result = await db.academicYear.findUnique({
    where: { id: academicYear.id },
    include: { courses: { orderBy: { name: "asc" } } },
  })

  return NextResponse.json(result, { status: 201 })
})
