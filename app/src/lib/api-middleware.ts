import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"

interface AuthSession {
  user: {
    id: string
    role: string
    email?: string | null
    name?: string | null
    image?: string | null
  }
}

type AuthHandler = (
  session: AuthSession,
  request: NextRequest
) => Promise<NextResponse>

/**
 * Extract a client identifier from a request for rate limiting.
 * Uses x-forwarded-for (set by Railway/proxies), falls back to "unknown".
 */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}

/**
 * Wrap an API route handler with authentication + per-user rate limiting.
 * Returns 401 if no session, 429 if rate limited, 500 on uncaught errors.
 */
export function withAuth(handler: AuthHandler) {
  return async (request: NextRequest) => {
    try {
      const session = await auth()
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      // Rate limit by user ID
      const rl = rateLimit(`api:${session.user.id}`, RATE_LIMITS.api)
      if (!rl.success) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: {
              "Retry-After": String(Math.ceil(rl.resetMs / 1000)),
            },
          }
        )
      }

      return await handler(session as AuthSession, request)
    } catch (error) {
      console.error("API error:", error)
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      )
    }
  }
}

/**
 * Wrap an API route handler with authentication + role check.
 * Returns 401 if no session, 403 if wrong role.
 */
export function withRole(role: string | string[], handler: AuthHandler) {
  const roles = Array.isArray(role) ? role : [role]
  return withAuth(async (session, request) => {
    if (!roles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return await handler(session, request)
  })
}
