import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { withRole } from "@/lib/api-middleware"

export const POST = withRole("ADMIN", async (_session, request) => {
  const segments = request.nextUrl.pathname.split("/")
  const cohortIdIndex = segments.indexOf("cohorts") + 1
  const cohortId = segments[cohortIdIndex]

  const { title, content } = await request.json()

  if (!title || !content) {
    return NextResponse.json(
      { error: "title and content are required" },
      { status: 400 }
    )
  }

  // Create the announcement (targetRole null since it's cohort-targeted)
  const announcement = await db.announcement.create({
    data: {
      title,
      content,
      targetRole: null,
    },
  })

  // Fetch all member userIds
  const members = await db.cohortMember.findMany({
    where: { cohortId },
    select: { userId: true },
  })

  // Create a notification for each member
  if (members.length > 0) {
    await db.notification.createMany({
      data: members.map((m) => ({
        userId: m.userId,
        title,
        message: content.length > 200 ? content.slice(0, 200) + "..." : content,
        type: "ANNOUNCEMENT",
        link: "/student/tasks",
      })),
    })
  }

  return NextResponse.json(announcement, { status: 201 })
})
