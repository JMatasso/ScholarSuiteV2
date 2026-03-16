import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getResend } from "@/lib/resend"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { logAudit } from "@/lib/audit"
import { getClientIp } from "@/lib/api-middleware"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP
    const ip = getClientIp(req)
    const rl = rateLimit(`forgot-password:${ip}`, RATE_LIMITS.passwordReset)
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
      )
    }

    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

    const normalizedEmail = email.toLowerCase().trim()
    const user = await db.user.findUnique({ where: { email: normalizedEmail } })

    if (user) {
      const token = crypto.randomBytes(32).toString("hex")
      const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      // Delete any existing token for this email
      await db.verificationToken.deleteMany({ where: { identifier: normalizedEmail } })

      await db.verificationToken.create({
        data: { identifier: normalizedEmail, token, expires }
      })

      const resetUrl = `${process.env.NEXTAUTH_URL || process.env.AUTH_URL}/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`

      await getResend().emails.send({
        from: process.env.EMAIL_FROM || "ScholarSuite <noreply@scholarsuite.app>",
        to: normalizedEmail,
        subject: "Reset your ScholarSuite password",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #1E3A5F;">Reset your password</h2>
            <p>We received a request to reset your ScholarSuite password.</p>
            <p>Click the button below to reset your password. This link expires in 1 hour.</p>
            <a href="${resetUrl}" style="display: inline-block; background: #1E3A5F; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
              Reset Password
            </a>
            <p style="color: #888; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      })

      logAudit({
        userId: user.id,
        action: "PASSWORD_RESET_REQUESTED",
        resource: "auth",
      })
    }

    // Always return success to not leak email existence
    return NextResponse.json({ message: "If an account exists, a reset link was sent." })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
