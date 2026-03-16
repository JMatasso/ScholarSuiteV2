import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { withRole } from "@/lib/api-middleware"

export const GET = withRole("ADMIN", async (_session, request) => {
  const id = request.nextUrl.pathname.split("/").at(-1)!

  const cohort = await db.cohort.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
              role: true,
              studentProfile: {
                select: {
                  gradeLevel: true,
                  graduationYear: true,
                  highSchool: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!cohort) {
    return NextResponse.json({ error: "Cohort not found" }, { status: 404 })
  }

  return NextResponse.json(cohort)
})

export const PUT = withRole("ADMIN", async (_session, request) => {
  const id = request.nextUrl.pathname.split("/").at(-1)!
  const data = await request.json()

  const cohort = await db.cohort.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      color: data.color,
    },
  })

  return NextResponse.json(cohort)
})

export const DELETE = withRole("ADMIN", async (_session, request) => {
  const id = request.nextUrl.pathname.split("/").at(-1)!

  await db.cohort.delete({ where: { id } })

  return NextResponse.json({ success: true })
})
