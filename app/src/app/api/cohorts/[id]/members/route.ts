import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { withRole } from "@/lib/api-middleware"

export const POST = withRole("ADMIN", async (_session, request) => {
  const segments = request.nextUrl.pathname.split("/")
  const cohortIdIndex = segments.indexOf("cohorts") + 1
  const cohortId = segments[cohortIdIndex]

  const { userIds } = (await request.json()) as { userIds: string[] }

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json(
      { error: "userIds must be a non-empty array" },
      { status: 400 }
    )
  }

  const result = await db.cohortMember.createMany({
    data: userIds.map((userId) => ({ cohortId, userId })),
    skipDuplicates: true,
  })

  return NextResponse.json({ added: result.count })
})

export const DELETE = withRole("ADMIN", async (_session, request) => {
  const segments = request.nextUrl.pathname.split("/")
  const cohortIdIndex = segments.indexOf("cohorts") + 1
  const cohortId = segments[cohortIdIndex]

  const { userId } = (await request.json()) as { userId: string }

  if (!userId) {
    return NextResponse.json(
      { error: "userId is required" },
      { status: 400 }
    )
  }

  await db.cohortMember.delete({
    where: {
      cohortId_userId: { cohortId, userId },
    },
  })

  return NextResponse.json({ success: true })
})
