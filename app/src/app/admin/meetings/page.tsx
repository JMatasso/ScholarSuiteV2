"use client"

import * as React from "react"
import { motion } from "motion/react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import Link from "next/link"
import { Plus, Video, Clock, Calendar, MapPin, Search, Users, X, UserPlus } from "lucide-react"
import { toast } from "sonner"

interface MeetingParticipant {
  id: string
  isHost: boolean
  hasAccepted: boolean
  user: { id: string; name?: string | null; image?: string | null }
}

interface Meeting {
  id: string
  title: string
  description?: string | null
  startTime: string
  endTime: string
  meetingUrl?: string | null
  isVideoCall: boolean
  status: string
  participants: MeetingParticipant[]
}

interface UserOption {
  id: string
  name: string | null
  email: string | null
  role: string
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

function getInitials(name?: string | null) {
  if (!name) return "?"
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = React.useState<Meeting[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showForm, setShowForm] = React.useState(false)
  const [form, setForm] = React.useState({
    title: "", description: "", startTime: "", endTime: "", meetingUrl: "", isVideoCall: false,
  })
  const [selectedParticipantIds, setSelectedParticipantIds] = React.useState<Set<string>>(new Set())

  // Participant picker
  const [allUsers, setAllUsers] = React.useState<UserOption[]>([])
  const [usersLoading, setUsersLoading] = React.useState(false)
  const [participantSearch, setParticipantSearch] = React.useState("")

  // Reschedule
  const [rescheduleId, setRescheduleId] = React.useState<string | null>(null)
  const [rescheduleForm, setRescheduleForm] = React.useState({ startTime: "", endTime: "" })

  // Add participants to existing meeting
  const [addParticipantsDialogOpen, setAddParticipantsDialogOpen] = React.useState(false)
  const [addParticipantsMeetingId, setAddParticipantsMeetingId] = React.useState<string | null>(null)
  const [addParticipantsSelected, setAddParticipantsSelected] = React.useState<Set<string>>(new Set())
  const [addParticipantsSearch, setAddParticipantsSearch] = React.useState("")
  const [addingParticipants, setAddingParticipants] = React.useState(false)

  const loadMeetings = React.useCallback(() => {
    fetch("/api/meetings")
      .then(res => res.json())
      .then(d => { setMeetings(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { toast.error("Failed to load meetings"); setLoading(false) })
  }, [])

  React.useEffect(() => { loadMeetings() }, [loadMeetings])

  const loadUsers = React.useCallback(() => {
    if (allUsers.length > 0) return
    setUsersLoading(true)
    fetch("/api/students")
      .then(res => res.json())
      .then(students => {
        const studentList = (Array.isArray(students) ? students : []).map((s: { id: string; name: string | null; email: string | null }) => ({ ...s, role: "STUDENT" }))
        // Also load parents
        fetch("/api/parents")
          .then(res => res.json())
          .then(parents => {
            const parentList = (Array.isArray(parents) ? parents : []).map((p: { id: string; name: string | null; email: string | null }) => ({ ...p, role: "PARENT" }))
            setAllUsers([...studentList, ...parentList])
            setUsersLoading(false)
          })
          .catch(() => { setAllUsers(studentList); setUsersLoading(false) })
      })
      .catch(() => { setUsersLoading(false) })
  }, [allUsers.length])

  const handleShowForm = () => {
    setShowForm(true)
    setSelectedParticipantIds(new Set())
    loadUsers()
  }

  const toggleParticipant = (userId: string) => {
    setSelectedParticipantIds(prev => {
      const next = new Set(prev)
      next.has(userId) ? next.delete(userId) : next.add(userId)
      return next
    })
  }

  const filteredUsers = React.useMemo(() => {
    const q = participantSearch.toLowerCase()
    return allUsers.filter(u => {
      if (!q) return true
      return (u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
    })
  }, [allUsers, participantSearch])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          participantIds: Array.from(selectedParticipantIds),
        }),
      })
      if (!res.ok) throw new Error()
      const count = selectedParticipantIds.size
      toast.success(`Meeting scheduled${count > 0 ? ` with ${count} participant${count !== 1 ? "s" : ""}` : ""}`)
      setShowForm(false)
      setForm({ title: "", description: "", startTime: "", endTime: "", meetingUrl: "", isVideoCall: false })
      setSelectedParticipantIds(new Set())
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
        body: JSON.stringify({ startTime: rescheduleForm.startTime, endTime: rescheduleForm.endTime }),
      })
      if (!res.ok) throw new Error()
      toast.success("Meeting rescheduled")
      setRescheduleId(null)
      loadMeetings()
    } catch {
      toast.error("Failed to reschedule meeting")
    }
  }

  // Add participants to existing meeting
  const openAddParticipants = (meetingId: string) => {
    setAddParticipantsMeetingId(meetingId)
    setAddParticipantsSelected(new Set())
    setAddParticipantsSearch("")
    setAddParticipantsDialogOpen(true)
    loadUsers()
  }

  const handleAddParticipants = async () => {
    if (!addParticipantsMeetingId || addParticipantsSelected.size === 0) return
    setAddingParticipants(true)
    try {
      const res = await fetch(`/api/meetings/${addParticipantsMeetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addParticipantIds: Array.from(addParticipantsSelected) }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Added ${addParticipantsSelected.size} participant(s)`)
      setAddParticipantsDialogOpen(false)
      loadMeetings()
    } catch {
      toast.error("Failed to add participants")
    }
    setAddingParticipants(false)
  }

  const handleRemoveParticipant = async (meetingId: string, userId: string) => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeParticipantIds: [userId] }),
      })
      if (!res.ok) throw new Error()
      toast.success("Participant removed")
      loadMeetings()
    } catch {
      toast.error("Failed to remove participant")
    }
  }

  const existingParticipantIds = React.useMemo(() => {
    if (!addParticipantsMeetingId) return new Set<string>()
    const meeting = meetings.find(m => m.id === addParticipantsMeetingId)
    return new Set(meeting?.participants.map(p => p.user.id) || [])
  }, [addParticipantsMeetingId, meetings])

  const filteredAddUsers = React.useMemo(() => {
    const q = addParticipantsSearch.toLowerCase()
    return allUsers.filter(u => {
      if (existingParticipantIds.has(u.id)) return false
      if (!q) return true
      return (u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
    })
  }, [allUsers, addParticipantsSearch, existingParticipantIds])

  const upcoming = meetings.filter(m => m.status === "SCHEDULED" || m.status === "PENDING_APPROVAL")
  const past = meetings.filter(m => m.status === "COMPLETED" || m.status === "CANCELLED")

  const getMeetingType = (meeting: Meeting) => {
    if (meeting.isVideoCall) return "Video Call"
    if (meeting.meetingUrl) return "External Link"
    return "In-Person"
  }

  const renderParticipants = (meeting: Meeting) => {
    const others = meeting.participants.filter(p => !p.isHost)
    if (others.length === 0) return <span className="text-xs text-muted-foreground italic">No participants added</span>
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex -space-x-1.5">
          {others.slice(0, 4).map(p => (
            <Avatar key={p.id} size="sm" className="ring-2 ring-white">
              <AvatarFallback className="text-[9px]">{getInitials(p.user.name)}</AvatarFallback>
            </Avatar>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {others.length} participant{others.length !== 1 ? "s" : ""}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Meetings"
        description="Schedule and manage consultation meetings."
        actions={
          <Button size="sm" className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2" onClick={handleShowForm}>
            <Plus className="size-3.5" /> Schedule Meeting
          </Button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl bg-white p-5 ring-1 ring-foreground/10">
          <h3 className="mb-4 text-sm font-semibold text-[#1E3A5F]">Schedule Meeting</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Title *</label>
              <Input required type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="h-9" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Start Time *</label>
              <Input required type="datetime-local" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} className="h-9" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">End Time *</label>
              <Input required type="datetime-local" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} className="h-9" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
              <Input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="h-9" />
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Video Call</p>
                <p className="text-xs text-muted-foreground">Enable in-app video calling for this meeting</p>
              </div>
              <Switch
                checked={form.isVideoCall}
                onCheckedChange={(checked) => setForm(p => ({ ...p, isVideoCall: checked, meetingUrl: checked ? "" : p.meetingUrl }))}
              />
            </div>
            {!form.isVideoCall && (
              <div className="col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">External Meeting URL <span className="font-normal">(optional)</span></label>
                <Input type="url" value={form.meetingUrl} onChange={e => setForm(p => ({ ...p, meetingUrl: e.target.value }))} placeholder="https://meet.google.com/..." className="h-9" />
              </div>
            )}

            {/* Participant Picker */}
            <div className="col-span-2 space-y-3">
              <label className="block text-xs font-medium text-muted-foreground">
                <Users className="inline h-3.5 w-3.5 mr-1" />
                Add Participants (Students & Parents)
              </label>

              {/* Selected participants */}
              {selectedParticipantIds.size > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(selectedParticipantIds).map(uid => {
                    const user = allUsers.find(u => u.id === uid)
                    return (
                      <span key={uid} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        {user?.name || "Unknown"}
                        <button type="button" onClick={() => toggleParticipant(uid)} className="hover:text-blue-900">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search students and parents..."
                  className="pl-9 h-9"
                  value={participantSearch}
                  onChange={e => setParticipantSearch(e.target.value)}
                />
              </div>

              <div className="max-h-40 overflow-y-auto space-y-0.5 rounded-lg border border-gray-200 p-1.5">
                {usersLoading ? (
                  <p className="text-xs text-muted-foreground text-center py-3">Loading users...</p>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    {participantSearch ? "No matches" : "No users found"}
                  </p>
                ) : (
                  filteredUsers.slice(0, 30).map(user => (
                    <label key={user.id} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted/50 cursor-pointer">
                      <Checkbox
                        checked={selectedParticipantIds.has(user.id)}
                        onCheckedChange={() => toggleParticipant(user.id)}
                      />
                      <Avatar size="sm">
                        <AvatarFallback className="text-[9px]">{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{user.name || "Unknown"}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{user.email} · {user.role}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="bg-[#2563EB] hover:bg-[#2563EB]/90">Schedule Meeting</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {rescheduleId && (
        <form onSubmit={handleReschedule} className="rounded-xl bg-white p-5 ring-1 ring-foreground/10">
          <h3 className="mb-4 text-sm font-semibold text-[#1E3A5F]">Reschedule Meeting</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">New Start Time *</label>
              <Input required type="datetime-local" value={rescheduleForm.startTime}
                onChange={e => setRescheduleForm(p => ({ ...p, startTime: e.target.value }))} className="h-9" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">New End Time *</label>
              <Input required type="datetime-local" value={rescheduleForm.endTime}
                onChange={e => setRescheduleForm(p => ({ ...p, endTime: e.target.value }))} className="h-9" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="bg-[#2563EB] hover:bg-[#2563EB]/90">Confirm Reschedule</Button>
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
            <h2 className="mb-3 text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide">Upcoming</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming meetings.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {upcoming.map((meeting, index) => {
                  const start = new Date(meeting.startTime)
                  const end = new Date(meeting.endTime)
                  const durationMin = Math.round((end.getTime() - start.getTime()) / 60000)
                  const durationLabel = durationMin >= 60 ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m` : `${durationMin} min`
                  const TypeIcon = meeting.isVideoCall || meeting.meetingUrl ? Video : MapPin
                  const others = meeting.participants.filter(p => !p.isHost)
                  return (
                    <motion.div
                      key={meeting.id}
                      className="rounded-xl bg-white p-4 ring-1 ring-foreground/10 transition-shadow hover:shadow-sm"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-[#1E3A5F]/5 text-[#1E3A5F]">
                          <Calendar className="size-4 mb-0.5" />
                          <span className="text-[10px] font-medium">{start.toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-medium text-foreground">{meeting.title}</h3>
                            <span className={`inline-flex h-4 items-center rounded-full px-1.5 text-[10px] font-medium ring-1 ring-inset ${statusColors[meeting.status] || "bg-gray-100 text-gray-600 ring-gray-300"}`}>
                              {statusLabels[meeting.status] || meeting.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                            <span className="flex items-center gap-1"><Clock className="size-3" /> {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ({durationLabel})</span>
                            <span className="flex items-center gap-1"><TypeIcon className="size-3" /> {getMeetingType(meeting)}</span>
                          </div>
                          {meeting.description && <p className="text-xs text-muted-foreground/70 mb-2">{meeting.description}</p>}

                          {/* Participants */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {renderParticipants(meeting)}
                            {others.length > 0 && (
                              <div className="flex flex-wrap gap-1 ml-1">
                                {others.map(p => (
                                  <span key={p.id} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                    p.hasAccepted ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                  }`}>
                                    {p.user.name || "Unknown"}
                                    {p.hasAccepted ? " ✓" : " pending"}
                                    <button
                                      onClick={() => handleRemoveParticipant(meeting.id, p.user.id)}
                                      className="hover:text-rose-600 ml-0.5"
                                    >
                                      <X className="h-2.5 w-2.5" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button variant="outline" size="xs" className="gap-1" onClick={() => openAddParticipants(meeting.id)}>
                            <UserPlus className="size-3" /> Add
                          </Button>
                          <Button variant="outline" size="xs" onClick={() => {
                            setRescheduleId(meeting.id)
                            setRescheduleForm({
                              startTime: meeting.startTime.substring(0, 16),
                              endTime: meeting.endTime.substring(0, 16),
                            })
                          }}>Reschedule</Button>
                          {meeting.isVideoCall ? (
                            <Link href={`/call/${meeting.id}`}>
                              <Button size="xs" className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-1"><Video className="size-3" /> Join</Button>
                            </Link>
                          ) : meeting.meetingUrl ? (
                            <a href={meeting.meetingUrl} target="_blank" rel="noopener noreferrer">
                              <Button size="xs" className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-1"><Video className="size-3" /> Join</Button>
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide">Past Meetings</h2>
              <div className="flex flex-col gap-3">
                {past.map((meeting, index) => {
                  const start = new Date(meeting.startTime)
                  const durationMin = Math.round((new Date(meeting.endTime).getTime() - start.getTime()) / 60000)
                  const durationLabel = durationMin >= 60 ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m` : `${durationMin} min`
                  const TypeIcon = meeting.isVideoCall || meeting.meetingUrl ? Video : MapPin
                  return (
                    <motion.div
                      key={meeting.id}
                      className="flex items-center gap-4 rounded-xl bg-white p-4 ring-1 ring-foreground/10 opacity-60"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.6 }}
                      transition={{ duration: 0.4, delay: index * 0.08 }}
                    >
                      <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Calendar className="size-4 mb-0.5" />
                        <span className="text-[10px] font-medium">{start.toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-medium text-foreground">{meeting.title}</h3>
                          <span className={`inline-flex h-4 items-center rounded-full px-1.5 text-[10px] font-medium ring-1 ring-inset ${statusColors[meeting.status]}`}>
                            {statusLabels[meeting.status] || meeting.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {renderParticipants(meeting)}
                          <span>{start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ({durationLabel})</span>
                          <span className="flex items-center gap-1"><TypeIcon className="size-3" /> {getMeetingType(meeting)}</span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Participants Dialog */}
      <Dialog open={addParticipantsDialogOpen} onOpenChange={setAddParticipantsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Participants</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search students and parents..."
                className="pl-9"
                value={addParticipantsSearch}
                onChange={e => setAddParticipantsSearch(e.target.value)}
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-0.5 rounded-lg border border-gray-200 p-1.5">
              {usersLoading ? (
                <p className="text-xs text-muted-foreground text-center py-4">Loading...</p>
              ) : filteredAddUsers.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {addParticipantsSearch ? "No matches" : "All users are already participants"}
                </p>
              ) : (
                filteredAddUsers.slice(0, 30).map(user => (
                  <label key={user.id} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted/50 cursor-pointer">
                    <Checkbox
                      checked={addParticipantsSelected.has(user.id)}
                      onCheckedChange={() => {
                        setAddParticipantsSelected(prev => {
                          const next = new Set(prev)
                          next.has(user.id) ? next.delete(user.id) : next.add(user.id)
                          return next
                        })
                      }}
                    />
                    <Avatar size="sm">
                      <AvatarFallback className="text-[9px]">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{user.name || "Unknown"}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{user.email} · {user.role}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddParticipantsDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2"
              onClick={handleAddParticipants}
              disabled={addingParticipants || addParticipantsSelected.size === 0}
            >
              <UserPlus className="h-4 w-4" />
              {addingParticipants ? "Adding..." : `Add ${addParticipantsSelected.size} Selected`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
