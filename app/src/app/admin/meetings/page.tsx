"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Plus, Video, Clock, Calendar, MapPin } from "lucide-react"
import { toast } from "sonner"

interface MeetingParticipant {
  id: string
  isHost: boolean
  user: { id: string; name?: string | null; image?: string | null }
}

interface Meeting {
  id: string
  title: string
  description?: string | null
  startTime: string
  endTime: string
  meetingUrl?: string | null
  status: string
  participants: MeetingParticipant[]
}

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700 ring-blue-300",
  COMPLETED: "bg-green-50 text-green-700 ring-green-300",
  CANCELLED: "bg-red-50 text-red-700 ring-red-300",
  PENDING_APPROVAL: "bg-amber-50 text-amber-700 ring-amber-300",
}

const statusLabels: Record<string, string> = {
  SCHEDULED: "Upcoming",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  PENDING_APPROVAL: "Pending",
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = React.useState<Meeting[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showForm, setShowForm] = React.useState(false)
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    meetingUrl: "",
  })
  const [rescheduleId, setRescheduleId] = React.useState<string | null>(null)
  const [rescheduleForm, setRescheduleForm] = React.useState({ startTime: "", endTime: "" })

  const loadMeetings = React.useCallback(() => {
    fetch("/api/meetings")
      .then(res => res.json())
      .then(d => { setMeetings(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { toast.error("Failed to load meetings"); setLoading(false) })
  }, [])

  React.useEffect(() => { loadMeetings() }, [loadMeetings])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success("Meeting scheduled")
      setShowForm(false)
      setForm({ title: "", description: "", startTime: "", endTime: "", meetingUrl: "" })
      loadMeetings()
    } catch {
      toast.error("Failed to schedule meeting")
    }
  }

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rescheduleId) return
    try {
      const res = await fetch(`/api/meetings/${rescheduleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: rescheduleForm.startTime,
          endTime: rescheduleForm.endTime,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Meeting rescheduled")
      setRescheduleId(null)
      loadMeetings()
    } catch {
      toast.error("Failed to reschedule meeting")
    }
  }

  const upcoming = meetings.filter(m => m.status === "SCHEDULED" || m.status === "PENDING_APPROVAL")
  const past = meetings.filter(m => m.status === "COMPLETED" || m.status === "CANCELLED")

  const getMeetingType = (meeting: Meeting) => {
    if (meeting.meetingUrl) return "Video"
    return "In-Person"
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Meetings"
        description="Schedule and manage consultation meetings."
        actions={
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="size-3.5" /> Schedule Meeting
          </Button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl bg-white p-5 ring-1 ring-foreground/10">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Schedule Meeting</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-foreground mb-1">Title *</label>
              <Input required type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="h-9" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Start Time *</label>
              <Input required type="datetime-local" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                className="h-9" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">End Time *</label>
              <Input required type="datetime-local" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}
                className="h-9" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Meeting URL</label>
              <Input type="url" value={form.meetingUrl} onChange={e => setForm(p => ({ ...p, meetingUrl: e.target.value }))}
                placeholder="https://meet.google.com/..."
                className="h-9" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Description</label>
              <Input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="h-9" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">Schedule Meeting</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {rescheduleId && (
        <form onSubmit={handleReschedule} className="rounded-xl bg-white p-5 ring-1 ring-foreground/10">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Reschedule Meeting</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">New Start Time *</label>
              <Input required type="datetime-local" value={rescheduleForm.startTime}
                onChange={e => setRescheduleForm(p => ({ ...p, startTime: e.target.value }))}
                className="h-9" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">New End Time *</label>
              <Input required type="datetime-local" value={rescheduleForm.endTime}
                onChange={e => setRescheduleForm(p => ({ ...p, endTime: e.target.value }))}
                className="h-9" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">Confirm Reschedule</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setRescheduleId(null)}>Cancel</Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Loading meetings...</div>
      ) : (
        <>
          {/* Upcoming */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Upcoming</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming meetings.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {upcoming.map((meeting) => {
                  const start = new Date(meeting.startTime)
                  const end = new Date(meeting.endTime)
                  const durationMs = end.getTime() - start.getTime()
                  const durationMin = Math.round(durationMs / 60000)
                  const durationLabel = durationMin >= 60 ? `${Math.floor(durationMin / 60)} hr` : `${durationMin} min`
                  const TypeIcon = meeting.meetingUrl ? Video : MapPin
                  const otherParticipants = meeting.participants.filter(p => !p.isHost)
                  const firstOther = otherParticipants[0]
                  return (
                    <div key={meeting.id} className="flex items-center gap-4 rounded-xl bg-white p-4 ring-1 ring-foreground/10 transition-shadow hover:shadow-sm">
                      <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-[#1E3A5F]/5 text-[#1E3A5F]">
                        <Calendar className="size-4 mb-0.5" />
                        <span className="text-[10px] font-medium">{start.toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-medium text-foreground">{meeting.title}</h3>
                          <span className={`inline-flex h-4 items-center rounded-full px-1.5 text-[10px] font-medium ring-1 ring-inset ${statusColors[meeting.status] || "bg-gray-100 text-gray-600 ring-gray-300"}`}>
                            {statusLabels[meeting.status] || meeting.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {firstOther && (
                            <span className="flex items-center gap-1">
                              <Avatar size="sm"><AvatarFallback>{(firstOther.user.name || "?").substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                              {firstOther.user.name || "Unknown"}
                            </span>
                          )}
                          <span className="flex items-center gap-1"><Clock className="size-3" /> {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ({durationLabel})</span>
                          <span className="flex items-center gap-1"><TypeIcon className="size-3" /> {getMeetingType(meeting)}</span>
                        </div>
                        {meeting.description && <p className="mt-1 text-xs text-muted-foreground/70">{meeting.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="xs" onClick={() => {
                          setRescheduleId(meeting.id)
                          setRescheduleForm({
                            startTime: meeting.startTime.substring(0, 16),
                            endTime: meeting.endTime.substring(0, 16),
                          })
                        }}>Reschedule</Button>
                        {meeting.meetingUrl && (
                          <a href={meeting.meetingUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="xs"><Video className="size-3" /> Join</Button>
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-foreground">Past Meetings</h2>
              <div className="flex flex-col gap-3">
                {past.map((meeting) => {
                  const start = new Date(meeting.startTime)
                  const end = new Date(meeting.endTime)
                  const durationMs = end.getTime() - start.getTime()
                  const durationMin = Math.round(durationMs / 60000)
                  const durationLabel = durationMin >= 60 ? `${Math.floor(durationMin / 60)} hr` : `${durationMin} min`
                  const TypeIcon = meeting.meetingUrl ? Video : MapPin
                  const otherParticipants = meeting.participants.filter(p => !p.isHost)
                  const firstOther = otherParticipants[0]
                  return (
                    <div key={meeting.id} className="flex items-center gap-4 rounded-xl bg-white p-4 ring-1 ring-foreground/10 opacity-75">
                      <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Calendar className="size-4 mb-0.5" />
                        <span className="text-[10px] font-medium">{start.toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-medium text-foreground">{meeting.title}</h3>
                          <span className={`inline-flex h-4 items-center rounded-full px-1.5 text-[10px] font-medium ring-1 ring-inset ${statusColors[meeting.status] || "bg-gray-100 text-gray-600 ring-gray-300"}`}>
                            {statusLabels[meeting.status] || meeting.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {firstOther && <span>{firstOther.user.name || "Unknown"}</span>}
                          <span>{start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ({durationLabel})</span>
                          <span className="flex items-center gap-1"><TypeIcon className="size-3" /> {getMeetingType(meeting)}</span>
                        </div>
                        {meeting.description && <p className="mt-1 text-xs text-muted-foreground/70">{meeting.description}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
