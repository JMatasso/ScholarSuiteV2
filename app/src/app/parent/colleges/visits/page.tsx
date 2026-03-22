"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { StatCard } from "@/components/ui/stat-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import {
  MapPin,
  CalendarDays,
  CheckCircle2,
  Clock,
  Star,
  Save,
  MessageSquare,
} from "@/lib/icons"
import { formatDate } from "@/lib/format"
import { toast } from "sonner"

interface Visit {
  id: string
  type: string
  scheduledAt: string
  completed: boolean
  notes: string | null
  rating: number | null
  collegeApplication: {
    id: string
    universityName: string
  }
}

const visitTypeLabel: Record<string, string> = {
  CAMPUS_TOUR: "Campus Tour",
  INFO_SESSION: "Info Session",
  OPEN_HOUSE: "Open House",
  OVERNIGHT: "Overnight Visit",
  VIRTUAL: "Virtual Visit",
  INTERVIEW: "Interview",
}

const visitTypeColor: Record<string, string> = {
  CAMPUS_TOUR: "bg-blue-100 text-blue-700 border-blue-200",
  INFO_SESSION: "bg-purple-100 text-purple-700 border-purple-200",
  OPEN_HOUSE: "bg-amber-100 text-amber-700 border-amber-200",
  OVERNIGHT: "bg-teal-100 text-teal-700 border-teal-200",
  VIRTUAL: "bg-muted text-muted-foreground border-border",
  INTERVIEW: "bg-rose-100 text-rose-700 border-rose-200",
}

export default function ParentVisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesDraft, setNotesDraft] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/college-applications/visits")
      .then(r => r.json())
      .then(data => setVisits(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()

  const upcoming = useMemo(
    () =>
      visits
        .filter(v => !v.completed && new Date(v.scheduledAt) >= now)
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [visits, now]
  )

  const past = useMemo(
    () =>
      visits
        .filter(v => v.completed || new Date(v.scheduledAt) < now)
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()),
    [visits, now]
  )

  const totalVisits = visits.length
  const completedCount = visits.filter(v => v.completed).length
  const upcomingCount = upcoming.length

  async function handleSaveNotes(visitId: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/college-applications/visits/${visitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesDraft }),
      })
      if (!res.ok) throw new Error("Failed to save")
      const updated = await res.json()
      setVisits(prev => prev.map(v => (v.id === visitId ? { ...v, notes: updated.notes } : v)))
      setEditingNotes(null)
      toast.success("Notes saved")
    } catch {
      toast.error("Failed to save notes")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 skeleton-shimmer" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-28 rounded-2xl skeleton-shimmer" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl skeleton-shimmer" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-secondary-foreground">College Visits</h1>
        <p className="mt-1 text-muted-foreground">
          View your child&apos;s campus visit schedule. You can add your own notes to each visit.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total Visits" value={totalVisits} icon={MapPin} index={0} />
        <StatCard title="Upcoming" value={upcomingCount} icon={CalendarDays} index={1} />
        <StatCard title="Completed" value={completedCount} icon={CheckCircle2} index={2} />
      </div>

      {visits.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No visits scheduled"
          description="Your child hasn't scheduled any college visits yet. Visits will appear here once they are added."
        />
      ) : (
        <div className="space-y-8">
          {/* Upcoming Visits */}
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-secondary-foreground uppercase tracking-wide mb-3">
                Upcoming Visits
              </h2>
              <div className="space-y-3">
                {upcoming.map((visit, i) => (
                  <motion.div
                    key={visit.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <VisitCard
                      visit={visit}
                      editingNotes={editingNotes}
                      notesDraft={notesDraft}
                      saving={saving}
                      onStartEdit={(id, notes) => {
                        setEditingNotes(id)
                        setNotesDraft(notes || "")
                      }}
                      onCancelEdit={() => setEditingNotes(null)}
                      onChangeDraft={setNotesDraft}
                      onSave={handleSaveNotes}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Past Visits */}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-secondary-foreground uppercase tracking-wide mb-3">
                Past Visits
              </h2>
              <div className="space-y-3">
                {past.map((visit, i) => (
                  <motion.div
                    key={visit.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <VisitCard
                      visit={visit}
                      editingNotes={editingNotes}
                      notesDraft={notesDraft}
                      saving={saving}
                      onStartEdit={(id, notes) => {
                        setEditingNotes(id)
                        setNotesDraft(notes || "")
                      }}
                      onCancelEdit={() => setEditingNotes(null)}
                      onChangeDraft={setNotesDraft}
                      onSave={handleSaveNotes}
                      isPast
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function VisitCard({
  visit,
  editingNotes,
  notesDraft,
  saving,
  onStartEdit,
  onCancelEdit,
  onChangeDraft,
  onSave,
  isPast,
}: {
  visit: Visit
  editingNotes: string | null
  notesDraft: string
  saving: boolean
  onStartEdit: (id: string, notes: string | null) => void
  onCancelEdit: () => void
  onChangeDraft: (val: string) => void
  onSave: (id: string) => void
  isPast?: boolean
}) {
  const isEditing = editingNotes === visit.id

  return (
    <Card variant="bento" className={isPast ? "opacity-80" : ""}>
      <CardContent className="pt-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-secondary-foreground">
                {visit.collegeApplication.universityName}
              </h3>
              <Badge
                variant="secondary"
                className={`text-[10px] ${visitTypeColor[visit.type] || "bg-muted text-muted-foreground"}`}
              >
                {visitTypeLabel[visit.type] || visit.type}
              </Badge>
              {visit.completed && (
                <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700">
                  Completed
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {formatDate(visit.scheduledAt)}
              </span>
              <span>
                {new Date(visit.scheduledAt).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
              {visit.rating != null && (
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                  {visit.rating}/5
                </span>
              )}
            </div>
          </div>

          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-xs gap-1"
              onClick={() => onStartEdit(visit.id, visit.notes)}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {visit.notes ? "Edit Notes" : "Add Notes"}
            </Button>
          )}
        </div>

        {/* Notes display */}
        {visit.notes && !isEditing && (
          <div className="mt-3 rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{visit.notes}</p>
          </div>
        )}

        {/* Notes editing */}
        {isEditing && (
          <div className="mt-3 space-y-2">
            <Textarea
              value={notesDraft}
              onChange={e => onChangeDraft(e.target.value)}
              placeholder="Add your notes about this visit..."
              className="text-sm min-h-[80px]"
            />
            <div className="flex items-center gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={onCancelEdit}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="gap-1"
                onClick={() => onSave(visit.id)}
                disabled={saving}
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving..." : "Save Notes"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
