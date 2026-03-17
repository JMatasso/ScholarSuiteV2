import { NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"

// GET: Fetch admin privacy control settings (any authenticated user can read these)
export const GET = withAuth(async () => {
  const defaults: Record<string, string> = {
    allowStudentHideGpa: "true",
    allowStudentHideEssays: "true",
    allowStudentHideCohortProfile: "true",
    allowParentHideContactFromCounselors: "true",
    allowParentEmailOnlyComms: "true",
  }

  const keys = Object.keys(defaults).map((k) => `privacy:${k}`)
  const settings = await db.setting.findMany({
    where: { key: { in: keys } },
  })

  const result: Record<string, string> = { ...defaults }
  for (const s of settings) {
    const cleanKey = s.key.replace("privacy:", "")
    result[cleanKey] = s.value
  }

  return NextResponse.json(result)
})
