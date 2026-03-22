"use client"

import { useState, useMemo } from "react"
import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Pencil,
  Trash2,
  Loader2,
  Users,
  Award,
  Calendar,
  Clock,
  Plus,
  ShieldCheck,
  Dumbbell,
  Heart,
  Briefcase,
  Trophy,
  Rocket,
  FlaskConical,
  Palette,
  BookOpen,
  Activity,
  Sparkles,
} from "@/lib/icons"
import type { ActivityEntry, CategoryKey } from "@/components/brag-sheet-form-dialog"

// ─── Category config ────────────────────────────────────────

const CATEGORY_CONFIG: Record<CategoryKey, { label: string; icon: typeof Activity; color: string; iconBg: string }> = {
  ATHLETICS: { label: "Athletics", icon: Dumbbell, color: "text-orange-600", iconBg: "bg-orange-100" },
  ARTS: { label: "Arts", icon: Palette, color: "text-purple-600", iconBg: "bg-purple-100" },
  ACADEMIC: { label: "Academic", icon: BookOpen, color: "text-blue-600", iconBg: "bg-blue-100" },
  VOLUNTEER: { label: "Volunteer", icon: Heart, color: "text-rose-600", iconBg: "bg-rose-100" },
  WORK: { label: "Work Experience", icon: Briefcase, color: "text-emerald-600", iconBg: "bg-emerald-100" },
  LEADERSHIP: { label: "Leadership", icon: Users, color: "text-amber-600", iconBg: "bg-amber-100" },
  ENTREPRENEURSHIP: { label: "Entrepreneurship", icon: Rocket, color: "text-cyan-600", iconBg: "bg-cyan-100" },
  RESEARCH: { label: "Research", icon: FlaskConical, color: "text-indigo-600", iconBg: "bg-indigo-100" },
  STUDY_ABROAD: { label: "Study Abroad", icon: FlaskConical, color: "text-sky-600", iconBg: "bg-sky-100" },
  CERTIFICATION: { label: "Certifications", icon: Trophy, color: "text-violet-600", iconBg: "bg-violet-100" },
  MENTORING: { label: "Mentoring", icon: Heart, color: "text-pink-600", iconBg: "bg-pink-100" },
  AWARD: { label: "Awards", icon: Award, color: "text-yellow-600", iconBg: "bg-yellow-100" },
  PROJECT: { label: "Projects", icon: Rocket, color: "text-green-600", iconBg: "bg-green-100" },
  PROFESSIONAL_DEV: { label: "Professional Dev", icon: Activity, color: "text-slate-600", iconBg: "bg-slate-100" },
  OTHER: { label: "Other", icon: Activity, color: "text-muted-foreground", iconBg: "bg-muted" },
}

// Map categories to the 8 student-friendly groups for filtering
const GROUP_LABELS: Record<string, { label: string; categories: CategoryKey[] }> = {
  activities: { label: "Extracurriculars", categories: ["ATHLETICS", "ARTS", "ACADEMIC"] },
  volunteer: { label: "Volunteer & Service", categories: ["VOLUNTEER", "MENTORING"] },
  work: { label: "Work Experience", categories: ["WORK"] },
  leadership: { label: "Leadership", categories: ["LEADERSHIP"] },
  awards: { label: "Awards & Honors", categories: ["AWARD", "CERTIFICATION"] },
  projects: { label: "Projects", categories: ["PROJECT", "ENTREPRENEURSHIP"] },
  research: { label: "Research & Academic", categories: ["RESEARCH", "STUDY_ABROAD", "PROFESSIONAL_DEV"] },
  other: { label: "Other", categories: ["OTHER"] },
}

const CATEGORY_ORDER: CategoryKey[] = [
  "ACADEMIC", "LEADERSHIP", "VOLUNTEER", "ATHLETICS", "ARTS", "WORK",
  "ENTREPRENEURSHIP", "RESEARCH", "STUDY_ABROAD", "CERTIFICATION",
  "MENTORING", "AWARD", "PROJECT", "PROFESSIONAL_DEV", "OTHER",
]

// ─── Helpers ────────────────────────────────────────────────

function formatDateRange(start: string | null, end: string | null, ongoing: boolean): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" })
  if (!start) return ""
  return `${fmt(start)} – ${ongoing ? "Present" : end ? fmt(end) : "Present"}`
}

// ─── Component ──────────────────────────────────────────────

interface AllEntriesTabProps {
  activities: ActivityEntry[]
  onEdit: (entry: ActivityEntry) => void
  onDelete: (id: string) => void
  onAdd: () => void
  deleting: string | null
}

export function AllEntriesTab({
  activities,
  onEdit,
  onDelete,
  onAdd,
  deleting,
}: AllEntriesTabProps) {
  const [search, setSearch] = useState("")
  const [groupFilter, setGroupFilter] = useState("ALL")

  const filtered = useMemo(() => {
    let result = activities

    // Group filter
    if (groupFilter !== "ALL") {
      const group = GROUP_LABELS[groupFilter]
      if (group) {
        result = result.filter((a) => group.categories.includes(a.category))
      }
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.organization?.toLowerCase().includes(q) ||
          a.role?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q)
      )
    }

    return result
  }, [activities, groupFilter, search])

  // Group filtered entries by category
  const grouped = useMemo(() => {
    const groups: { category: CategoryKey; entries: ActivityEntry[] }[] = []
    for (const cat of CATEGORY_ORDER) {
      const entries = filtered.filter((a) => a.category === cat)
      if (entries.length > 0) {
        groups.push({ category: cat, entries })
      }
    }
    return groups
  }, [filtered])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search entries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={groupFilter} onValueChange={(v) => { if (v) setGroupFilter(v) }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {Object.entries(GROUP_LABELS).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={onAdd} className="gap-1">
          <Plus className="h-4 w-4" /> Add Entry
        </Button>
      </div>

      {/* Card-based grouped layout */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Activity className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No entries found. Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => {
            const config = CATEGORY_CONFIG[group.category]
            const Icon = config.icon
            return (
              <div key={group.category}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.iconBg}`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <h2 className="text-sm font-semibold text-secondary-foreground uppercase tracking-wide">
                    {config.label}
                  </h2>
                  <span className="text-xs text-muted-foreground">({group.entries.length})</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {group.entries.map((entry, i) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.03 }}
                    >
                      <Card variant="bento" className="hover:shadow-sm transition-shadow">
                        <CardContent className="pt-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-2 min-w-0 flex-1">
                              {/* Title + badges */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="text-sm font-semibold text-secondary-foreground">{entry.title}</p>
                                {entry.isLeadership && (
                                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                                    <Users className="h-2.5 w-2.5" /> Leadership
                                  </span>
                                )}
                                {entry.isAward && (
                                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                                    <Award className="h-2.5 w-2.5" /> Award
                                  </span>
                                )}
                                {entry.isVerified && (
                                  <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-accent px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                                    <ShieldCheck className="h-2.5 w-2.5" /> Verified
                                  </span>
                                )}
                              </div>

                              {/* Organization & role */}
                              {(entry.organization || entry.role) && (
                                <p className="text-xs text-muted-foreground">
                                  {entry.role}{entry.role && entry.organization ? " at " : ""}{entry.organization}
                                </p>
                              )}

                              {/* Date & hours row */}
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
                                <div className="flex items-start gap-1.5 rounded-md bg-accent/60 px-2.5 py-1.5">
                                  <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[#2563EB]" />
                                  <p className="text-xs text-secondary-foreground line-clamp-2">{entry.impactStatement}</p>
                                </div>
                              )}

                              {/* Skills */}
                              {entry.skillsGained && entry.skillsGained.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {entry.skillsGained.map((skill) => (
                                    <span key={skill} className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium bg-accent text-blue-700">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex shrink-0 items-center gap-1">
                              <Button variant="ghost" size="icon-sm" onClick={() => onEdit(entry)}>
                                <Pencil />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="hover:text-rose-600"
                                disabled={deleting === entry.id}
                                onClick={() => onDelete(entry.id)}
                              >
                                {deleting === entry.id ? (
                                  <Loader2 className="animate-spin" />
                                ) : (
                                  <Trash2 />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
