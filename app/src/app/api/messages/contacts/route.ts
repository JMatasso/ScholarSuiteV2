import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

/**
 * GET /api/messages/contacts
 * Returns users the current user can message:
 * - Students: fellow cohort members + all ADMINs (counselors)
 * - Parents: their linked students + all ADMINs
 * - Admins: all users
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const role = (session.user as { role: string }).role

    if (role === "ADMIN") {
      // Admins can message anyone
      const users = await db.user.findMany({
        where: { id: { not: userId }, isActive: true },
        select: { id: true, name: true, image: true, role: true },
        orderBy: { name: "asc" },
      })
      return NextResponse.json(users)
    }

    if (role === "STUDENT") {
      // Get cohort members
      const cohortMemberships = await db.cohortMember.findMany({
        where: { userId },
        select: { cohortId: true },
      })
      const cohortIds = cohortMemberships.map((m) => m.cohortId)

      const cohortMembers = cohortIds.length > 0
        ? await db.cohortMember.findMany({
            where: {
              cohortId: { in: cohortIds },
              userId: { not: userId },
            },
            select: {
              user: { select: { id: true, name: true, image: true, role: true } },
            },
          })
        : []

      // Get all admins (counselors)
      const admins = await db.user.findMany({
        where: { role: "ADMIN", isActive: true },
        select: { id: true, name: true, image: true, role: true },
      })

      // Deduplicate
      const contactMap = new Map<string, { id: string; name: string | null; image: string | null; role: string }>()
      admins.forEach((u) => contactMap.set(u.id, u))
      cohortMembers.forEach((m) => contactMap.set(m.user.id, m.user))

      return NextResponse.json(
        Array.from(contactMap.values()).sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        )
      )
    }

    if (role === "PARENT") {
      // Get linked students
      const links = await db.parentStudent.findMany({
        where: { parentId: userId },
        select: {
          student: { select: { id: true, name: true, image: true, role: true } },
        },
      })

      // Get all admins
      const admins = await db.user.findMany({
        where: { role: "ADMIN", isActive: true },
        select: { id: true, name: true, image: true, role: true },
      })

      const contacts = [
        ...links.map((l) => l.student),
        ...admins,
      ]

      return NextResponse.json(contacts.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      ))
    }

    return NextResponse.json([])
  } catch (error) {
    console.error("Error fetching contacts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
