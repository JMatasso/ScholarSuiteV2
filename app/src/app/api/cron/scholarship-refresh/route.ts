import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractScholarshipFromUrl } from "@/lib/chat-ai"
import { getRefreshQueue, scheduleNextRefresh, backfillRefreshSchedules } from "@/lib/refresh-scheduler"
import { recomputeMatchesForScholarships } from "@/lib/match-recompute"

const COMPARE_FIELDS = [
  "name", "provider", "amount", "amountMax", "deadline", "description",
  "minGpa", "states", "requiresFirstGen", "requiresPell", "requiresFinancialNeed",
] as const

async function fetchPageText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#?\w+;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return text.slice(0, 8000)
}

/**
 * POST /api/cron/scholarship-refresh
 *
 * Daily smart refresh cron job. Processes scholarships whose nextRefreshAt <= now.
 * Protected by CRON_SECRET bearer token.
 *
 * Query params:
 *   ?batchSize=50    — max scholarships to process per run (default 50)
 *   ?backfill=true   — schedule all unscheduled scholarships first
 *   ?autoApply=true  — automatically apply non-destructive changes (default true)
 *
 * Call via Railway cron or external scheduler:
 *   curl -X POST https://yourapp.railway.app/api/cron/scholarship-refresh \
 *     -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const batchSize = Math.min(parseInt(searchParams.get("batchSize") || "50"), 100)
  const shouldBackfill = searchParams.get("backfill") === "true"
  const autoApply = searchParams.get("autoApply") !== "false" // default true

  try {
    // Optionally backfill schedules for scholarships that have never been scheduled
    let backfilled = 0
    if (shouldBackfill) {
      const result = await backfillRefreshSchedules()
      backfilled = result.updated
    }

    // Get the next batch of scholarships due for refresh
    const queue = await getRefreshQueue(batchSize)

    if (queue.length === 0) {
      return NextResponse.json({
        message: "No scholarships due for refresh",
        backfilled,
        processed: 0,
      })
    }

    const results: Array<{
      scholarshipId: string
      name: string
      status: string
      changes: Array<{ field: string; old: unknown; new: unknown }>
      applied: boolean
    }> = []
    const changedScholarshipIds: string[] = []

    for (const scholarship of queue) {
      const sourceUrl = scholarship.sourceUrl || scholarship.url
      if (!sourceUrl) {
        await scheduleNextRefresh(scholarship.id, scholarship.deadline, false)
        continue
      }

      try {
        const pageText = await fetchPageText(sourceUrl)
        const extraction = await extractScholarshipFromUrl(pageText, sourceUrl)
        const extracted = extraction.extracted as Record<string, unknown>

        // Compare fields for changes
        const changes: Array<{ field: string; old: unknown; new: unknown }> = []
        for (const field of COMPARE_FIELDS) {
          const oldVal = (scholarship as Record<string, unknown>)[field]
          const newVal = extracted[field]
          if (newVal !== undefined && JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            changes.push({ field, old: oldVal, new: newVal })
          }
        }

        // Determine scrape status
        let scrapeStatus: "CURRENT" | "NEEDS_REVIEW" | "EXPIRED" = "CURRENT"
        if (changes.length > 0) scrapeStatus = "NEEDS_REVIEW"
        const newDeadline = extracted.deadline ? new Date(extracted.deadline as string) : null
        if (newDeadline && newDeadline < new Date()) scrapeStatus = "EXPIRED"

        // Check if deadline changed (key trigger for match recomputation)
        const deadlineChanged = changes.some((c) => c.field === "deadline")
        const deadlineRenewed =
          deadlineChanged && newDeadline && newDeadline > new Date() &&
          (!scholarship.deadline || scholarship.deadline < new Date())

        // Auto-apply changes if enabled
        let applied = false
        if (autoApply && changes.length > 0) {
          const updateData: Record<string, unknown> = {
            lastScrapedAt: new Date(),
            scrapeStatus,
            sourceUrl: scholarship.sourceUrl || sourceUrl,
          }

          // Apply all extracted field changes
          for (const change of changes) {
            if (change.field === "deadline" && change.new) {
              updateData.deadline = new Date(change.new as string)
            } else {
              updateData[change.field] = change.new
            }
          }

          // If deadline renewed, make sure scholarship is active
          if (deadlineRenewed) {
            updateData.isActive = true
          }

          await db.scholarship.update({
            where: { id: scholarship.id },
            data: updateData,
          })
          applied = true

          // Track for match recomputation
          changedScholarshipIds.push(scholarship.id)
        } else {
          // Just update scrape tracking
          await db.scholarship.update({
            where: { id: scholarship.id },
            data: {
              lastScrapedAt: new Date(),
              scrapeStatus,
              sourceUrl: scholarship.sourceUrl || sourceUrl,
            },
          })
        }

        // Schedule next refresh based on the new/existing deadline
        const effectiveDeadline = newDeadline || scholarship.deadline
        await scheduleNextRefresh(scholarship.id, effectiveDeadline, false)

        results.push({
          scholarshipId: scholarship.id,
          name: scholarship.name,
          status: scrapeStatus,
          changes,
          applied,
        })
      } catch (err) {
        // Error — schedule retry with error count
        await db.scholarship.update({
          where: { id: scholarship.id },
          data: { lastScrapedAt: new Date(), scrapeStatus: "ERROR" },
        })
        await scheduleNextRefresh(scholarship.id, scholarship.deadline, true)

        results.push({
          scholarshipId: scholarship.id,
          name: scholarship.name,
          status: "ERROR",
          changes: [],
          applied: false,
        })
      }
    }

    // Recompute matches for all changed scholarships and notify students
    let matchResults = null
    if (changedScholarshipIds.length > 0) {
      matchResults = await recomputeMatchesForScholarships(changedScholarshipIds)
    }

    const summary = {
      backfilled,
      processed: results.length,
      current: results.filter((r) => r.status === "CURRENT").length,
      needsReview: results.filter((r) => r.status === "NEEDS_REVIEW").length,
      expired: results.filter((r) => r.status === "EXPIRED").length,
      errors: results.filter((r) => r.status === "ERROR").length,
      changesApplied: results.filter((r) => r.applied).length,
      matchRecomputation: matchResults
        ? {
            scholarshipsRecomputed: matchResults.length,
            totalNewlyEligible: matchResults.reduce((sum, r) => sum + r.newlyEligible, 0),
            totalNotifications: matchResults.reduce((sum, r) => sum + r.notificationsCreated, 0),
          }
        : null,
      results,
    }

    console.log("[scholarship-refresh]", JSON.stringify({
      processed: summary.processed,
      changes: summary.changesApplied,
      notifications: summary.matchRecomputation?.totalNotifications || 0,
    }))

    return NextResponse.json(summary)
  } catch (error) {
    console.error("Scholarship refresh cron error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
