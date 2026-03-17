import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { withRole } from "@/lib/api-middleware"

export const GET = withRole("ADMIN", async () => {
  const [total, publicCount, privateNonprofitCount, privateForprofitCount, withApps, lastSync] =
    await Promise.all([
      db.college.count(),
      db.college.count({ where: { type: "PUBLIC" } }),
      db.college.count({ where: { type: "PRIVATE_NONPROFIT" } }),
      db.college.count({ where: { type: "PRIVATE_FORPROFIT" } }),
      db.college.count({
        where: { applications: { some: {} } },
      }),
      db.college.findFirst({
        orderBy: { lastSyncedAt: "desc" },
        select: { lastSyncedAt: true },
      }),
    ])

  return NextResponse.json({
    total,
    publicCount,
    privateCount: privateNonprofitCount + privateForprofitCount,
    privateNonprofitCount,
    privateForprofitCount,
    withApplications: withApps,
    lastSyncedAt: lastSync?.lastSyncedAt ?? null,
  })
})
