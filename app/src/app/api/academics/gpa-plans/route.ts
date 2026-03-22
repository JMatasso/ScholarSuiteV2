import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"

// GET — list all saved GPA plans for the current user
export const GET = withAuth(async (session) => {
  const plans = await db.gpaPlan.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  })
  return NextResponse.json(plans)
})

// POST — create a new GPA plan
export const POST = withAuth(async (session, request: NextRequest) => {
  const body = await request.json()
  const { name, grades, resultUw, resultW } = body as {
    name: string
    grades: Record<string, string>
    resultUw?: number
    resultW?: number
  }

  if (!name?.trim()) {
    return NextResponse.json({ error: "Plan name is required" }, { status: 400 })
  }

  const plan = await db.gpaPlan.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      grades,
      resultUw: resultUw ?? null,
      resultW: resultW ?? null,
    },
  })

  return NextResponse.json(plan, { status: 201 })
})
