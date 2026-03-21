"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Plus,
  Clock,
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
  Briefcase,
  Rocket,
  FlaskConical,
  Award,
  Activity,
  ChevronLeft,
  Lightbulb,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import LoaderOne from "@/components/ui/loader-one"
import { BragSheetFormDialog, type ActivityEntry, type CategoryKey } from "@/components/brag-sheet-form-dialog"

// ─── Category Groups ────────────────────────────────────────
// Consolidate the 15 DB categories into 8 student-friendly groups

interface CategoryGroup {
  key: string
  label: string
  description: string
  icon: typeof Activity
  categories: CategoryKey[]
  color: string
  bgClass: string
  iconBg: string
  tip: string
}

const GROUPS: CategoryGroup[] = [
  {
    key: "activities",
    label: "Extracurriculars",
    description: "Sports, arts, clubs, and academic teams",
    icon: Dumbbell,
    categories: ["ATHLETICS", "ARTS", "ACADEMIC"],
    color: "text-blue-600",
    bgClass: "border-blue-200 bg-blue-50/40 hover:bg-blue-50",
    iconBg: "bg-blue-100",
    tip: "Colleges love to see consistent commitment — aim for 2-3 activities you've stuck with over multiple years.",
  },
  {
    key: "volunteer",
    label: "Volunteer & Service",
    description: "Community service, mentoring, giving back",
    icon: Heart,
    categories: ["VOLUNTEER", "MENTORING"],
    color: "text-rose-600",
    bgClass: "border-rose-200 bg-rose-50/40 hover:bg-rose-50",
    iconBg: "bg-rose-100",
    tip: "Focus on impact, not just hours. 'Organized a food drive serving 200 families' beats '100 hours volunteering.'",
  },
  {
    key: "work",
    label: "Work Experience",
    description: "Jobs, internships, and paid positions",
    icon: Briefcase,
    categories: ["WORK"],
    color: "text-emerald-600",
    bgClass: "border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50",
    iconBg: "bg-emerald-100",
    tip: "Include skills you developed and responsibilities you held. Part-time jobs absolutely count!",
  },
  {
    key: "leadership",
    label: "Leadership",
    description: "Positions where you led or organized",
    icon: Users,
    categories: ["LEADERSHIP"],
    color: "text-amber-600",
    bgClass: "border-amber-200 bg-amber-50/40 hover:bg-amber-50",
    iconBg: "bg-amber-100",
    tip: "Leadership doesn't require a formal title — organizing a study group or leading a project counts.",
  },
  {
    key: "awards",
    label: "Awards & Honors",
    description: "Recognition, certifications, achievements",
    icon: Trophy,
    categories: ["AWARD", "CERTIFICATION"],
    color: "text-yellow-600",
    bgClass: "border-yellow-200 bg-yellow-50/40 hover:bg-yellow-50",
    iconBg: "bg-yellow-100",
    tip: "Include the level of recognition (school, district, state, national) and how selective it was.",
  },
  {
    key: "projects",
    label: "Projects",
    description: "Personal projects, businesses, creative work",
    icon: Rocket,
    categories: ["PROJECT", "ENTREPRENEURSHIP"],
    color: "text-cyan-600",
    bgClass: "border-cyan-200 bg-cyan-50/40 hover:bg-cyan-50",
    iconBg: "bg-cyan-100",
    tip: "Self-started projects show initiative. Include what you built, why, and the outcome.",
  },
  {
    key: "research",
    label: "Research & Academic",
    description: "Research, study abroad, professional development",
    icon: FlaskConical,
    categories: ["RESEARCH", "STUDY_ABROAD", "PROFESSIONAL_DEV"],
    color: "text-indigo-600",
    bgClass: "border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50",
    iconBg: "bg-indigo-100",
    tip: "Mention your research topic, methodology, and any findings or presentations.",
  },
  {
    key: "other",
    label: "Other",
    description: "Anything else that makes you stand out",
    icon: Palette,
    categories: ["OTHER"],
    color: "text-gray-600",
    bgClass: "border-gray-200 bg-gray-50/40 hover:bg-gray-50",
    iconBg: "bg-gray-100",
    tip: "Hobbies, personal challenges, family responsibilities — anything that shaped who you are.",
  },
]

function findGroupForCategory(cat: CategoryKey): CategoryGroup {
  return GROUPS.find((g) => g.categories.includes(cat)) || GROUPS[GROUPS.length - 1]
}

// ─── Helpers ────────────────────────────────────────────────

function formatDateRange(start: string | null, end: string | null, ongoing: boolean): string {
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" })
  if (!start) return ""
  return `${fmt(start)} – ${ongoing ? "Present" : end ? fmt(end) : "Present"}`
}

// ─── Page ───────────────────────────────────────────────────

export default function BragSheetPage() {
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<ActivityEntry | null>(null)
  const [addCategory, setAddCategory] = useState<CategoryKey | undefined>()
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/activities")
      .then((res) => res.json())
      .then((data) => { setActivities(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // ── Stats ──
  const totalEntries = activities.length
  const totalHours = activities.reduce((a, b) => a + (b.totalHours ?? 0), 0)
  const leadershipCount = activities.filter((a) => a.isLeadership).length
  const awardCount = activities.filter((a) => a.isAward).length

  // ── Strength score ──
  const strength = useMemo(() => {
    const groupsWithEntries = GROUPS.filter((g) =>
      activities.some((a) => g.categories.includes(a.category))
    ).length
    const withImpact = activities.filter((a) => a.impactStatement).length
    const withHours = activities.filter((a) => a.hoursPerWeek !== null || a.totalHours !== null).length

    const categoryScore = Math.min(groupsWithEntries / 4, 1) * 40 // 40 pts for 4+ categories
    const countScore = Math.min(totalEntries / 8, 1) * 30 // 30 pts for 8+ entries
    const detailScore = totalEntries > 0
      ? ((withImpact / totalEntries) * 15 + (withHours / totalEntries) * 15) // 30 pts for detail
      : 0

    return {
      score: Math.round(categoryScore + countScore + detailScore),
      groupsWithEntries,
      withImpact,
      withHours,
    }
  }, [activities, totalEntries])

  // ── Group data ──
  const groupEntries = useMemo(() => {
    const map: Record<string, ActivityEntry[]> = {}
    for (const g of GROUPS) {
      map[g.key] = activities.filter((a) => g.categories.includes(a.category))
    }
    return map
  }, [activities])

  const activeGroup = GROUPS.find((g) => g.key === selectedGroup) || null

  // ── Handlers ──
  const openAddForGroup = (group: CategoryGroup) => {
    setEditEntry(null)
    setAddCategory(group.categories[0])
    setDialogOpen(true)
  }

  const openEdit = (entry: ActivityEntry) => {
    setEditEntry(entry)
    setAddCategory(undefined)
    setDialogOpen(true)
  }

  const handleSaved = (entry: ActivityEntry, isEdit: boolean) => {
    if (isEdit) {
      setActivities((prev) => prev.map((a) => (a.id === entry.id ? entry : a)))
    } else {
      setActivities((prev) => [...prev, entry])
    }
  }

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
      <div className="flex items-center justify-center py-16">
        <LoaderOne />
      </div>
    )
  }

  const strengthLabel = strength.score >= 80 ? "Strong" : strength.score >= 50 ? "Getting There" : strength.score >= 20 ? "Just Starting" : "Empty"
  const strengthColor = strength.score >= 80 ? "bg-emerald-500" : strength.score >= 50 ? "bg-[#2563EB]" : strength.score >= 20 ? "bg-amber-500" : "bg-gray-300"

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1E3A5F]">Brag Sheet</h1>
          <p className="mt-1 text-muted-foreground">
            Everything that makes you stand out — activities, awards, work, and more.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => toast.info("PDF export coming soon")}>
            <FileDown className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* ── Strength Meter ── */}
      <Card>
        <CardContent className="pt-0">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1E3A5F]/10">
              <Zap className="h-5 w-5 text-[#1E3A5F]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-medium text-foreground">
                  Brag Sheet Strength: <span className="font-semibold">{strengthLabel}</span>
                </p>
                <span className="text-sm font-semibold text-[#1E3A5F]">{strength.score}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${strengthColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${strength.score}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span>{strength.groupsWithEntries}/{GROUPS.length} categories</span>
                <span>{totalEntries} entries</span>
                <span>{strength.withImpact} with impact</span>
                <span>{totalHours > 0 ? `${totalHours.toLocaleString()} hours` : "0 hours"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Quick Stats ── */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {[
          { icon: BookOpen, value: totalEntries, label: "Total Entries", color: "text-[#1E3A5F]", bg: "bg-[#1E3A5F]/10" },
          { icon: Clock, value: totalHours > 0 ? totalHours.toLocaleString() : "0", label: "Total Hours", color: "text-[#2563EB]", bg: "bg-blue-50" },
          { icon: Users, value: leadershipCount, label: "Leadership", color: "text-amber-600", bg: "bg-amber-50" },
          { icon: Trophy, value: awardCount, label: "Awards", color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="flex items-center gap-3 rounded-lg bg-white p-3 ring-1 ring-foreground/5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-[#1E3A5F]">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Category View ── */}
      <AnimatePresence mode="wait">
        {selectedGroup === null ? (
          /* ── Grid of Category Cards ── */
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="mb-3 text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide">
              Your Categories
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {GROUPS.map((group, i) => {
                const Icon = group.icon
                const entries = groupEntries[group.key] || []
                const isEmpty = entries.length === 0

                return (
                  <motion.div
                    key={group.key}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedGroup(group.key)}
                      className={`w-full text-left rounded-xl border p-4 transition-all ${
                        isEmpty
                          ? "border-dashed border-gray-300 bg-gray-50/30 hover:bg-gray-50"
                          : group.bgClass
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isEmpty ? "bg-gray-100" : group.iconBg}`}>
                          <Icon className={`h-5 w-5 ${isEmpty ? "text-gray-400" : group.color}`} />
                        </div>
                        {isEmpty ? (
                          <span className="text-[11px] font-medium text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                            Empty
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-[#1E3A5F] bg-white/80 rounded-full px-2 py-0.5">
                            {entries.length} {entries.length === 1 ? "entry" : "entries"}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm font-semibold ${isEmpty ? "text-gray-500" : "text-[#1E3A5F]"}`}>
                        {group.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {isEmpty ? `Add your first ${group.label.toLowerCase()} entry` : group.description}
                      </p>
                      {/* Preview of top entries */}
                      {entries.length > 0 && (
                        <div className="mt-2.5 space-y-1">
                          {entries.slice(0, 2).map((e) => (
                            <p key={e.id} className="text-xs text-muted-foreground truncate">
                              • {e.title}{e.organization ? ` — ${e.organization}` : ""}
                            </p>
                          ))}
                          {entries.length > 2 && (
                            <p className="text-xs text-muted-foreground/60">
                              +{entries.length - 2} more
                            </p>
                          )}
                        </div>
                      )}
                    </button>
                  </motion.div>
                )
              })}
            </div>

            {/* ── Nudge ── */}
            {totalEntries > 0 && strength.score < 60 && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p className="text-xs text-amber-800">
                  {strength.groupsWithEntries < 3
                    ? "Try adding entries in more categories — colleges like to see well-rounded students."
                    : strength.withImpact < totalEntries / 2
                      ? "Add impact statements to your entries — they make your brag sheet much stronger."
                      : "Keep going! A few more detailed entries and your brag sheet will really shine."}
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          /* ── Category Detail View ── */
          <motion.div
            key={`detail-${selectedGroup}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            {activeGroup && (
              <CategoryDetailView
                group={activeGroup}
                entries={groupEntries[activeGroup.key] || []}
                onBack={() => setSelectedGroup(null)}
                onAdd={() => openAddForGroup(activeGroup)}
                onEdit={openEdit}
                onDelete={handleDelete}
                deleting={deleting}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Form Dialog ── */}
      <BragSheetFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editEntry={editEntry}
        defaultCategory={addCategory}
        tip={activeGroup?.tip}
        onSaved={handleSaved}
      />
    </div>
  )
}

// ─── Category Detail View Component ─────────────────────────

function CategoryDetailView({
  group,
  entries,
  onBack,
  onAdd,
  onEdit,
  onDelete,
  deleting,
}: {
  group: CategoryGroup
  entries: ActivityEntry[]
  onBack: () => void
  onAdd: () => void
  onEdit: (entry: ActivityEntry) => void
  onDelete: (id: string) => void
  deleting: string | null
}) {
  const Icon = group.icon

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${group.iconBg}`}>
            <Icon className={`h-5 w-5 ${group.color}`} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E3A5F]">{group.label}</h2>
            <p className="text-xs text-muted-foreground">{group.description}</p>
          </div>
        </div>
        <Button className="gap-2 bg-[#2563EB] hover:bg-[#2563EB]/90" onClick={onAdd}>
          <Plus className="h-4 w-4" /> Add {group.label.split(" ")[0]}
        </Button>
      </div>

      {/* Tip */}
      <div className="rounded-lg bg-blue-50/70 border border-blue-200/50 px-4 py-3 flex items-start gap-2">
        <Lightbulb className="h-4 w-4 text-[#2563EB] mt-0.5 shrink-0" />
        <p className="text-xs text-[#1E3A5F]/80">{group.tip}</p>
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${group.iconBg} mb-4`}>
            <Icon className={`h-7 w-7 ${group.color} opacity-60`} />
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1">No {group.label.toLowerCase()} yet</p>
          <p className="text-xs text-muted-foreground mb-4">
            Add your first entry to start building this section.
          </p>
          <Button className="gap-2 bg-[#2563EB] hover:bg-[#2563EB]/90" onClick={onAdd}>
            <Plus className="h-4 w-4" /> Add Your First Entry
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {entries.map((entry, i) => {
            const entryGroup = findGroupForCategory(entry.category)
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="pt-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        {/* Title row */}
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-[#1E3A5F]">{entry.title}</p>
                          {entry.isLeadership && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                              <Users className="h-3 w-3" /> Leadership
                            </span>
                          )}
                          {entry.isAward && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                              <Award className="h-3 w-3" /> Award
                            </span>
                          )}
                          {entry.isVerified && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                              <ShieldCheck className="h-3 w-3" /> Verified
                            </span>
                          )}
                        </div>
                        {/* Org & role */}
                        {(entry.organization || entry.role) && (
                          <p className="text-xs text-muted-foreground">
                            {entry.organization}{entry.organization && entry.role ? " — " : ""}{entry.role}
                          </p>
                        )}
                        {/* Date & hours */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {entry.startDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDateRange(entry.startDate, entry.endDate, entry.isOngoing)}
                            </span>
                          )}
                          {entry.hoursPerWeek !== null && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {entry.hoursPerWeek} hrs/week
                            </span>
                          )}
                          {entry.totalHours !== null && entry.totalHours > 0 && (
                            <span className="font-medium text-foreground/70">{entry.totalHours} total hrs</span>
                          )}
                        </div>
                        {/* Description */}
                        {entry.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{entry.description}</p>
                        )}
                        {/* Impact statement */}
                        {entry.impactStatement && (
                          <p className="text-xs italic text-muted-foreground/80 line-clamp-2">
                            &ldquo;{entry.impactStatement}&rdquo;
                          </p>
                        )}
                        {/* Skills */}
                        {entry.skillsGained && entry.skillsGained.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {entry.skillsGained.map((skill) => (
                              <span key={skill} className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(entry)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-rose-600"
                          disabled={deleting === entry.id}
                          onClick={() => onDelete(entry.id)}
                        >
                          {deleting === entry.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
