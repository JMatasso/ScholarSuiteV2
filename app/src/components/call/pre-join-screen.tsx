"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Video, VideoOff, Mic, MicOff, PhoneCall, Loader2 } from "@/lib/icons"
import { getInitials } from "@/lib/format"

interface Participant {
  id: string
  name: string | null
  image: string | null
}

interface PreJoinScreenProps {
  meetingTitle: string
  meetingDescription?: string | null
  participants: Participant[]
  joining: boolean
  onJoin: () => void
}

export function PreJoinScreen({
  meetingTitle,
  meetingDescription,
  participants,
  joining,
  onJoin,
}: PreJoinScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [cameraOn, setCameraOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [stream, setStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    let active = true
    if (cameraOn) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: micOn })
        .then((s) => {
          if (!active) { s.getTracks().forEach((t) => t.stop()); return }
          setStream(s)
          if (videoRef.current) videoRef.current.srcObject = s
        })
        .catch(() => setCameraOn(false))
    } else {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
        setStream(null)
      }
    }
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOn])

  useEffect(() => {
    if (stream) {
      stream.getAudioTracks().forEach((t) => (t.enabled = micOn))
    }
  }, [micOn, stream])

  // Stop stream when joining (LiveKit will take over)
  useEffect(() => {
    if (joining && stream) {
      stream.getTracks().forEach((t) => t.stop())
    }
  }, [joining, stream])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Meeting info */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white">{meetingTitle}</h1>
          {meetingDescription && (
            <p className="mt-1 text-sm text-white/50">{meetingDescription}</p>
          )}
        </div>

        {/* Camera preview */}
        <div className="relative mx-auto aspect-video w-full max-w-xl overflow-hidden rounded-2xl bg-gray-800 border border-white/10">
          {cameraOn ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover -scale-x-100"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1E3A5F]">
                <VideoOff className="h-8 w-8 text-white" />
              </div>
            </div>
          )}

          {/* Device toggles */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            <button
              onClick={() => setMicOn(!micOn)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                micOn
                  ? "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                  : "bg-red-500/90 text-white hover:bg-red-500"
              }`}
            >
              {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setCameraOn(!cameraOn)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                cameraOn
                  ? "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                  : "bg-red-500/90 text-white hover:bg-red-500"
              }`}
            >
              {cameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Participants */}
        {participants.length > 0 && (
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-white/40 mr-1">In this meeting:</span>
            <div className="flex -space-x-2">
              {participants.slice(0, 5).map((p) => (
                <Avatar key={p.id} size="sm" className="border-2 border-gray-950">
                  <AvatarFallback className="bg-[#1E3A5F] text-white text-[10px]">
                    {getInitials(p.name || "?")}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            {participants.length > 5 && (
              <span className="text-xs text-white/40">
                +{participants.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* Join button */}
        <div className="flex justify-center">
          <Button
            onClick={onJoin}
            disabled={joining}
            className="text-white px-8 py-3 text-base rounded-xl gap-2 h-auto"
          >
            {joining ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <PhoneCall className="h-5 w-5" />
                Join Call
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
