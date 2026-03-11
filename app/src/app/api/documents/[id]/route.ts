import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const doc = await db.document.findFirst({
      where: { id: params.id, userId: session.user.id }
    })
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await db.document.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
