import { NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"

export const GET = withAuth(async (session) => {
  const role = session.user.role

  let studentIds: string[] = []

  if (role === "PARENT") {
    const links = await db.parentStudent.findMany({
      where: { parentId: session.user.id },
      select: { studentId: true },
    })
    studentIds = links.map((l) => l.studentId)
  } else if (role === "ADMIN") {
    // Return events for assigned students, or all if none assigned
    const assigned = await db.studentProfile.findMany({
      where: { assignedAdminId: session.user.id },
      select: { userId: true },
    })
    if (assigned.length > 0) {
      studentIds = assigned.map((s) => s.userId)
    } else {
      // All students
      const all = await db.user.findMany({
        where: { role: "STUDENT" },
        select: { id: true },
      })
      studentIds = all.map((s) => s.id)
    }
  } else if (role === "STUDENT") {
    studentIds = [session.user.id]
  }

  if (studentIds.length === 0) {
    return NextResponse.json([])
  }

  const events = await db.activityEvent.findMany({
    where: { studentId: { in: studentIds } },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return NextResponse.json(events)
})
