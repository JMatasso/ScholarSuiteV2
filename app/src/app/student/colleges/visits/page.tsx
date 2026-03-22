"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  MapPin,
  Plus,
  Calendar,
  Trash2,
  Edit,
  CheckCircle2,
  Clock,
  Star,
  Eye,
  Video,
  Users,
  Moon,
  Mic,
} from "@/lib/icons"
import { toast } from "sonner"
import LoaderOne from "@/components/ui/loader-one"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/components/ui/empty-state"
import { StatCard } from "@/components/ui/stat-card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDate } from "@/lib/format"

/* ---------- types ---------- */

interface CollegeApp {
  id: string
  universityName: string
}

interface CollegeVisit {
  id: string
  collegeApplicationId: string
  userId: string
  type: string
  scheduledAt: string
  completed: boolean
  notes: string | null
  rating: number | null
  calendarEventId: string | null
  createdAt: string
  updatedAt: string
  collegeApplication: {
    id: string
    universityName: string
    userId: string
  }
}

const VISIT_TYPES = [
  { value: "CAMPUS_TOUR", label: "Campus Tour", icon: MapPin },
  { value: "INFO_SESSION", label: "Info Session", icon: Users },
  { value: "OPEN_HOUSE", label: "Open House", icon: Eye },
  { value: "OVERNIGHT", label: "Overnight", icon: Moon },
  { value: "VIRTUAL", label: "Virtual", icon: Video },
  { value: "INTERVIEW", label: "Interview", icon: Mic },
]

function getVisitTypeLabel(type: string) {
  return VISIT_TYPES.find((t) => t.value === type)?.label || type.replace(/_/g, " ")
}

function getVisitTypeIcon(type: string) {
  return VISIT_TYPES.find((t) => t.value === type)?.icon || MapPin
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }) + " at " + d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

/* ---------- star rating ---------- */

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
}) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition-colors ${readonly ? "cursor-default" : "cursor-pointer"}`}
        >
          <Star
            className={`h-5 w-5 ${
              star <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  )
}

/* ---------- component ---------- */

export default function CollegeVisitsPage() {
  const [visits, setVisits] = useState<CollegeVisit[]>([])
  const [collegeApps, setCollegeApps] = useState<CollegeApp[]>([])
  const [loading, setLoading] = useState(true)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingVisit, setEditingVisit] = useState<CollegeVisit | null>(null)
  const [completingVisit, setCompletingVisit] = useState<CollegeVisit | null>(null)
  const [saving, setSaving] = useState(false)

  // Schedule form state
  const [formAppId, setFormAppId] = useState("")
  const [formType, setFormType] = useState("CAMPUS_TOUR")
  const [formDate, setFormDate] = useState("")
  const [formTime, setFormTime] = useState("")
  const [formNotes, setFormNotes] = useState("")

  // Complete form state
  const [completeRating, setCompleteRating] = useState(0)
  const [completeNotes, setCompleteNotes] = useState("")

  // Edit form state
  const [editType, setEditType] = useState("CAMPUS_TOUR")
  const [editDate, setEditDate] = useState("")
  const [editTime, setEditTime] = useState("")
  const [editNotes, setEditNotes] = useState("")

  const fetchVisits = useCallback(async () => {
    try {
      const res = await fetch("/api/college-applications/visits")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setVisits(data)
    } catch {
      toast.error("Failed to load visits")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCollegeApps = useCallback(async () => {
    try {
      const res = await fetch("/api/college-applications")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setCollegeApps(data.map((a: CollegeApp) => ({ id: a.id, universityName: a.universityName })))
    } catch {
      toast.error("Failed to load college list")
    }
  }, [])

  useEffect(() => {
    fetchVisits()
    fetchCollegeApps()
  }, [fetchVisits, fetchCollegeApps])

  function resetScheduleForm() {
    setFormAppId("")
    setFormType("CAMPUS_TOUR")
    setFormDate("")
    setFormTime("")
    setFormNotes("")
  }

  function resetCompleteForm() {
    setCompleteRating(0)
    setCompleteNotes("")
    setCompletingVisit(null)
  }

  function resetEditForm() {
    setEditType("CAMPUS_TOUR")
    setEditDate("")
    setEditTime("")
    setEditNotes("")
    setEditingVisit(null)
  }

  async function handleSchedule() {
    if (!formAppId) {
      toast.error("Please select a college")
      return
    }
    if (!formDate || !formTime) {
      toast.error("Please set a date and time")
      return
    }
    setSaving(true)
    try {
      const scheduledAt = new Date(`${formDate}T${formTime}`)
      const res = await fetch("/api/college-applications/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collegeApplicationId: formAppId,
          type: formType,
          scheduledAt: scheduledAt.toISOString(),
          notes: formNotes || null,
        }),
      })
      if (!res.ok) throw new Error("Failed to schedule visit")
      toast.success("Visit scheduled")
      setScheduleOpen(false)
      resetScheduleForm()
      fetchVisits()
    } catch {
      toast.error("Failed to schedule visit")
    } finally {
      setSaving(false)
    }
  }

  async function handleComplete() {
    if (!completingVisit) return
    if (completeRating === 0) {
      toast.error("Please provide a rating")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/college-applications/visits/${completingVisit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed: true,
          rating: completeRating,
          notes: completeNotes || completingVisit.notes || null,
        }),
      })
      if (!res.ok) throw new Error("Failed to complete visit")
      toast.success("Visit marked as completed")
      setCompleteOpen(false)
      resetCompleteForm()
      fetchVisits()
    } catch {
      toast.error("Failed to complete visit")
    } finally {
      setSaving(false)
    }
  }

  function openEdit(visit: CollegeVisit) {
    setEditingVisit(visit)
    setEditType(visit.type)
    const d = new Date(visit.scheduledAt)
    setEditDate(d.toISOString().split("T")[0])
    setEditTime(d.toTimeString().slice(0, 5))
    setEditNotes(visit.notes || "")
    setEditOpen(true)
  }

  async function handleEdit() {
    if (!editingVisit) return
    if (!editDate || !editTime) {
      toast.error("Please set a date and time")
      return
    }
    setSaving(true)
    try {
      const scheduledAt = new Date(`${editDate}T${editTime}`)
      const res = await fetch(`/api/college-applications/visits/${editingVisit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editType,
          scheduledAt: scheduledAt.toISOString(),
          notes: editNotes || null,
        }),
      })
      if (!res.ok) throw new Error("Failed to update visit")
      toast.success("Visit updated")
      setEditOpen(false)
      resetEditForm()
      fetchVisits()
    } catch {
      toast.error("Failed to update visit")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(visit: CollegeVisit) {
    try {
      const res = await fetch(`/api/college-applications/visits/${visit.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete")
      setVisits((prev) => prev.filter((v) => v.id !== visit.id))
      toast.success("Visit deleted")
    } catch {
      toast.error("Failed to delete visit")
    }
  }

  // Partition visits
  const now = new Date()
  const upcoming = visits.filter(
    (v) => !v.completed && new Date(v.scheduledAt) >= now
  )
  const past = visits.filter(
    (v) => v.completed || new Date(v.scheduledAt) < now
  )

  // Stats
  const totalScheduled = visits.length
  const completedCount = visits.filter((v) => v.completed).length
  const upcomingCount = upcoming.length
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const thisMonthCount = visits.filter((v) => {
    const d = new Date(v.scheduledAt)
    return d >= startOfMonth && d <= endOfMonth
  }).length

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-secondary-foreground">
            College Visits
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track campus tours, info sessions, interviews, and more.
          </p>
        </div>
        <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
          <DialogTrigger
            render={
              <Button className="gap-2" />
}
          >
            <Plus className="h-4 w-4" />
            Schedule Visit
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule a Visit</DialogTitle>
              <DialogDescription>
                Plan a campus tour, info session, or other college visit.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  College *
                </label>
                <Select value={formAppId} onValueChange={(v) => { if (v) setFormAppId(v) }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a college" />
                  </SelectTrigger>
                  <SelectContent>
                    {collegeApps.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.universityName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Visit Type
                </label>
                <Select value={formType} onValueChange={(v) => { if (v) setFormType(v) }}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Date *
                  </label>
                  <Input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Time *
                  </label>
                  <Input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Notes
                </label>
                <Textarea
                  placeholder="Any preparation notes, directions, parking info..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setScheduleOpen(false)
                  resetScheduleForm()
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSchedule}
                disabled={saving}
              >
                {saving ? "Scheduling..." : "Schedule Visit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Scheduled"
          value={totalScheduled}
          icon={Calendar}
          index={0}
        />
        <StatCard
          title="Completed"
          value={completedCount}
          icon={CheckCircle2}
          index={1}
        />
        <StatCard
          title="Upcoming"
          value={upcomingCount}
          icon={Clock}
          index={2}
        />
        <StatCard
          title="This Month"
          value={thisMonthCount}
          icon={MapPin}
          index={3}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <LoaderOne />
        </div>
      ) : visits.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No visits scheduled yet"
          description="Schedule campus tours, info sessions, and interviews to explore your college options."
          action={
            <Button
              className="gap-2"
              onClick={() => setScheduleOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Schedule Your First Visit
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {/* Upcoming Visits */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-secondary-foreground uppercase tracking-wide">
              Upcoming Visits ({upcoming.length})
            </h2>
            {upcoming.length === 0 ? (
              <Card variant="bento">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No upcoming visits scheduled.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {upcoming.map((visit, i) => {
                    const TypeIcon = getVisitTypeIcon(visit.type)
                    return (
                      <motion.div
                        key={visit.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{
                          duration: 0.3,
                          delay: i * 0.05,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      >
                        <VisitCard
                          visit={visit}
                          TypeIcon={TypeIcon}
                          onMarkComplete={(v) => {
                            setCompletingVisit(v)
                            setCompleteNotes(v.notes || "")
                            setCompleteOpen(true)
                          }}
                          onEdit={openEdit}
                          onDelete={handleDelete}
                        />
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </section>

          {/* Past Visits */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-secondary-foreground uppercase tracking-wide">
              Past Visits ({past.length})
            </h2>
            {past.length === 0 ? (
              <Card variant="bento">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No past visits yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {past.map((visit, i) => {
                    const TypeIcon = getVisitTypeIcon(visit.type)
                    return (
                      <motion.div
                        key={visit.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{
                          duration: 0.3,
                          delay: i * 0.05,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      >
                        <VisitCard
                          visit={visit}
                          TypeIcon={TypeIcon}
                          onMarkComplete={(v) => {
                            setCompletingVisit(v)
                            setCompleteNotes(v.notes || "")
                            setCompleteOpen(true)
                          }}
                          onEdit={openEdit}
                          onDelete={handleDelete}
                        />
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Complete Visit Dialog */}
      <Dialog
        open={completeOpen}
        onOpenChange={(open) => {
          setCompleteOpen(open)
          if (!open) resetCompleteForm()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Visit</DialogTitle>
            <DialogDescription>
              Rate your experience at{" "}
              {completingVisit?.collegeApplication.universityName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Rating *
              </label>
              <StarRating value={completeRating} onChange={setCompleteRating} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Impressions & Notes
              </label>
              <Textarea
                placeholder="What did you think? Any standout moments, impressions of campus, facilities, student life..."
                value={completeNotes}
                onChange={(e) => setCompleteNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCompleteOpen(false)
                resetCompleteForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              disabled={saving}
            >
              {saving ? "Saving..." : "Mark Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Visit Dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) resetEditForm()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Visit</DialogTitle>
            <DialogDescription>
              Update details for your visit to{" "}
              {editingVisit?.collegeApplication.universityName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Visit Type
              </label>
              <Select value={editType} onValueChange={(v) => { if (v) setEditType(v) }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISIT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Date *
                </label>
                <Input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Time *
                </label>
                <Input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Notes
              </label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditOpen(false)
                resetEditForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ---------- visit card sub-component ---------- */

function VisitCard({
  visit,
  TypeIcon,
  onMarkComplete,
  onEdit,
  onDelete,
}: {
  visit: CollegeVisit
  TypeIcon: typeof MapPin
  onMarkComplete: (v: CollegeVisit) => void
  onEdit: (v: CollegeVisit) => void
  onDelete: (v: CollegeVisit) => void
}) {
  const isUpcoming = !visit.completed && new Date(visit.scheduledAt) >= new Date()
  const isPastNotCompleted = !visit.completed && new Date(visit.scheduledAt) < new Date()

  const statusBadge = visit.completed
    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : isUpcoming
      ? "bg-blue-100 text-blue-700 border-blue-200"
      : "bg-amber-100 text-amber-700 border-amber-200"

  const statusLabel = visit.completed
    ? "Completed"
    : isUpcoming
      ? "Upcoming"
      : "Missed"

  return (
    <Card variant="bento">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-secondary-foreground">
              <TypeIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm truncate">
                {visit.collegeApplication.universityName}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {getVisitTypeLabel(visit.type)}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium shrink-0 ${statusBadge}`}
          >
            {statusLabel}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Date & time */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {formatDateTime(visit.scheduledAt)}
        </div>

        {/* Rating (completed only) */}
        {visit.completed && visit.rating != null && (
          <div className="flex items-center gap-2">
            <StarRating value={visit.rating} readonly />
            <span className="text-xs text-muted-foreground">
              {visit.rating}/5
            </span>
          </div>
        )}

        {/* Notes preview */}
        {visit.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {visit.notes}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
          <div>
            {!visit.completed && (
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => onMarkComplete(visit)}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Complete
              </Button>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(visit)}
              className="text-muted-foreground hover:text-[#2563EB]"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(visit)}
              className="text-muted-foreground hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
