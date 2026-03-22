import { NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"

export const GET = withAuth(async (session) => {
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const hasKey = !!process.env.ANTHROPIC_API_KEY
  const keyPrefix = hasKey
    ? process.env.ANTHROPIC_API_KEY!.slice(0, 12) + "..."
    : "NOT SET"
  const model = process.env.CHAT_AI_MODEL || "claude-haiku-4-5-20241022"

  // Try a minimal API call
  let apiStatus: "ok" | "error" = "error"
  let errorMessage = ""

  if (hasKey) {
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk")
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const response = await client.messages.create({
        model,
        max_tokens: 10,
        messages: [{ role: "user", content: "Say OK" }],
      })
      if (response.content.length > 0) {
        apiStatus = "ok"
      }
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err)
    }
  } else {
    errorMessage = "ANTHROPIC_API_KEY environment variable is not set"
  }

  return NextResponse.json({
    anthropicKey: keyPrefix,
    model,
    apiStatus,
    errorMessage: errorMessage || undefined,
  })
})
