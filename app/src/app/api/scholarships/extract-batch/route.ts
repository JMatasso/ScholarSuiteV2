import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { extractScholarshipFromUrl } from "@/lib/chat-ai"

interface ExtractResult {
  url: string
  extracted: Record<string, unknown> | null
  error?: string
  tokensUsed?: number
}

// Fetch and strip HTML from a URL
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

  // Strip scripts, styles, nav, footer, header
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

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const urls: string[] = data.urls

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "urls array is required" }, { status: 400 })
    }

    if (urls.length > 50) {
      return NextResponse.json({ error: "Maximum 50 URLs per batch" }, { status: 400 })
    }

    const results: ExtractResult[] = []

    // Process sequentially to avoid rate limits
    for (const url of urls) {
      try {
        const trimmedUrl = url.trim()
        if (!trimmedUrl || !trimmedUrl.startsWith("http")) {
          results.push({ url: trimmedUrl, extracted: null, error: "Invalid URL" })
          continue
        }

        const pageText = await fetchPageText(trimmedUrl)
        if (pageText.length < 100) {
          results.push({ url: trimmedUrl, extracted: null, error: "Page too short or empty" })
          continue
        }

        const result = await extractScholarshipFromUrl(pageText, trimmedUrl)
        results.push({
          url: trimmedUrl,
          extracted: result.extracted,
          tokensUsed: (result.inputTokens || 0) + (result.outputTokens || 0),
        })
      } catch (err) {
        results.push({
          url: url.trim(),
          extracted: null,
          error: err instanceof Error ? err.message : "Extraction failed",
        })
      }
    }

    return NextResponse.json({
      results,
      total: urls.length,
      successful: results.filter((r) => r.extracted).length,
      failed: results.filter((r) => !r.extracted).length,
    })
  } catch (error) {
    console.error("Batch extract error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
