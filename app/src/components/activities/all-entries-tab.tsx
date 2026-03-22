"use client"

import { useState, useMemo } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { motion } from "motion/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
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
  ArrowUpDown,
  Users,
  Award,
  Calendar,
  Clock,
  Plus,
} from "@/lib/icons"
import type { ActivityEntry, CategoryKey } from "@/components/brag-sheet-form-dialog"

// ─── Category label map ──────────────────────────────────────

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  ATHLETICS: "Athletics",
  ARTS: "Arts",
  ACADEMIC: "Academic",
  VOLUNTEER: "Volunteer",
  WORK: "Work Experience",
  LEADERSHIP: "Leadership",
  ENTREPRENEURSHIP: "Entrepreneurship",
  RESEARCH: "Research",
  STUDY_ABROAD: "Study Abroad",
  CERTIFICATION: "Certifications",
  MENTORING: "Mentoring",
  AWARD: "Awards",
  PROJECT: "Project",
  PROFESSIONAL_DEV: "Professional Dev",
  OTHER: "Other",
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

// ─── Helpers ────────────────────────────────────────────────

function formatDateRange(start: string | null, end: string | null, ongoing: boolean): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" })
  if (!start) return "—"
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

    return result
  }, [activities, groupFilter])

  const columns: ColumnDef<ActivityEntry>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const entry = row.original
          return (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-secondary-foreground truncate">
                  {entry.title}
                </span>
                {entry.isLeadership && (
                  <Users className="h-3 w-3 shrink-0 text-amber-500" />
                )}
                {entry.isAward && (
                  <Award className="h-3 w-3 shrink-0 text-emerald-500" />
                )}
              </div>
              {(entry.organization || entry.role) && (
                <p className="text-xs text-muted-foreground truncate">
                  {entry.organization}
                  {entry.organization && entry.role ? " — " : ""}
                  {entry.role}
                </p>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "category",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Category
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-accent text-secondary-foreground">
            {CATEGORY_LABELS[row.original.category] || row.original.category}
          </span>
        ),
      },
      {
        accessorKey: "hoursPerWeek",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Hours
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const entry = row.original
          if (entry.hoursPerWeek === null && (entry.totalHours === null || entry.totalHours === 0))
            return <span className="text-xs text-muted-foreground">—</span>
          return (
            <div className="text-xs text-muted-foreground">
              {entry.hoursPerWeek !== null && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {entry.hoursPerWeek}/wk
                </span>
              )}
              {entry.totalHours !== null && entry.totalHours > 0 && (
                <span className="text-foreground/70 font-medium">{entry.totalHours} total</span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "startDate",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Dates
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const entry = row.original
          return (
            <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
              <Calendar className="h-3 w-3" />
              {formatDateRange(entry.startDate, entry.endDate, entry.isOngoing)}
            </span>
          )
        },
      },
      {
        id: "actions",
        header: () => null,
        cell: ({ row }) => {
          const entry = row.original
          return (
            <div className="flex items-center justify-end gap-1">
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
          )
        },
      },
    ],
    [onEdit, onDelete, deleting]
  )

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

      {/* Table */}
      <Card variant="bento">
        <CardContent className="pt-0">
          <DataTable
            columns={columns}
            data={filtered}
            searchKey="title"
            searchValue={search}
            pageSize={15}
            emptyMessage="No entries found. Try adjusting your search or filters."
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}
