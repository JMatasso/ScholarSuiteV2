import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { randomBytes } from "crypto"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user already has a token
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { calendarToken: true },
    })

    let token = user?.calendarToken

    if (!token) {
      // Generate a secure random token
      token = randomBytes(32).toString("hex")
      await db.user.update({
        where: { id: session.user.id },
        data: { calendarToken: token },
      })
    }

    return NextResponse.json({ token })
  } catch (error) {
    console.error("Calendar subscribe error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Regenerate token (revokes old subscriptions)
export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = randomBytes(32).toString("hex")
    await db.user.update({
      where: { id: session.user.id },
      data: { calendarToken: token },
    })

    return NextResponse.json({ token })
  } catch (error) {
    console.error("Calendar token reset error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
