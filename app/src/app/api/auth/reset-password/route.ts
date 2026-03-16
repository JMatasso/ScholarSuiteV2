import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hash } from "bcryptjs"
import { validatePassword } from "@/lib/password"
import { logAudit } from "@/lib/audit"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/api-middleware"

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP
    const ip = getClientIp(req)
    const rl = rateLimit(`reset-password:${ip}`, RATE_LIMITS.passwordReset)
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
      )
    }

    const { token, email, password } = await req.json()
    if (!token || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate password policy
    const pwCheck = validatePassword(password)
    if (!pwCheck.valid) {
      return NextResponse.json(
        { error: pwCheck.errors[0], errors: pwCheck.errors },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    const verificationToken = await db.verificationToken.findFirst({
      where: { identifier: normalizedEmail, token }
    })

    if (!verificationToken) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 })
    }

    if (verificationToken.expires < new Date()) {
      await db.verificationToken.delete({ where: { identifier_token: { identifier: normalizedEmail, token } } })
      return NextResponse.json({ error: "Reset link has expired" }, { status: 400 })
    }

    const hashedPassword = await hash(password, 12)
    const user = await db.user.update({ where: { email: normalizedEmail }, data: { password: hashedPassword } })
    await db.verificationToken.delete({ where: { identifier_token: { identifier: normalizedEmail, token } } })

    logAudit({
      userId: user.id,
      action: "PASSWORD_RESET_COMPLETED",
      resource: "auth",
    })

    return NextResponse.json({ message: "Password reset successfully" })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
