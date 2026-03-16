"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "motion/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Clock,
  Award,
  Users,
  Trophy,
  Palette,
  BookOpen,
  Heart,
  Dumbbell,
  Calendar,
  Loader2,
  FileDown,
  Pencil,
  Trash2,
  ShieldCheck,
  Lightbulb,
  AlertCircle,
  Briefcase,
  Rocket,
  FlaskConical,
  Globe,
  BadgeCheck,
  HandHeart,
  Medal,
  FolderKanban,
  GraduationCap,
  Activity,
  X,
  Hash,
} from "lucide-react"
import { toast } from "sonner"
import { formatDate } from "@/lib/format"

// ─── Types ──────────────────────────────────────────────────

type CategoryKey =
  | "ATHLETICS" | "ARTS" | "ACADEMIC" | "VOLUNTEER" | "WORK"
  | "LEADERSHIP" | "ENTREPRENEURSHIP" | "RESEARCH" | "STUDY_ABROAD"
  | "CERTIFICATION" | "MENTORING" | "AWARD" | "PROJECT"
  | "PROFESSIONAL_DEV" | "OTHER"

interface ActivityEntry {
  id: string
  title: string
  organization: string | null
  role: string | null
  category: CategoryKey
  description: string | null
  impactStatement: string | null
  skillsGained: string[]
  startDate: string | null
  endDate: string | null
  isOngoing: boolean
  hoursPerWeek: number | null
  totalHours: number | null
  isLeadership: boolean
  isAward: boolean
  isVerified: boolean
}

// ─── Category Config ────────────────────────────────────────

const categoryConfig: Record<CategoryKey, { label: string; icon: typeof Activity; color: string; bg: string; badgeBg: string; badgeText: string }> = {
  ATHLETICS:        { label: "Athletics",        icon: Dumbbell,      color: "text-orange-600",  bg: "bg-orange-50 border-orange-200",  badgeBg: "bg-orange-100",  badgeText: "text-orange-700" },
  ARTS:             { label: "Arts",             icon: Palette,       color: "text-purple-600",  bg: "bg-purple-50 border-purple-200",  badgeBg: "bg-purple-100",  badgeText: "text-purple-700" },
  ACADEMIC:         { label: "Academic",         icon: BookOpen,      color: "text-blue-600",    bg: "bg-blue-50 border-blue-200",      badgeBg: "bg-blue-100",    badgeText: "text-blue-700" },
  VOLUNTEER:        { label: "Volunteer",        icon: Heart,         color: "text-rose-600",    bg: "bg-rose-50 border-rose-200",      badgeBg: "bg-rose-100",    badgeText: "text-rose-700" },
  WORK:             { label: "Work",             icon: Briefcase,     color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200",badgeBg: "bg-emerald-100", badgeText: "text-emerald-700" },
  LEADERSHIP:       { label: "Leadership",       icon: Users,         color: "text-amber-600",   bg: "bg-amber-50 border-amber-200",    badgeBg: "bg-amber-100",   badgeText: "text-amber-700" },
  ENTREPRENEURSHIP: { label: "Entrepreneurship", icon: Rocket,        color: "text-cyan-600",    bg: "bg-cyan-50 border-cyan-200",      badgeBg: "bg-cyan-100",    badgeText: "text-cyan-700" },
  RESEARCH:         { label: "Research",         icon: FlaskConical,  color: "text-indigo-600",  bg: "bg-indigo-50 border-indigo-200",  badgeBg: "bg-indigo-100",  badgeText: "text-indigo-700" },
  STUDY_ABROAD:     { label: "Study Abroad",     icon: Globe,         color: "text-sky-600",     bg: "bg-sky-50 border-sky-200",        badgeBg: "bg-sky-100",     badgeText: "text-sky-700" },
  CERTIFICATION:    { label: "Certifications",   icon: BadgeCheck,    color: "text-violet-600",  bg: "bg-violet-50 border-violet-200",  badgeBg: "bg-violet-100",  badgeText: "text-violet-700" },
  MENTORING:        { label: "Mentoring",        icon: HandHeart,     color: "text-pink-600",    bg: "bg-pink-50 border-pink-200",      badgeBg: "bg-pink-100",    badgeText: "text-pink-700" },
  AWARD:            { label: "Awards",           icon: Medal,         color: "text-yellow-600",  bg: "bg-yellow-50 border-yellow-200",  badgeBg: "bg-yellow-100",  badgeText: "text-yellow-700" },
  PROJECT:          { label: "Projects",         icon: FolderKanban,  color: "text-green-600",   bg: "bg-green-50 border-green-200",    badgeBg: "bg-green-100",   badgeText: "text-green-700" },
  PROFESSIONAL_DEV: { label: "Professional Dev", icon: GraduationCap, color: "text-slate-600",   bg: "bg-slate-50 border-slate-200",    badgeBg: "bg-slate-100",   badgeText: "text-slate-700" },
  OTHER:            { label: "Other",            icon: Activity,      color: "text-gray-600",    bg: "bg-gray-50 border-gray-200",      badgeBg: "bg-gray-100",    badgeText: "text-gray-700" },
}

const ALL_CATEGORIES: CategoryKey[] = [
  "ATHLETICS", "ARTS", "ACADEMIC", "VOLUNTEER", "WORK", "LEADERSHIP",
  "ENTREPRENEURSHIP", "RESEARCH", "STUDY_ABROAD", "CERTIFICATION",
  "MENTORING", "AWARD", "PROJECT", "PROFESSIONAL_DEV", "OTHER",
]

const CATEGORY_ORDER: CategoryKey[] = [
  "ACADEMIC", "LEADERSHIP", "VOLUNTEER", "ATHLETICS", "ARTS", "WORK",
  "ENTREPRENEURSHIP", "RESEARCH", "STUDY_ABROAD", "CERTIFICATION",
  "MENTORING", "AWARD", "PROJECT", "PROFESSIONAL_DEV", "OTHER",
]

// ─── Helpers ────────────────────────────────────────────────

function formatDateRange(start: string | null, end: string | null, ongoing: boolean): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" })
  if (!start) return "No dates"
  return `${fmt(start)} - ${ongoing ? "Present" : end ? fmt(end) : "Present"}`
}

const emptyForm = {
  title: "",
  organization: "",
  role: "",
  category: "OTHER" as CategoryKey,
  description: "",
  impactStatement: "",
  skillsInput: "",
  skillsGained: [] as string[],
  startDate: "",
  endDate: "",
  isOngoing: false,
  hoursPerWeek: "",
  isLeadership: false,
  isAward: false,
}

type FormState = typeof emptyForm

// ─── Page Component ─────────────────────────────────────────

export default function BragSheetPage() {
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [filter, setFilter] = useState<CategoryKey | "ALL">("ALL")
  const [form, setForm] = useState<FormState>({ ...emptyForm })

  // ── Fetch ──
  useEffect(() => {
    fetch("/api/activities")
      .then((res) => res.json())
      .then((data) => {
        setActivities(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // ── Stats ──
  const totalEntries = activities.length
  const totalHours = activities.reduce((a, b) => a + (b.totalHours ?? 0), 0)
  const leadershipCount = activities.filter((a) => a.isLeadership).length
  const awardCount = activities.filter((a) => a.isAward).length

  // ── Filtered & grouped ──
  const filtered = useMemo(() => {
    if (filter === "ALL") return activities
    return activities.filter((a) => a.category === filter)
  }, [activities, filter])

  const grouped = useMemo(() => {
    return CATEGORY_ORDER
      .map((cat) => ({ category: cat, items: filtered.filter((a) => a.category === cat) }))
      .filter((g) => g.items.length > 0)
  }, [filtered])

  // ── Nudges ──
  const nudges = useMemo(() => {
    const msgs: string[] = []
    const cats = new Set(activities.map((a) => a.category))
    if (!cats.has("VOLUNTEER") && activities.length > 0)
      msgs.push("You haven't added any volunteer activities yet.")
    const missingHours = activities.filter((a) => a.hoursPerWeek === null && a.totalHours === null).length
    if (missingHours > 0)
      msgs.push(`${missingHours} ${missingHours === 1 ? "activity is" : "activities are"} missing hours — add them for a more complete brag sheet.`)
    const noImpact = activities.filter((a) => !a.impactStatement).length
    if (noImpact > 0 && activities.length >= 2)
      msgs.push("Add impact statements to your top activities — they help with applications.")
    return msgs
  }, [activities])

  // ── Form helpers ──
  const resetForm = () => {
    setForm({ ...emptyForm })
    setEditingId(null)
  }

  const openAdd = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEdit = (a: ActivityEntry) => {
    setEditingId(a.id)
    setForm({
      title: a.title,
      organization: a.organization || "",
      role: a.role || "",
      category: a.category,
      description: a.description || "",
      impactStatement: a.impactStatement || "",
      skillsInput: "",
      skillsGained: a.skillsGained || [],
      startDate: a.startDate ? a.startDate.slice(0, 10) : "",
      endDate: a.endDate ? a.endDate.slice(0, 10) : "",
      isOngoing: a.isOngoing,
      hoursPerWeek: a.hoursPerWeek?.toString() || "",
      isLeadership: a.isLeadership,
      isAward: a.isAward,
    })
    setDialogOpen(true)
  }

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      const val = form.skillsInput.trim().replace(/,$/g, "")
      if (val && !form.skillsGained.includes(val)) {
        setForm((f) => ({ ...f, skillsGained: [...f.skillsGained, val], skillsInput: "" }))
      }
    }
  }

  const removeSkill = (skill: string) => {
    setForm((f) => ({ ...f, skillsGained: f.skillsGained.filter((s) => s !== skill) }))
  }

  // ── Save ──
  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required")
      return
    }
    setSaving(true)
    const payload = {
      title: form.title,
      organization: form.organization || null,
      role: form.role || null,
      category: form.category,
      description: form.description || null,
      impactStatement: form.impactStatement || null,
      skillsGained: form.skillsGained,
      startDate: form.startDate || null,
      endDate: form.isOngoing ? null : form.endDate || null,
      isOngoing: form.isOngoing,
      hoursPerWeek: form.hoursPerWeek ? Number(form.hoursPerWeek) : null,
      totalHours: null,
      isLeadership: form.isLeadership,
      isAward: form.isAward,
    }

    try {
      if (editingId) {
        const res = await fetch(`/api/activities/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const updated = await res.json()
          setActivities((prev) => prev.map((a) => (a.id === editingId ? updated : a)))
          toast.success("Entry updated!")
        } else {
          toast.error("Failed to update")
        }
      } else {
        const res = await fetch("/api/activities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const created = await res.json()
          setActivities((prev) => [...prev, created])
          toast.success("Entry added!")
        } else {
          toast.error("Failed to add entry")
        }
      }
      setDialogOpen(false)
      resetForm()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ──
  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/activities/${id}`, { method: "DELETE" })
      if (res.ok) {
        setActivities((prev) => prev.filter((a) => a.id !== id))
        toast.success("Entry deleted")
      } else {
        toast.error("Failed to delete")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setDeleting(null)
    }
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <p className="text-sm">Loading brag sheet...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1E3A5F]">Brag Sheet</h1>
          <p className="mt-1 text-muted-foreground">Your comprehensive activity & achievement record.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => toast.info("PDF export coming soon")}
          >
            <FileDown className="h-4 w-4" />
            Export PDF
          </Button>
          <Button className="gap-2 bg-[#2563EB] hover:bg-[#2563EB]/90" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Hash, value: totalEntries, label: "Total Entries", bg: "bg-[#1E3A5F]/10", color: "text-[#1E3A5F]" },
          { icon: Clock, value: totalHours.toLocaleString(), label: "Total Hours", bg: "bg-blue-50", color: "text-[#2563EB]" },
          { icon: Users, value: leadershipCount, label: "Leadership Roles", bg: "bg-amber-50", color: "text-amber-600" },
          { icon: Trophy, value: awardCount, label: "Awards & Honors", bg: "bg-emerald-50", color: "text-emerald-600" },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#1E3A5F]">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* ── Category Filter ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setFilter("ALL")}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === "ALL"
              ? "bg-[#1E3A5F] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All ({activities.length})
        </button>
        {ALL_CATEGORIES.map((cat) => {
          const count = activities.filter((a) => a.category === cat).length
          if (count === 0 && filter !== cat) return null
          const cfg = categoryConfig[cat]
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === cat
                  ? "bg-[#1E3A5F] text-white"
                  : `${cfg.badgeBg} ${cfg.badgeText} hover:opacity-80`
              }`}
            >
              {cfg.label} ({count})
            </button>
          )
        })}
      </div>

      {/* ── Activity Cards ── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No entries yet"
          description="Add your first activity, award, or achievement to start building your brag sheet."
          action={
            <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2" onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add Entry
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {grouped.map((group, gi) => {
            const cfg = categoryConfig[group.category]
            const Icon = cfg.icon
            return (
              <motion.div
                key={group.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: gi * 0.06, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true }}
              >
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#1E3A5F]">
                  <Icon className={`h-4 w-4 ${cfg.color}`} />
                  {cfg.label} ({group.items.length})
                </h2>
                <div className="space-y-2.5">
                  {group.items.map((a) => {
                    const aCfg = categoryConfig[a.category]
                    return (
                      <Card key={a.id} className="hover:shadow-sm transition-shadow">
                        <CardContent className="pt-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1.5 min-w-0 flex-1">
                              {/* Title row */}
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-[#1E3A5F]">{a.title}</p>
                                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${aCfg.badgeBg} ${aCfg.badgeText}`}>
                                  {aCfg.label}
                                </span>
                                {a.isLeadership && (
                                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                    <Users className="h-3 w-3" /> Leadership
                                  </span>
                                )}
                                {a.isAward && (
                                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                    <Award className="h-3 w-3" /> Award
                                  </span>
                                )}
                                {a.isVerified && (
                                  <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                                    <ShieldCheck className="h-3 w-3" /> Verified
                                  </span>
                                )}
                              </div>
                              {/* Org & role */}
                              {(a.organization || a.role) && (
                                <p className="text-xs text-muted-foreground">
                                  {a.organization}{a.organization && a.role ? " — " : ""}{a.role}
                                </p>
                              )}
                              {/* Date & hours */}
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDateRange(a.startDate, a.endDate, a.isOngoing)}
                                </span>
                                {a.hoursPerWeek !== null && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {a.hoursPerWeek} hrs/week
                                  </span>
                                )}
                                {a.totalHours !== null && a.totalHours > 0 && (
                                  <span className="font-medium text-foreground/70">{a.totalHours} total hrs</span>
                                )}
                              </div>
                              {/* Description */}
                              {a.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>
                              )}
                              {/* Impact statement */}
                              {a.impactStatement && (
                                <p className="text-xs italic text-muted-foreground/80 line-clamp-2">
                                  &ldquo;{a.impactStatement}&rdquo;
                                </p>
                              )}
                              {/* Skills */}
                              {a.skillsGained && a.skillsGained.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  {a.skillsGained.map((skill) => (
                                    <span
                                      key={skill}
                                      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            {/* Actions */}
                            <div className="flex shrink-0 items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:text-rose-600"
                                disabled={deleting === a.id}
                                onClick={() => handleDelete(a.id)}
                              >
                                {deleting === a.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ── Smart Nudges ── */}
      {nudges.length > 0 && (
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1E3A5F]">
            <Lightbulb className="h-4 w-4 text-amber-500" /> Tips to Strengthen Your Brag Sheet
          </h3>
          {nudges.map((msg, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-xs text-amber-800">{msg}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm() } else { setDialogOpen(true) } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Entry" : "Add Entry"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update this activity or achievement." : "Add an activity, award, or achievement to your brag sheet."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Title *</label>
              <Input
                placeholder="e.g., Debate Team, National Honor Society"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            {/* Organization + Role */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Organization</label>
                <Input
                  placeholder="e.g., Lincoln High School"
                  value={form.organization}
                  onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Role / Position</label>
                <Input
                  placeholder="e.g., Captain, President"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as CategoryKey }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{categoryConfig[cat].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Textarea
                placeholder="What did you do? What was your contribution?"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Impact Statement */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Impact Statement</label>
              <Textarea
                placeholder="Describe what you accomplished and the results"
                rows={2}
                value={form.impactStatement}
                onChange={(e) => setForm((f) => ({ ...f, impactStatement: e.target.value }))}
              />
            </div>

            {/* Skills */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Skills Gained</label>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {form.skillsGained.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1 text-xs">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="ml-0.5 hover:text-rose-600">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="Type a skill and press Enter"
                value={form.skillsInput}
                onChange={(e) => setForm((f) => ({ ...f, skillsInput: e.target.value }))}
                onKeyDown={handleSkillKeyDown}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">End Date</label>
                <Input
                  type="date"
                  value={form.endDate}
                  disabled={form.isOngoing}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Ongoing + Hours */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.isOngoing}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isOngoing: v, endDate: v ? "" : f.endDate }))}
                />
                <label className="text-xs font-medium text-muted-foreground">Ongoing</label>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Hours / Week</label>
                <Input
                  type="number"
                  placeholder="e.g., 5"
                  value={form.hoursPerWeek}
                  onChange={(e) => setForm((f) => ({ ...f, hoursPerWeek: e.target.value }))}
                />
              </div>
            </div>

            {/* Flags */}
            <div className="flex gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.isLeadership}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isLeadership: v }))}
                />
                <label className="text-xs font-medium text-muted-foreground">Leadership Role</label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.isAward}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isAward: v }))}
                />
                <label className="text-xs font-medium text-muted-foreground">Award / Honor</label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
              Cancel
            </Button>
            <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? "Save Changes" : "Add Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
