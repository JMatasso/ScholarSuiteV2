import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"

export const PATCH = withAuth(async (session, request: NextRequest) => {
  const id = request.nextUrl.pathname.split("/").pop()!
  const data = await request.json()

  // Verify the course exists and belongs to the user
  const existing = await db.course.findUnique({
    where: { id },
    include: { academicYear: { select: { userId: true } } },
  })

  if (!existing || existing.academicYear.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const course = await db.course.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.credits !== undefined && { credits: data.credits }),
      ...(data.semester !== undefined && { semester: data.semester }),
      ...(data.grade !== undefined && { grade: data.grade }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.subject !== undefined && { subject: data.subject }),
      ...(data.apScore !== undefined && { apScore: data.apScore }),
      ...(data.ibScore !== undefined && { ibScore: data.ibScore }),
    },
  })

  return NextResponse.json(course)
})

export const DELETE = withAuth(async (session, request: NextRequest) => {
  const id = request.nextUrl.pathname.split("/").pop()!

  // Verify the course exists and belongs to the user
  const existing = await db.course.findUnique({
    where: { id },
    include: { academicYear: { select: { userId: true } } },
  })

  if (!existing || existing.academicYear.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await db.course.delete({ where: { id } })

  return NextResponse.json({ success: true })
})
