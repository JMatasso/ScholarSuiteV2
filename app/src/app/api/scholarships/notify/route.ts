import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { scholarshipId } = await req.json()
    if (!scholarshipId) {
      return NextResponse.json({ error: "scholarshipId is required" }, { status: 400 })
    }

    const existing = await db.scholarshipNotifyRequest.findUnique({
      where: {
        userId_scholarshipId: {
          userId: session.user.id,
          scholarshipId,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: "Already subscribed" }, { status: 409 })
    }

    await db.scholarshipNotifyRequest.create({
      data: {
        userId: session.user.id,
        scholarshipId,
      },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("Error creating notify request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const scholarshipId = searchParams.get("scholarshipId")
    if (!scholarshipId) {
      return NextResponse.json({ error: "scholarshipId is required" }, { status: 400 })
    }

    await db.scholarshipNotifyRequest.delete({
      where: {
        userId_scholarshipId: {
          userId: session.user.id,
          scholarshipId,
        },
      },
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting notify request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
