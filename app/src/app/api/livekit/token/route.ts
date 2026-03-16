import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createLiveKitToken } from "@/lib/livekit"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { meetingId } = await req.json()
    if (!meetingId) {
      return NextResponse.json({ error: "meetingId is required" }, { status: 400 })
    }

    const meeting = await db.meeting.findUnique({
      where: { id: meetingId },
      include: { participants: true },
    })

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }

    if (!meeting.isVideoCall) {
      return NextResponse.json({ error: "This meeting is not a video call" }, { status: 400 })
    }

    if (meeting.status === "CANCELLED" || meeting.status === "COMPLETED") {
      return NextResponse.json({ error: "This meeting has ended" }, { status: 400 })
    }

    const isParticipant = meeting.participants.some(
      (p) => p.userId === session.user.id
    )
    if (!isParticipant) {
      return NextResponse.json({ error: "You are not a participant in this meeting" }, { status: 403 })
    }

    const token = await createLiveKitToken(
      meetingId,
      session.user.name || "Guest",
      session.user.id
    )

    return NextResponse.json({ token })
  } catch (error) {
    console.error("LiveKit token error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
