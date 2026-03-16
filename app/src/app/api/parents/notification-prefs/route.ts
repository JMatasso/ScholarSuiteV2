import { NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"

export const GET = withAuth(async (session) => {
  if (session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const profile = await db.parentProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      notifyChannel: true,
      notifyScholarshipSubmissions: true,
      notifyCollegeAppSubmissions: true,
      notifyWeeklyDigest: true,
      smsConsent: true,
      smsPhone: true,
      notifyTasks: true,
      notifyDeadlines: true,
      notifyAwards: true,
      notifyMessages: true,
    },
  })

  if (!profile) {
    return NextResponse.json({
      notifyChannel: "EMAIL",
      notifyScholarshipSubmissions: true,
      notifyCollegeAppSubmissions: true,
      notifyWeeklyDigest: true,
      smsConsent: false,
      smsPhone: null,
      notifyTasks: true,
      notifyDeadlines: true,
      notifyAwards: true,
      notifyMessages: true,
    })
  }

  return NextResponse.json(profile)
})

export const PATCH = withAuth(async (session, request) => {
  if (session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const data = await request.json()

  // Only allow updating notification-related fields
  const allowedFields = [
    "notifyChannel",
    "notifyScholarshipSubmissions",
    "notifyCollegeAppSubmissions",
    "notifyWeeklyDigest",
    "smsConsent",
    "smsPhone",
    "notifyTasks",
    "notifyDeadlines",
    "notifyAwards",
    "notifyMessages",
  ]

  const updateData: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      updateData[key] = data[key]
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 })
  }

  const updated = await db.parentProfile.upsert({
    where: { userId: session.user.id },
    update: updateData,
    create: { userId: session.user.id, ...updateData },
  })

  return NextResponse.json(updated)
})
