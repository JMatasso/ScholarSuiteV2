import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { extractScholarshipFromUrl } from "@/lib/chat-ai"

// Fetch page text (same as extract-batch)
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

const COMPARE_FIELDS = [
  "name", "provider", "amount", "amountMax", "deadline", "description",
  "minGpa", "states", "requiresFirstGen", "requiresPell", "requiresFinancialNeed",
] as const

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { scholarshipId } = data as { scholarshipId?: string }

    // Find scholarship(s) to refresh
    let scholarships
    if (scholarshipId) {
      const s = await db.scholarship.findUnique({ where: { id: scholarshipId } })
      if (!s) return NextResponse.json({ error: "Scholarship not found" }, { status: 404 })
      if (!s.sourceUrl && !s.url) return NextResponse.json({ error: "No source URL" }, { status: 400 })
      scholarships = [s]
    } else {
      // Refresh all with sourceUrl that are stale (not scraped in last 30 days or deadline passed)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      scholarships = await db.scholarship.findMany({
        where: {
          OR: [
            { sourceUrl: { not: null }, lastScrapedAt: { lt: thirtyDaysAgo } },
            { sourceUrl: { not: null }, lastScrapedAt: null },
            { url: { not: null }, sourceUrl: null, lastScrapedAt: null },
          ],
        },
        take: 20, // Limit per batch
      })
    }

    const results = []

    for (const scholarship of scholarships) {
      const sourceUrl = scholarship.sourceUrl || scholarship.url
      if (!sourceUrl) continue

      try {
        const pageText = await fetchPageText(sourceUrl)
        const extraction = await extractScholarshipFromUrl(pageText, sourceUrl)
        const extracted = extraction.extracted as Record<string, unknown>

        // Compare fields
        const changes: Array<{ field: string; old: unknown; new: unknown }> = []
        for (const field of COMPARE_FIELDS) {
          const oldVal = (scholarship as Record<string, unknown>)[field]
          const newVal = extracted[field]
          if (newVal !== undefined && JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            changes.push({ field, old: oldVal, new: newVal })
          }
        }

        // Determine status
        let status: "CURRENT" | "NEEDS_REVIEW" | "EXPIRED" | "ERROR" = "CURRENT"
        if (changes.length > 0) status = "NEEDS_REVIEW"
        const deadline = extracted.deadline ? new Date(extracted.deadline as string) : null
        if (deadline && deadline < new Date()) status = "EXPIRED"

        results.push({
          scholarshipId: scholarship.id,
          name: scholarship.name,
          sourceUrl,
          changes,
          status,
          extracted,
        })

        // Update scrape tracking
        await db.scholarship.update({
          where: { id: scholarship.id },
          data: {
            lastScrapedAt: new Date(),
            scrapeStatus: status,
            sourceUrl: scholarship.sourceUrl || sourceUrl,
          },
        })
      } catch (err) {
        results.push({
          scholarshipId: scholarship.id,
          name: scholarship.name,
          sourceUrl,
          changes: [],
          status: "ERROR" as const,
          error: err instanceof Error ? err.message : "Failed to refresh",
        })

        await db.scholarship.update({
          where: { id: scholarship.id },
          data: { lastScrapedAt: new Date(), scrapeStatus: "ERROR" },
        })
      }
    }

    return NextResponse.json({
      results,
      total: scholarships.length,
      needsReview: results.filter((r) => r.status === "NEEDS_REVIEW").length,
      current: results.filter((r) => r.status === "CURRENT").length,
      errors: results.filter((r) => r.status === "ERROR").length,
    })
  } catch (error) {
    console.error("Refresh error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
