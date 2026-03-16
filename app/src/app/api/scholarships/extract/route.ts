import { NextResponse } from "next/server"
import { withRole } from "@/lib/api-middleware"
import { extractScholarshipFromUrl } from "@/lib/chat-ai"

/**
 * POST /api/scholarships/extract
 * Fetch a URL, extract scholarship data using Claude AI.
 * Admin only. Returns structured data for review before saving.
 */
export const POST = withRole("ADMIN", async (_session, request) => {
  const { url } = await request.json()

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 })
  }

  // Validate URL format
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
  }

  // Fetch the page content
  let html: string
  try {
    const res = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ScholarSuite/1.0; scholarship data extraction)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL (HTTP ${res.status})` },
        { status: 400 }
      )
    }

    html = await res.text()
  } catch (fetchError) {
    return NextResponse.json(
      { error: `Could not reach the URL: ${fetchError instanceof Error ? fetchError.message : "timeout or network error"}` },
      { status: 400 }
    )
  }

  // Strip HTML to plain text
  const plainText = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim()

  if (plainText.length < 50) {
    return NextResponse.json(
      { error: "Page content too short — the site may require JavaScript or authentication" },
      { status: 400 }
    )
  }

  // Extract via Claude
  try {
    const result = await extractScholarshipFromUrl(plainText, url)

    return NextResponse.json({
      extracted: result.extracted,
      sourceUrl: url,
      tokensUsed: result.inputTokens + result.outputTokens,
    })
  } catch (aiError) {
    console.error("AI extraction failed:", aiError)
    return NextResponse.json(
      { error: "AI extraction failed — please enter scholarship details manually" },
      { status: 500 }
    )
  }
})
