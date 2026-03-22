"use client"

import { Track } from "livekit-client"
import {
  TrackToggle,
  DisconnectButton,
  useLocalParticipant,
} from "@livekit/components-react"
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff } from "@/lib/icons"
import { cn } from "@/lib/utils"

export function ControlBar({ onLeave }: { onLeave: () => void }) {
  const { isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } =
    useLocalParticipant()

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-2xl bg-gray-900/90 px-4 py-3 shadow-2xl backdrop-blur-xl border border-white/10">
        <TrackToggle
          source={Track.Source.Microphone}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl transition-all",
            isMicrophoneEnabled
              ? "bg-white/10 text-white hover:bg-white/20"
              : "bg-red-500/90 text-white hover:bg-red-500"
          )}
        >
          {isMicrophoneEnabled ? (
            <Mic className="h-5 w-5" />
          ) : (
            <MicOff className="h-5 w-5" />
          )}
        </TrackToggle>

        <TrackToggle
          source={Track.Source.Camera}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl transition-all",
            isCameraEnabled
              ? "bg-white/10 text-white hover:bg-white/20"
              : "bg-red-500/90 text-white hover:bg-red-500"
          )}
        >
          {isCameraEnabled ? (
            <Video className="h-5 w-5" />
          ) : (
            <VideoOff className="h-5 w-5" />
          )}
        </TrackToggle>

        <TrackToggle
          source={Track.Source.ScreenShare}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl transition-all",
            isScreenShareEnabled
              ? "bg-[#2563EB] text-white hover:bg-[#2563EB]/90"
              : "bg-white/10 text-white hover:bg-white/20"
          )}
        >
          <MonitorUp className="h-5 w-5" />
        </TrackToggle>

        <div className="mx-2 h-8 w-px bg-white/20" />

        <DisconnectButton
          onClick={onLeave}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-white transition-all hover:bg-red-500"
        >
          <PhoneOff className="h-5 w-5" />
        </DisconnectButton>
      </div>
    </div>
  )
}
