/**
 * Smart scholarship refresh scheduler.
 *
 * Instead of refreshing all 10K scholarships at once, this module
 * assigns each scholarship a nextRefreshAt date based on its deadline
 * proximity. A daily cron job processes only the scholarships due today.
 *
 * Priority tiers:
 *   HIGH   — deadline is 2-4 months away (new cycle info likely up)
 *   MEDIUM — deadline passed 6+ months ago (check for new cycle)
 *   LOW    — deadline is 5+ months away (no rush)
 *   ARCHIVED — errored 3+ times or manually archived
 */

import { db } from "@/lib/db"

// ── Schedule calculation ────────────────────────────────────

const MS_PER_DAY = 1000 * 60 * 60 * 24

function monthsFromNow(months: number): Date {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * MS_PER_DAY)
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / MS_PER_DAY)
}

export type RefreshPriority = "HIGH" | "MEDIUM" | "LOW" | "ARCHIVED"

interface ScheduleResult {
  nextRefreshAt: Date
  priority: RefreshPriority
}

/**
 * Compute when a scholarship should next be refreshed based on its deadline.
 */
export function computeRefreshSchedule(
  deadline: Date | null,
  lastScrapedAt: Date | null,
  scrapeErrorCount?: number
): ScheduleResult {
  // Too many errors → archive, retry quarterly
  if (scrapeErrorCount && scrapeErrorCount >= 3) {
    return { nextRefreshAt: monthsFromNow(3), priority: "ARCHIVED" }
  }

  const now = new Date()

  if (!deadline) {
    // No deadline known — refresh monthly to discover one
    return { nextRefreshAt: monthsFromNow(1), priority: "MEDIUM" }
  }

  const daysUntilDeadline = daysBetween(deadline, now)

  if (daysUntilDeadline < 0) {
    // Deadline has passed
    const daysSinceDeadline = Math.abs(daysUntilDeadline)

    if (daysSinceDeadline >= 180) {
      // 6+ months since deadline — new cycle likely posted, check soon
      return { nextRefreshAt: daysFromNow(7), priority: "HIGH" }
    }
    if (daysSinceDeadline >= 90) {
      // 3-6 months since deadline — check in a month
      return { nextRefreshAt: monthsFromNow(1), priority: "MEDIUM" }
    }
    // Recently expired (< 3 months) — too early for new cycle
    return { nextRefreshAt: monthsFromNow(2), priority: "LOW" }
  }

  // Deadline is in the future
  if (daysUntilDeadline <= 60) {
    // Within 2 months — scholarship is currently active, refresh weekly
    // to catch any last-minute changes
    return { nextRefreshAt: daysFromNow(7), priority: "HIGH" }
  }

  if (daysUntilDeadline <= 120) {
    // 2-4 months out — refresh every 2 weeks
    return { nextRefreshAt: daysFromNow(14), priority: "HIGH" }
  }

  if (daysUntilDeadline <= 240) {
    // 4-8 months out — refresh monthly
    return { nextRefreshAt: monthsFromNow(1), priority: "MEDIUM" }
  }

  // 8+ months out — no rush, check quarterly
  return { nextRefreshAt: monthsFromNow(3), priority: "LOW" }
}

// ── Queue fetching ──────────────────────────────────────────

/**
 * Fetch the next batch of scholarships due for refresh.
 * Only returns scholarships where nextRefreshAt <= now and sourceUrl exists.
 */
export async function getRefreshQueue(batchSize = 50) {
  return db.scholarship.findMany({
    where: {
      sourceUrl: { not: null },
      refreshPriority: { not: "ARCHIVED" },
      OR: [
        { nextRefreshAt: { lte: new Date() } },
        { nextRefreshAt: null }, // Never scheduled → needs initial scheduling
      ],
    },
    orderBy: [
      { refreshPriority: "asc" }, // HIGH first
      { nextRefreshAt: "asc" },   // Oldest due date first
    ],
    take: batchSize,
  })
}

/**
 * Schedule refresh dates for all scholarships that have a sourceUrl
 * but no nextRefreshAt set yet. Run once to backfill existing data.
 */
export async function backfillRefreshSchedules() {
  const unscheduled = await db.scholarship.findMany({
    where: {
      sourceUrl: { not: null },
      nextRefreshAt: null,
    },
    select: { id: true, deadline: true, lastScrapedAt: true },
  })

  let updated = 0
  for (const s of unscheduled) {
    const schedule = computeRefreshSchedule(s.deadline, s.lastScrapedAt)
    await db.scholarship.update({
      where: { id: s.id },
      data: {
        nextRefreshAt: schedule.nextRefreshAt,
        refreshPriority: schedule.priority,
      },
    })
    updated++
  }

  return { updated, total: unscheduled.length }
}

/**
 * After a scholarship is refreshed, compute and set its next refresh date.
 */
export async function scheduleNextRefresh(
  scholarshipId: string,
  deadline: Date | null,
  wasError: boolean,
  currentErrorCount = 0
) {
  const errorCount = wasError ? currentErrorCount + 1 : 0
  const schedule = computeRefreshSchedule(deadline, new Date(), errorCount)

  await db.scholarship.update({
    where: { id: scholarshipId },
    data: {
      nextRefreshAt: schedule.nextRefreshAt,
      refreshPriority: schedule.priority,
    },
  })

  return schedule
}
