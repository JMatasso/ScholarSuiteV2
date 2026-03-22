"use client"

import { useState, useMemo } from "react"
import {
  GraduationCap, MapPin, Trash2, ExternalLink,
} from "@/lib/icons"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { MultiSelect } from "@/components/ui/multi-select"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  type CollegeApp, type AppClassification,
  APP_TYPE_LABELS, CLASSIFICATION_LABELS,
} from "@/components/college-kanban"

/* ────── compare helpers ────── */

type Getter = (a: CollegeApp) => number | null
type Direction = "high" | "low"

const fmtPct = (v: number | null) => (v != null ? `${Math.round(v * 100)}%` : "\u2014")
const fmtMoney = (v: number | null) =>
  v != null ? `$${v.toLocaleString("en-US")}` : "\u2014"
const fmtNum = (v: number | null) => (v != null ? v.toLocaleString("en-US") : "\u2014")
const fmtStr = (v: string | null | undefined) => v || "\u2014"
const fmtBool = (v: boolean | undefined) => (v === true ? "Yes" : v === false ? "No" : "\u2014")
const fmtRange = (lo: number | null | undefined, hi: number | null | undefined) =>
  lo != null && hi != null ? `${lo}\u2013${hi}` : lo != null ? `${lo}+` : "\u2014"

interface CompareRow {
  label: string
  value: (a: CollegeApp) => string
  rank?: { get: Getter; dir: Direction }
}

const compareSections: { title: string; rows: CompareRow[] }[] = [
  {
    title: "Overview",
    rows: [
      { label: "Name", value: (a) => a.college?.name ?? a.universityName },
      { label: "City / State", value: (a) => a.college ? fmtStr([a.college.city, a.college.state].filter(Boolean).join(", ") || null) : "\u2014" },
      { label: "Acceptance Rate", value: (a) => fmtPct(a.college?.acceptanceRate ?? null), rank: { get: (a) => a.college?.acceptanceRate ?? null, dir: "high" } },
    ],
  },
  {
    title: "Your Application",
    rows: [
      { label: "Application Type", value: (a) => APP_TYPE_LABELS[a.applicationType] || fmtStr(a.applicationType) },
      { label: "Status", value: (a) => fmtStr(a.status) },
      { label: "Classification", value: (a) => a.classification ? CLASSIFICATION_LABELS[a.classification] : "\u2014" },
      { label: "Deadline", value: (a) => formatDate(a.deadline) },
    ],
  },
]

function rankValues(apps: CollegeApp[], get: Getter, dir: Direction) {
  const vals = apps.map((a) => get(a))
  const valid = vals.filter((v): v is number => v != null)
  if (valid.length < 2) return apps.map(() => "neutral" as const)
  const best = dir === "high" ? Math.max(...valid) : Math.min(...valid)
  const worst = dir === "high" ? Math.min(...valid) : Math.max(...valid)
  return vals.map((v) => {
    if (v == null) return "neutral" as const
    if (v === best) return "best" as const
    if (v === worst) return "worst" as const
    return "neutral" as const
  })
}

const cellColor = { best: "bg-emerald-50", worst: "bg-rose-50", neutral: "" }

/* ────── classification badge colors ────── */

const classificationColors: Record<AppClassification, string> = {
  REACH: "bg-rose-100 text-rose-700 border-rose-200",
  MATCH: "bg-emerald-100 text-emerald-700 border-emerald-200",
  SAFETY: "bg-blue-100 text-blue-700 border-blue-200",
  LIKELY: "bg-amber-100 text-amber-700 border-amber-200",
}

const statusColors: Record<string, string> = {
  RESEARCHING: "bg-gray-100 text-gray-600 border-gray-200",
  IN_PROGRESS: "bg-amber-100 text-amber-700 border-amber-200",
  SUBMITTED: "bg-blue-100 text-blue-700 border-blue-200",
  ACCEPTED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  DENIED: "bg-rose-100 text-rose-700 border-rose-200",
  WAITLISTED: "bg-amber-100 text-amber-700 border-amber-200",
  DEFERRED: "bg-gray-100 text-gray-600 border-gray-200",
  WITHDRAWN: "bg-gray-100 text-gray-600 border-gray-200",
}

/* ────── sub-tab type ────── */

type SubTab = "list" | "compare"

/* ────── component ────── */

interface MyCollegesTabProps {
  apps: CollegeApp[]
  onDelete: (id: string) => Promise<void>
  onAddOpen: () => void
}

export function MyCollegesTab({ apps, onDelete, onAddOpen }: MyCollegesTabProps) {
  const [subTab, setSubTab] = useState<SubTab>("list")

  return (
    <div className="space-y-5">
      {/* Sub-tab toggle */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        <button
          onClick={() => setSubTab("list")}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            subTab === "list" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          My List
        </button>
        <button
          onClick={() => setSubTab("compare")}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            subTab === "compare" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Compare
        </button>
      </div>

      {subTab === "list" ? (
        <MyListSection apps={apps} onDelete={onDelete} onAddOpen={onAddOpen} />
      ) : (
        <CompareSection apps={apps} />
      )}
    </div>
  )
}

/* ================================================================
   My List Section
   ================================================================ */

function MyListSection({
  apps,
  onDelete,
  onAddOpen,
}: {
  apps: CollegeApp[]
  onDelete: (id: string) => Promise<void>
  onAddOpen: () => void
}) {
  const [filterClassification, setFilterClassification] = useState<string>("ALL")

  const filtered = filterClassification === "ALL"
    ? apps
    : apps.filter((a) => a.classification === filterClassification)

  // Group by classification
  const grouped = useMemo(() => {
    const groups: Record<string, CollegeApp[]> = { REACH: [], MATCH: [], SAFETY: [], LIKELY: [], NONE: [] }
    filtered.forEach((a) => {
      const key = a.classification || "NONE"
      if (!groups[key]) groups[key] = []
      groups[key].push(a)
    })
    return groups
  }, [filtered])

  if (apps.length === 0) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="No colleges on your list"
        description="Search and add colleges from the Discover tab to start building your list."
        action={
          <Button className="gap-2" onClick={onAddOpen}>
            Add College
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        {["ALL", "REACH", "MATCH", "SAFETY", "LIKELY"].map((c) => (
          <button
            key={c}
            onClick={() => setFilterClassification(c)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
              filterClassification === c
                ? "bg-secondary-foreground text-white border-secondary-foreground"
                : "bg-card text-muted-foreground border-border hover:border-secondary-foreground/30"
            )}
          >
            {c === "ALL" ? `All (${apps.length})` : `${CLASSIFICATION_LABELS[c as AppClassification] || c} (${apps.filter((a) => a.classification === c).length})`}
          </button>
        ))}
      </div>

      {/* College cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((app) => (
          <Card key={app.id} className="group hover:shadow-md transition-shadow">
            <CardContent className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-secondary-foreground">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-secondary-foreground truncate">
                      {app.universityName}
                    </h3>
                    {app.college?.city && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {[app.college.city, app.college.state].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-600 transition-opacity"
                  onClick={() => onDelete(app.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5">
                {app.classification && (
                  <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border", classificationColors[app.classification])}>
                    {CLASSIFICATION_LABELS[app.classification]}
                  </span>
                )}
                <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border", statusColors[app.status] || statusColors.RESEARCHING)}>
                  {app.status.replace(/_/g, " ")}
                </span>
                <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-gray-50 text-gray-600 border border-gray-200">
                  {APP_TYPE_LABELS[app.applicationType] || app.applicationType}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {app.college?.acceptanceRate != null && (
                  <div>
                    <span className="text-muted-foreground">Acceptance</span>
                    <p className="font-medium">{Math.round(app.college.acceptanceRate * 100)}%</p>
                  </div>
                )}
                {app.deadline && (
                  <div>
                    <span className="text-muted-foreground">Deadline</span>
                    <p className="font-medium">{formatDate(app.deadline)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

/* ================================================================
   Compare Section
   ================================================================ */

function CompareSection({ apps }: { apps: CollegeApp[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const options = useMemo(
    () => apps.map((a) => ({ id: a.id, label: a.universityName })),
    [apps]
  )

  const selected = useMemo(
    () => apps.filter((a) => selectedIds.includes(a.id)),
    [apps, selectedIds]
  )

  const handleChange = (ids: string[]) => setSelectedIds(ids.slice(0, 4))

  return (
    <div className="space-y-5">
      <div className="max-w-md">
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Select 2-4 colleges to compare
        </label>
        <MultiSelect
          options={options}
          selectedIds={selectedIds}
          onChange={handleChange}
          placeholder="Choose colleges..."
          searchPlaceholder="Search your college list..."
          emptyMessage="No colleges in your list yet."
        />
      </div>

      {selected.length < 2 ? (
        <Card variant="bento">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-secondary-foreground mb-3">
              <GraduationCap className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-secondary-foreground">Select at least 2 colleges</p>
            <p className="text-xs text-muted-foreground mt-1">Pick colleges from your list above to see a side-by-side comparison.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[600px] text-sm">
            {compareSections.map((section) => (
              <tbody key={section.title}>
                <tr>
                  <td
                    colSpan={selected.length + 1}
                    className="bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-secondary-foreground"
                  >
                    {section.title}
                  </td>
                </tr>
                {section.rows.map((row) => {
                  const ranks = row.rank
                    ? rankValues(selected, row.rank.get, row.rank.dir)
                    : selected.map(() => "neutral" as const)
                  return (
                    <tr key={row.label} className="border-t border-border">
                      <td className="whitespace-nowrap px-4 py-2 font-medium text-muted-foreground w-48">
                        {row.label}
                      </td>
                      {selected.map((app, i) => (
                        <td key={app.id} className={cn("px-4 py-2 text-center", cellColor[ranks[i]])}>
                          {row.value(app)}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            ))}
          </table>
        </div>
      )}
    </div>
  )
}
