"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Video,
  Plus,
  Calendar,
  Clock,
  ExternalLink,
  CheckCircle2,
  MapPin,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { getInitials, formatDate, formatTimeOnly } from "@/lib/format"

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
  isVideoCall: boolean
  status: "SCHEDULED" | "PENDING_APPROVAL" | "CANCELLED" | "COMPLETED"
  participants: MeetingParticipant[]
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
  const [requestOpen, setRequestOpen] = useState(false)
  const [viewMeeting, setViewMeeting] = useState<Meeting | null>(null)
  const [saving, setSaving] = useState(false)
  const [reqForm, setReqForm] = useState({ title: "", description: "", startTime: "", endTime: "" })

  const handleRequestMeeting = async () => {
    if (!reqForm.title.trim() || !reqForm.startTime) { toast.error("Title and start time are required"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: reqForm.title,
          description: reqForm.description || null,
          startTime: new Date(reqForm.startTime).toISOString(),
          endTime: reqForm.endTime ? new Date(reqForm.endTime).toISOString() : new Date(new Date(reqForm.startTime).getTime() + 30 * 60000).toISOString(),
        }),
      })
      if (res.ok) {
        const meeting = await res.json()
        setMeetings((prev) => [...prev, meeting])
        toast.success("Meeting requested!")
        setRequestOpen(false)
        setReqForm({ title: "", description: "", startTime: "", endTime: "" })
      } else { toast.error("Failed to request meeting") }
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

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
                      {host?.user.image && <AvatarImage src={host.user.image} alt={hostName} />}
                      <AvatarFallback>{hostInitials}</AvatarFallback>
                    </Avatar>
                    <p className="text-xs font-medium">{hostName}</p>
                  </div>
                </div>
                {isUpcomingMeeting && meeting.isVideoCall && (
                  <Link href={`/call/${meeting.id}`}>
                    <Button size="sm" className="gap-1.5 bg-[#2563EB] hover:bg-[#2563EB]/90 shrink-0">
                      <Video className="h-3.5 w-3.5" />
                      Join Call
                    </Button>
                  </Link>
                )}
                {isUpcomingMeeting && !meeting.isVideoCall && meeting.meetingUrl && (
                  <Button
                    size="sm"
                    className="gap-1.5 bg-[#2563EB] hover:bg-[#2563EB]/90 shrink-0"
                    onClick={() => window.open(meeting.meetingUrl!, "_blank")}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Join
                  </Button>
                )}
                {isUpcomingMeeting && !meeting.isVideoCall && !meeting.meetingUrl && (
                  <Button size="sm" className="gap-1.5 bg-[#2563EB] hover:bg-[#2563EB]/90 shrink-0" onClick={() => setViewMeeting(meeting)}>
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
                  {formatTimeOnly(meeting.startTime)} ({getDuration(meeting.startTime, meeting.endTime)})
                </span>
                {meeting.isVideoCall || meeting.meetingUrl ? (
                  <span className="flex items-center gap-1">
                    <Video className="h-3 w-3" />
                    {meeting.isVideoCall ? "Video Call" : "External Link"}
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
        <Button className="gap-2 bg-[#2563EB] hover:bg-[#2563EB]/90" onClick={() => setRequestOpen(true)}>
          <Plus className="h-4 w-4" />
          Request Meeting
        </Button>

        <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request a Meeting</DialogTitle>
              <DialogDescription>Schedule a meeting with your counselor.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g., Scholarship Review" value={reqForm.title} onChange={(e) => setReqForm(f => ({...f, title: e.target.value}))} />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea className="mt-1 w-full rounded-md border px-3 py-2 text-sm resize-none" rows={2} placeholder="What would you like to discuss?" value={reqForm.description} onChange={(e) => setReqForm(f => ({...f, description: e.target.value}))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Start Time *</label>
                  <input type="datetime-local" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={reqForm.startTime} onChange={(e) => setReqForm(f => ({...f, startTime: e.target.value}))} />
                </div>
                <div>
                  <label className="text-sm font-medium">End Time</label>
                  <input type="datetime-local" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={reqForm.endTime} onChange={(e) => setReqForm(f => ({...f, endTime: e.target.value}))} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRequestOpen(false)}>Cancel</Button>
              <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90" onClick={handleRequestMeeting} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Request Meeting
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!viewMeeting} onOpenChange={() => setViewMeeting(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{viewMeeting?.title}</DialogTitle>
              <DialogDescription>In-person meeting details</DialogDescription>
            </DialogHeader>
            {viewMeeting && (
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-muted-foreground text-xs">Date</p><p className="font-medium">{formatDate(viewMeeting.startTime)}</p></div>
                  <div><p className="text-muted-foreground text-xs">Time</p><p className="font-medium">{formatTimeOnly(viewMeeting.startTime)} - {formatTimeOnly(viewMeeting.endTime)}</p></div>
                </div>
                {viewMeeting.description && <div><p className="text-muted-foreground text-xs">Description</p><p className="text-sm">{viewMeeting.description}</p></div>}
                <div><p className="text-muted-foreground text-xs">Type</p><p className="text-sm flex items-center gap-1"><MapPin className="h-3 w-3" /> In Person</p></div>
              </div>
            )}
          </DialogContent>
        </Dialog>
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
            {upcoming.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              >
                {renderMeetingCard(m, true)}
              </motion.div>
            ))}
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
            {completed.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true }}
              >
                {renderMeetingCard(m, false)}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
