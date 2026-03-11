import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hash } from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { token, email, password } = await req.json()
    if (!token || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const verificationToken = await db.verificationToken.findFirst({
      where: { identifier: email, token }
    })

    if (!verificationToken) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 })
    }

    if (verificationToken.expires < new Date()) {
      await db.verificationToken.delete({ where: { identifier_token: { identifier: email, token } } })
      return NextResponse.json({ error: "Reset link has expired" }, { status: 400 })
    }

    const hashedPassword = await hash(password, 12)
    await db.user.update({ where: { email }, data: { password: hashedPassword } })
    await db.verificationToken.delete({ where: { identifier_token: { identifier: email, token } } })

    return NextResponse.json({ message: "Password reset successfully" })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
