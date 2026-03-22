import { NextResponse } from "next/server"
import { withRole } from "@/lib/api-middleware"
import { db } from "@/lib/db"

export const GET = withRole("ADMIN", async () => {
  // Run all queries in parallel
  const [
    totalStudents,
    statusCounts,
    applicationsByStatus,
    awardedAgg,
    collegeAcceptances,
    recentAuditLogs,
    monthlyActivity,
    pipelineRaw,
    atRiskStudents,
  ] = await Promise.all([
    // Total students
    db.user.count({ where: { role: "STUDENT" } }),

    // Students by status
    db.studentProfile.groupBy({
      by: ["status"],
      _count: { status: true },
    }),

    // Scholarship applications by status
    db.scholarshipApplication.groupBy({
      by: ["status"],
      _count: { status: true },
    }),

    // Total awarded amount
    db.scholarshipApplication.aggregate({
      where: { status: "AWARDED" },
      _sum: { amountAwarded: true },
      _count: true,
    }),

    // College acceptances
    db.collegeApplication.count({ where: { status: "ACCEPTED" } }),

    // Recent audit logs
    db.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),

    // Monthly activity (last 7 months) from audit logs
    db.$queryRawUnsafe<Array<{ month: string; logins: bigint; tasks: bigint; essays: bigint }>>(`
      SELECT
        to_char(date_trunc('month', "createdAt"), 'Mon') AS month,
        COUNT(*) FILTER (WHERE action = 'LOGIN_SUCCESS') AS logins,
        COUNT(*) FILTER (WHERE resource = 'task') AS tasks,
        COUNT(*) FILTER (WHERE resource = 'essay') AS essays
      FROM "AuditLog"
      WHERE "createdAt" >= date_trunc('month', NOW()) - INTERVAL '6 months'
      GROUP BY date_trunc('month', "createdAt")
      ORDER BY date_trunc('month', "createdAt")
    `),

    // Application pipeline
    db.scholarshipApplication.groupBy({
      by: ["status"],
      _count: { status: true },
    }),

    // At-risk students (top 5)
    db.user.findMany({
      where: {
        role: "STUDENT",
        studentProfile: { status: "AT_RISK" },
      },
      select: { id: true, name: true, email: true },
      take: 5,
      orderBy: { updatedAt: "desc" },
    }),
  ])

  // Compute at-risk count
  const atRiskCount = statusCounts.find(s => s.status === "AT_RISK")?._count?.status ?? 0

  // Active applications (IN_PROGRESS + SUBMITTED)
  const activeApps =
    (applicationsByStatus.find(a => a.status === "IN_PROGRESS")?._count?.status ?? 0) +
    (applicationsByStatus.find(a => a.status === "SUBMITTED")?._count?.status ?? 0)

  // Awarded amount
  const awardedAmount = awardedAgg._sum.amountAwarded ?? 0
  const awardedCount = awardedAgg._count ?? 0

  // Format engagement data
  const engagementData = monthlyActivity.map(row => ({
    month: row.month,
    logins: Number(row.logins),
    tasks: Number(row.tasks),
    essays: Number(row.essays),
  }))

  // Format pipeline data
  const statusLabels: Record<string, string> = {
    NOT_STARTED: "Not Started",
    IN_PROGRESS: "In Progress",
    SUBMITTED: "Submitted",
    AWARDED: "Awarded",
    DENIED: "Denied",
  }
  const pipelineData = pipelineRaw.map(p => ({
    stage: statusLabels[p.status] ?? p.status,
    count: p._count.status,
  }))

  return NextResponse.json({
    totalStudents,
    activeApplications: activeApps,
    awardedAmount,
    awardedCount,
    collegeAcceptances,
    atRiskCount,
    atRiskStudents,
    engagementData,
    pipelineData,
    auditLogs: recentAuditLogs,
  })
})
