import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"

// PATCH — update a GPA plan
export const PATCH = withAuth(async (session, request: NextRequest) => {
  const segments = request.nextUrl.pathname.split("/")
  const id = segments[segments.length - 1]

  const existing = await db.gpaPlan.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = await request.json()
  const { name, grades, resultUw, resultW } = body as {
    name?: string
    grades?: Record<string, string>
    resultUw?: number
    resultW?: number
  }

  const plan = await db.gpaPlan.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(grades !== undefined && { grades }),
      ...(resultUw !== undefined && { resultUw }),
      ...(resultW !== undefined && { resultW }),
    },
  })

  return NextResponse.json(plan)
})

// DELETE — remove a GPA plan
export const DELETE = withAuth(async (session, request: NextRequest) => {
  const segments = request.nextUrl.pathname.split("/")
  const id = segments[segments.length - 1]

  const existing = await db.gpaPlan.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await db.gpaPlan.delete({ where: { id } })
  return NextResponse.json({ success: true })
})
