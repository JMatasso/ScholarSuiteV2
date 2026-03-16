"use client"

import { Track } from "livekit-client"
import {
  useParticipants,
  useTracks,
  VideoTrack,
  AudioTrack,
  isTrackReference,
} from "@livekit/components-react"
import { cn } from "@/lib/utils"
import { User } from "lucide-react"

export function ParticipantGrid() {
  const participants = useParticipants()

  const cameraTracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false }
  )

  const screenShareTracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: false }
  )

  const audioTracks = useTracks(
    [{ source: Track.Source.Microphone, withPlaceholder: false }],
    { onlySubscribed: true }
  )

  const hasScreenShare = screenShareTracks.length > 0

  return (
    <div className="flex h-full w-full gap-3 p-3 pt-16 pb-24">
      {/* Audio tracks (hidden, just for playback) */}
      {audioTracks.filter(isTrackReference).map((trackRef) => (
        <AudioTrack
          key={trackRef.participant.sid + "-audio"}
          trackRef={trackRef}
        />
      ))}

      {/* Screen share takes main area */}
      {hasScreenShare && isTrackReference(screenShareTracks[0]) && (
        <div className="flex-1 min-w-0">
          <div className="relative h-full w-full rounded-2xl overflow-hidden bg-gray-800">
            <VideoTrack
              trackRef={screenShareTracks[0]}
              className="h-full w-full object-contain"
            />
            <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
              {screenShareTracks[0].participant.name || "Unknown"}&apos;s screen
            </div>
          </div>
        </div>
      )}

      {/* Participant video grid */}
      <div
        className={cn(
          "flex gap-3",
          hasScreenShare
            ? "w-60 flex-col overflow-y-auto shrink-0"
            : "flex-1 flex-wrap items-center justify-center content-center"
        )}
      >
        {cameraTracks.map((trackRef) => {
          const participant = trackRef.participant
          const hasVideo =
            trackRef.publication && !trackRef.publication.isMuted

          return (
            <div
              key={participant.sid}
              className={cn(
                "relative overflow-hidden rounded-2xl bg-gray-800 border border-white/5",
                hasScreenShare
                  ? "h-40 w-full shrink-0"
                  : getGridSize(participants.length)
              )}
            >
              {hasVideo && isTrackReference(trackRef) ? (
                <VideoTrack
                  trackRef={trackRef}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1E3A5F] text-white">
                    {participant.name ? (
                      <span className="text-xl font-semibold">
                        {participant.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </span>
                    ) : (
                      <User className="h-8 w-8" />
                    )}
                  </div>
                </div>
              )}

              <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
                {participant.name || "Guest"}
                {participant.isLocal && " (You)"}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getGridSize(count: number): string {
  if (count === 1) return "h-full w-full max-w-3xl mx-auto"
  if (count === 2) return "h-[calc(100%-0.75rem)] w-[calc(50%-0.375rem)]"
  if (count <= 4) return "h-[calc(50%-0.375rem)] w-[calc(50%-0.375rem)]"
  if (count <= 6) return "h-[calc(50%-0.375rem)] w-[calc(33.333%-0.5rem)]"
  return "h-[calc(33.333%-0.5rem)] w-[calc(33.333%-0.5rem)]"
}
