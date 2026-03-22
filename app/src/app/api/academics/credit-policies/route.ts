import { NextRequest, NextResponse } from "next/server"
import { withAuth, withRole } from "@/lib/api-middleware"
import { db } from "@/lib/db"

export const GET = withAuth(async (_session, request: NextRequest) => {
  const { searchParams } = request.nextUrl
  const collegeName = searchParams.get("collegeName")
  const courseType = searchParams.get("courseType")
  const courseName = searchParams.get("courseName")

  // Build filter
  const where: Record<string, unknown> = {}

  if (collegeName) {
    where.collegeName = {
      contains: collegeName,
      mode: "insensitive",
    }
  }
  if (courseType) {
    where.courseType = courseType
  }
  if (courseName) {
    where.courseName = {
      contains: courseName,
      mode: "insensitive",
    }
  }

  const policies = await db.collegeCreditPolicy.findMany({
    where,
    orderBy: [{ collegeName: "asc" }, { courseName: "asc" }],
  })

  return NextResponse.json(policies)
})

export const POST = withRole("ADMIN", async (_session, request: NextRequest) => {
  const body = await request.json()

  const {
    collegeId,
    collegeName,
    courseType,
    courseName,
    minScore,
    creditsAwarded,
    equivalentCourse,
    notes,
  } = body

  if (!collegeName || !courseType || !courseName) {
    return NextResponse.json(
      { error: "collegeName, courseType, and courseName are required" },
      { status: 400 }
    )
  }

  const policy = await db.collegeCreditPolicy.create({
    data: {
      collegeId: collegeId || null,
      collegeName,
      courseType,
      courseName,
      minScore: minScore ?? null,
      creditsAwarded: creditsAwarded ?? null,
      equivalentCourse: equivalentCourse || null,
      notes: notes || null,
    },
  })

  return NextResponse.json(policy, { status: 201 })
})
