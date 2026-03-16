import { NextRequest, NextResponse } from "next/server"
import { withRole } from "@/lib/api-middleware"
import { db } from "@/lib/db"

export const GET = withRole("ADMIN", async (_session, request: NextRequest) => {
  const id = request.nextUrl.pathname.split("/").pop()!

  const school = await db.school.findUnique({
    where: { id },
    include: {
      students: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          studentProfile: {
            select: {
              gpa: true,
              gradeLevel: true,
              graduationYear: true,
              status: true,
            },
          },
        },
        orderBy: { name: "asc" },
      },
      _count: { select: { students: true } },
    },
  })

  if (!school) {
    return NextResponse.json({ error: "School not found" }, { status: 404 })
  }

  return NextResponse.json(school)
})

export const PUT = withRole("ADMIN", async (_session, request: NextRequest) => {
  const id = request.nextUrl.pathname.split("/").pop()!
  const body = await request.json()

  const existing = await db.school.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "School not found" }, { status: 404 })
  }

  const { name, address, city, state, zipCode, phone, email, website, logoUrl } = body

  const school = await db.school.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(address !== undefined && { address }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(zipCode !== undefined && { zipCode }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(website !== undefined && { website }),
      ...(logoUrl !== undefined && { logoUrl }),
    },
  })

  return NextResponse.json(school)
})

export const DELETE = withRole("ADMIN", async (_session, request: NextRequest) => {
  const id = request.nextUrl.pathname.split("/").pop()!

  const existing = await db.school.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "School not found" }, { status: 404 })
  }

  // Detach all students from this school first
  await db.user.updateMany({
    where: { schoolId: id },
    data: { schoolId: null },
  })

  await db.school.delete({ where: { id } })

  return NextResponse.json({ success: true })
})
