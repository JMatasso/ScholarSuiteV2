"use client"

import {
  LiveKitRoom,
  RoomAudioRenderer,
} from "@livekit/components-react"
import "@livekit/components-styles"
import { ParticipantGrid } from "./participant-grid"
import { ControlBar } from "./control-bar"
import { CallHeader } from "./call-header"

interface VideoRoomProps {
  token: string
  serverUrl: string
  meetingTitle: string
  onLeave: () => void
}

export function VideoRoom({
  token,
  serverUrl,
  meetingTitle,
  onLeave,
}: VideoRoomProps) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      video={true}
      audio={true}
      className="h-screen w-screen bg-gray-950"
      onDisconnected={onLeave}
    >
      <CallHeader title={meetingTitle} />
      <ParticipantGrid />
      <ControlBar onLeave={onLeave} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  )
}
