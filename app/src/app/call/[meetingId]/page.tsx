"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { PreJoinScreen } from "@/components/call/pre-join-screen"
import { VideoRoom } from "@/components/call/video-room"
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MeetingData {
  id: string
  title: string
  description: string | null
  isVideoCall: boolean
  status: string
  participants: {
    id: string
    userId: string
    isHost: boolean
    hasAccepted: boolean
    user: { id: string; name: string | null; image: string | null; role: string }
  }[]
}

type CallState = "loading" | "pre-join" | "joining" | "connected" | "error" | "ended"

export default function CallPage() {
  const { meetingId } = useParams<{ meetingId: string }>()
  const router = useRouter()
  const { data: session } = useSession()

  const [callState, setCallState] = useState<CallState>("loading")
  const [meeting, setMeeting] = useState<MeetingData | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch meeting details
  useEffect(() => {
    if (!meetingId) return
    fetch(`/api/meetings/${meetingId}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? "You are not a participant in this meeting" : "Meeting not found")
        return r.json()
      })
      .then((data: MeetingData) => {
        if (!data.isVideoCall) {
          setError("This meeting is not a video call")
          setCallState("error")
          return
        }
        if (data.status === "CANCELLED" || data.status === "COMPLETED") {
          setError("This meeting has ended")
          setCallState("error")
          return
        }
        setMeeting(data)
        setCallState("pre-join")
      })
      .catch((err) => {
        setError(err.message || "Failed to load meeting")
        setCallState("error")
      })
  }, [meetingId])

  // Join call - fetch token
  const handleJoin = useCallback(async () => {
    if (!meetingId) return
    setCallState("joining")
    try {
      const res = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to get call token")
      }
      const { token: t } = await res.json()
      setToken(t)
      setCallState("connected")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to join call")
      setCallState("pre-join")
    }
  }, [meetingId])

  // Leave call - redirect to role-specific meetings page
  const handleLeave = useCallback(() => {
    setCallState("ended")
    const role = session?.user?.role?.toLowerCase()
    if (role === "admin") router.push("/admin/meetings")
    else if (role === "parent") router.push("/parent/meetings")
    else router.push("/student/meetings")
  }, [session, router])

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || ""

  // Loading state
  if (callState === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    )
  }

  // Error state
  if (callState === "error") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 px-4">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
          </div>
          <h1 className="text-xl font-semibold text-white">{error}</h1>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="gap-2 border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  // Call ended
  if (callState === "ended") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 px-4">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-semibold text-white">Call ended</h1>
          <p className="text-sm text-white/50">Redirecting to meetings...</p>
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-white/50" />
        </div>
      </div>
    )
  }

  // Connected - show video room
  if (callState === "connected" && token && meeting) {
    return (
      <VideoRoom
        token={token}
        serverUrl={serverUrl}
        meetingTitle={meeting.title}
        onLeave={handleLeave}
      />
    )
  }

  // Pre-join screen
  if (meeting) {
    return (
      <PreJoinScreen
        meetingTitle={meeting.title}
        meetingDescription={meeting.description}
        participants={meeting.participants.map((p) => p.user)}
        joining={callState === "joining"}
        onJoin={handleJoin}
      />
    )
  }

  return null
}
