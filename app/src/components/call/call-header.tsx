"use client"

import { useState, useEffect } from "react"
import { useParticipants } from "@livekit/components-react"
import { Users } from "lucide-react"

export function CallHeader({ title }: { title: string }) {
  const participants = useParticipants()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  const timeStr = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-gray-900/80 backdrop-blur-xl border-b border-white/10">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E3A5F] text-white text-sm font-bold">
          S
        </div>
        <span className="text-sm font-medium text-white">{title}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-white/60">
          <Users className="h-4 w-4" />
          <span className="text-sm">{participants.length}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-mono text-white/80">{timeStr}</span>
        </div>
      </div>
    </div>
  )
}
