import { NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"

// GET: Fetch current user's preferences
export const GET = withAuth(async (session) => {
  const key = `user:${session.user.id}:preferences`
  const setting = await db.setting.findUnique({ where: { key } })

  const defaults = {
    // Notification preferences
    notifyTaskReminders: true,
    notifyScholarshipDeadlines: true,
    notifyNewMessages: true,
    notifyMeetingReminders: true,
    notifyEssayFeedback: true,
    notifyLocalScholarships: true,
    notificationMethod: "email",
    notificationContact: "",
    // Privacy preferences (student only)
    privacyHideGpa: false,
    privacyHideEssays: false,
    privacyHideCohortProfile: false,
  }

  if (!setting) return NextResponse.json(defaults)

  try {
    const stored = JSON.parse(setting.value)
    return NextResponse.json({ ...defaults, ...stored })
  } catch {
    return NextResponse.json(defaults)
  }
})

// POST: Save preferences
export const POST = withAuth(async (session, request) => {
  const body = await request.json()
  const key = `user:${session.user.id}:preferences`

  // Merge with existing preferences
  const existing = await db.setting.findUnique({ where: { key } })
  let current = {}
  if (existing) {
    try { current = JSON.parse(existing.value) } catch {}
  }

  const merged = { ...current, ...body }

  await db.setting.upsert({
    where: { key },
    update: { value: JSON.stringify(merged) },
    create: { key, value: JSON.stringify(merged) },
  })

  return NextResponse.json(merged)
})
