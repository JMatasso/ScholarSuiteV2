"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Video,
  Plus,
  Calendar,
  Clock,
  ExternalLink,
  CheckCircle2,
  MapPin,
} from "lucide-react"
import { toast } from "sonner"

interface MeetingParticipantUser {
  id: string
  name: string | null
  image: string | null
}

interface MeetingParticipant {
  id: string
  userId: string
  isHost: boolean
  hasAccepted: boolean
  user: MeetingParticipantUser
}

interface Meeting {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  meetingUrl: string | null
  status: "SCHEDULED" | "PENDING_APPROVAL" | "CANCELLED" | "COMPLETED"
  participants: MeetingParticipant[]
}

function getInitials(name: string | null): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

function getDuration(start: string, end: string): string {
  const diffMs = new Date(end).getTime() - new Date(start).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const remaining = mins % 60
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`
}

function isUpcoming(meeting: Meeting): boolean {
  return meeting.status === "SCHEDULED" || meeting.status === "PENDING_APPROVAL"
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/meetings")
      .then((res) => res.json())
      .then((data) => {
        setMeetings(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const upcoming = meetings.filter((m) => isUpcoming(m))
  const completed = meetings.filter((m) => m.status === "COMPLETED" || m.status === "CANCELLED")

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">Loading meetings...</p>
      </div>
    )
  }

  const renderMeetingCard = (meeting: Meeting, isUpcomingMeeting: boolean) => {
    const host = meeting.participants.find((p) => p.isHost)
    const hostName = host?.user.name ?? "Unknown"
    const hostInitials = getInitials(hostName)
    const dateParts = formatDate(meeting.startTime).split(" ")

    return (
      <Card
        key={meeting.id}
        className={`${isUpcomingMeeting ? "hover:shadow-sm" : "opacity-70 hover:opacity-100"} transition-all`}
      >
        <CardContent className="pt-0">
          <div className="flex items-start gap-4">
            {/* Date block */}
            <div className={`flex flex-col items-center rounded-lg px-3 py-2 text-center shrink-0 ${
              isUpcomingMeeting ? "bg-[#1E3A5F]/5" : "bg-muted/50"
            }`}>
              <span className="text-[10px] font-medium text-muted-foreground uppercase">
                {dateParts[0]}
              </span>
              <span className={`text-xl font-bold ${isUpcomingMeeting ? "text-[#1E3A5F]" : "text-muted-foreground"}`}>
                {dateParts[1]?.replace(",", "")}
              </span>
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{meeting.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar size="sm">
                      <AvatarFallback>{hostInitials}</AvatarFallback>
                    </Avatar>
                    <p className="text-xs font-medium">{hostName}</p>
                  </div>
                </div>
                {isUpcomingMeeting && meeting.meetingUrl && (
                  <Button
                    size="sm"
                    className="gap-1.5 bg-[#2563EB] hover:bg-[#2563EB]/90 shrink-0"
                    onClick={() => window.open(meeting.meetingUrl!, "_blank")}
                  >
                    <Video className="h-3.5 w-3.5" />
                    Join
                  </Button>
                )}
                {isUpcomingMeeting && !meeting.meetingUrl && (
                  <Button size="sm" className="gap-1.5 bg-[#2563EB] hover:bg-[#2563EB]/90 shrink-0">
                    <MapPin className="h-3.5 w-3.5" />
                    View
                  </Button>
                )}
                {!isUpcomingMeeting && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(meeting.startTime)} ({getDuration(meeting.startTime, meeting.endTime)})
                </span>
                {meeting.meetingUrl ? (
                  <span className="flex items-center gap-1">
                    <Video className="h-3 w-3" />
                    Video Call
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    In Person
                  </span>
                )}
              </div>

              {meeting.description && (
                <p className="text-xs text-muted-foreground/80 italic">
                  {meeting.description}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1E3A5F]">Meetings</h1>
          <p className="mt-1 text-muted-foreground">
            Schedule and manage meetings with your counselors and consultants.
          </p>
        </div>
        <Button className="gap-2 bg-[#2563EB] hover:bg-[#2563EB]/90">
          <Plus className="h-4 w-4" />
          Request Meeting
        </Button>
      </div>

      {/* Upcoming Meetings */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#2563EB]" />
          Upcoming ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground rounded-xl border bg-muted/20">
            No upcoming meetings scheduled.
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((m) => renderMeetingCard(m, true))}
          </div>
        )}
      </div>

      {/* Completed Meetings */}
      {completed.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Past Meetings ({completed.length})
          </h2>
          <div className="space-y-2.5">
            {completed.map((m) => renderMeetingCard(m, false))}
          </div>
        </div>
      )}
    </div>
  )
}
