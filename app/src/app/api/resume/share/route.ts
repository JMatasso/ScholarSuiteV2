import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import crypto from "crypto"

/**
 * POST — Generate a shareable brag sheet link.
 * Creates a unique token stored in Settings table.
 * GET — Fetch shared brag sheet data by token (public, no auth).
 */
export async function POST() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const key = `bragsheet_share_${session.user.id}`

    // Check if token already exists
    const existing = await db.setting.findUnique({ where: { key } })
    if (existing) {
      return NextResponse.json({ token: existing.value })
    }

    // Generate new token
    const token = crypto.randomBytes(24).toString("hex")
    await db.setting.create({
      data: { key, value: token },
    })

    return NextResponse.json({ token }, { status: 201 })
  } catch (error) {
    console.error("Error creating share link:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * GET — Fetch brag sheet data by token (public endpoint).
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 })
    }

    // Find the setting with this token
    const settings = await db.setting.findMany({
      where: {
        key: { startsWith: "bragsheet_share_" },
        value: token,
      },
    })

    if (settings.length === 0) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 })
    }

    const userId = settings[0].key.replace("bragsheet_share_", "")

    // Fetch student profile
    const profile = await db.studentProfile.findUnique({
      where: { userId },
      select: {
        firstName: true,
        lastName: true,
        highSchool: true,
        gradeLevel: true,
        gpa: true,
        intendedMajor: true,
        city: true,
        state: true,
        activities: true,
        communityService: true,
        leadershipRoles: true,
        awards: true,
        goals: true,
      },
    })

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Fetch activities
    const activities = await db.activity.findMany({
      where: { userId },
      orderBy: [{ category: "asc" }, { startDate: "desc" }],
      select: {
        id: true,
        title: true,
        category: true,
        organization: true,
        role: true,
        description: true,
        impactStatement: true,
        startDate: true,
        endDate: true,
        isOngoing: true,
        hoursPerWeek: true,
        totalHours: true,
        skillsGained: true,
        isLeadership: true,
        isAward: true,
      },
    })

    return NextResponse.json({
      profile,
      activities,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching shared brag sheet:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE — Revoke share link.
 */
export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const key = `bragsheet_share_${session.user.id}`
    await db.setting.delete({ where: { key } }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error revoking share link:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
