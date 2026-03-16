import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

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
 * Wrap an API route handler with authentication.
 * Returns 401 if no session, 500 on uncaught errors.
 */
export function withAuth(handler: AuthHandler) {
  return async (request: NextRequest) => {
    try {
      const session = await auth()
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
