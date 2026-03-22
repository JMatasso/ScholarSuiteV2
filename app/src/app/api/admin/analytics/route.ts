import { NextResponse } from "next/server"
import { Prisma } from "@/generated/prisma/client"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Run all queries in parallel
    const [
      totalStudents,
      activeStudents,
      totalParents,
      totalScholarships,
      localScholarships,
      totalApplications,
      applicationsByStatus,
      totalCollegeApps,
      collegeAppsByStatus,
      totalAwarded,
      recentActivity,
      cohortStats,
      studentsByStage,
      scholarshipsByMonth,
    ] = await Promise.all([
      // Student counts
      db.user.count({ where: { role: "STUDENT" } }),
      db.user.count({ where: { role: "STUDENT", isActive: true } }),
      db.user.count({ where: { role: "PARENT" } }),

      // Scholarship counts
      db.scholarship.count({ where: { isActive: true } }),
      db.scholarship.count({ where: { source: "LOCAL" } }),

      // Application counts
      db.scholarshipApplication.count(),
      db.scholarshipApplication.groupBy({
        by: ["status"],
        _count: true,
      }),

      // College application counts
      db.collegeApplication.count(),
      db.collegeApplication.groupBy({
        by: ["status"],
        _count: true,
      }),

      // Total awarded amount
      db.scholarshipApplication.aggregate({
        _sum: { amountAwarded: true },
        where: { status: "AWARDED" },
      }),

      // Recent activity events (last 30 days)
      db.activityEvent.count({
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),

      // Cohort stats
      db.cohort.findMany({
        include: { _count: { select: { members: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // Students by journey stage
      db.studentProfile.groupBy({
        by: ["journeyStage"],
        _count: true,
      }),

      // Scholarship applications created per month (last 6 months)
      db.$queryRaw<Array<{ month: string; count: bigint }>>(
        Prisma.sql`SELECT TO_CHAR("createdAt", 'YYYY-MM') as month, COUNT(*)::bigint as count
         FROM "ScholarshipApplication"
         WHERE "createdAt" >= NOW() - INTERVAL '6 months'
         GROUP BY month
         ORDER BY month`
      ),
    ])

    // Format application status breakdown
    const appStatusMap: Record<string, number> = {}
    for (const row of applicationsByStatus) {
      appStatusMap[row.status] = row._count
    }

    const collegeStatusMap: Record<string, number> = {}
    for (const row of collegeAppsByStatus) {
      collegeStatusMap[row.status] = row._count
    }

    const stageMap: Record<string, number> = {}
    for (const row of studentsByStage) {
      stageMap[row.journeyStage] = row._count
    }

    const monthlyApps = scholarshipsByMonth.map((r) => ({
      month: r.month,
      count: Number(r.count),
    }))

    return NextResponse.json({
      overview: {
        totalStudents,
        activeStudents,
        totalParents,
        totalScholarships,
        localScholarships,
        totalApplications,
        totalCollegeApps,
        totalAwarded: totalAwarded._sum.amountAwarded || 0,
        recentActivity,
      },
      scholarshipApplications: appStatusMap,
      collegeApplications: collegeStatusMap,
      studentsByStage: stageMap,
      monthlyApplications: monthlyApps,
      cohorts: cohortStats.map((c) => ({
        id: c.id,
        name: c.name,
        members: c._count.members,
      })),
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
