"use client"

import { motion, AnimatePresence } from "motion/react"
import {
  Calendar, GripVertical,
  GraduationCap, Send, CheckCircle2, Clock, XCircle, Search,
  ArrowRightFromLine, MapPin,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { formatDate } from "@/lib/format"

/* ────── types ────── */

export type AppType =
  | "REGULAR"
  | "EARLY_DECISION"
  | "EARLY_DECISION_2"
  | "EARLY_ACTION"
  | "RESTRICTIVE_EARLY_ACTION"
  | "ROLLING"

export type AppStatus =
  | "RESEARCHING"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "ACCEPTED"
  | "DENIED"
  | "WAITLISTED"
  | "DEFERRED"
  | "WITHDRAWN"

export type AppClassification = "REACH" | "MATCH" | "SAFETY" | "LIKELY"

export type AppPlatform = "COMMON_APP" | "COALITION" | "UC_APP" | "DIRECT" | "OTHER"

export interface SupplementalEssay {
  title: string
  wordCount?: number
  completed: boolean
}

export interface Recommender {
  name: string
  role?: string
  status: "REQUESTED" | "SUBMITTED" | "NOT_REQUESTED"
}

export interface AidPackage {
  grants?: number
  loans?: number
  workStudy?: number
}

export interface CollegeApp {
  id: string
  universityName: string
  applicationType: AppType
  status: AppStatus
  deadline: string | null
  cost: number | null
  isDream: boolean
  isSafety: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
  // Enhanced fields
  collegeId: string | null
  college: {
    id: string
    name: string
    city: string | null
    state: string | null
    acceptanceRate: number | null
  } | null
  classification: AppClassification | null
  platform: AppPlatform | null
  applicationFee: number | null
  feeWaiverUsed: boolean
  supplementalEssays: SupplementalEssay[] | null
  recommenders: Recommender[] | null
  transcriptSent: boolean
  testScoresSent: boolean
  financialAidDeadline: string | null
  fafsaSent: boolean
  cssProfileSent: boolean
  aidPackage: AidPackage | null
  netCostEstimate: number | null
  depositDeadline: string | null
  depositPaid: boolean
  committed: boolean
  listOrder: number
  visits: unknown[]
}

export interface ColumnDef {
  key: AppStatus
  label: string
  color: string
  bg: string
  icon: typeof GraduationCap
}

/* ────── constants ────── */

export const COLUMNS: ColumnDef[] = [
  { key: "RESEARCHING", label: "Researching", color: "text-muted-foreground", bg: "bg-muted/50", icon: Search },
  { key: "IN_PROGRESS", label: "In Progress", color: "text-blue-600", bg: "bg-accent/60", icon: GraduationCap },
  { key: "SUBMITTED", label: "Submitted", color: "text-purple-600", bg: "bg-purple-50/60", icon: Send },
  { key: "ACCEPTED", label: "Accepted", color: "text-emerald-600", bg: "bg-emerald-50/60", icon: CheckCircle2 },
  { key: "WAITLISTED", label: "Waitlisted / Deferred", color: "text-amber-600", bg: "bg-amber-50/60", icon: Clock },
  { key: "DENIED", label: "Denied", color: "text-rose-600", bg: "bg-rose-50/60", icon: XCircle },
  { key: "WITHDRAWN", label: "Withdrawn", color: "text-muted-foreground", bg: "bg-muted/50/60", icon: ArrowRightFromLine },
]

export const APP_TYPE_LABELS: Record<AppType, string> = {
  EARLY_DECISION: "ED",
  EARLY_DECISION_2: "ED2",
  EARLY_ACTION: "EA",
  RESTRICTIVE_EARLY_ACTION: "REA",
  REGULAR: "RD",
  ROLLING: "Rolling",
}

const APP_TYPE_COLORS: Record<AppType, string> = {
  EARLY_DECISION: "bg-purple-100 text-purple-700",
  EARLY_DECISION_2: "bg-purple-100 text-purple-700",
  EARLY_ACTION: "bg-blue-100 text-blue-700",
  RESTRICTIVE_EARLY_ACTION: "bg-indigo-100 text-indigo-700",
  REGULAR: "bg-muted text-foreground",
  ROLLING: "bg-teal-100 text-teal-700",
}

export const CLASSIFICATION_LABELS: Record<AppClassification, string> = {
  REACH: "Reach",
  MATCH: "Match",
  SAFETY: "Safety",
  LIKELY: "Likely",
}

export const CLASSIFICATION_COLORS: Record<AppClassification, string> = {
  REACH: "bg-rose-100 text-rose-700 border-rose-200",
  MATCH: "bg-amber-100 text-amber-700 border-amber-200",
  SAFETY: "bg-emerald-100 text-emerald-700 border-emerald-200",
  LIKELY: "bg-blue-100 text-blue-700 border-blue-200",
}

export const PLATFORM_LABELS: Record<AppPlatform, string> = {
  COMMON_APP: "Common App",
  COALITION: "Coalition",
  UC_APP: "UC App",
  DIRECT: "Direct",
  OTHER: "Other",
}

export const FILTER_OPTIONS = [
  { value: "ALL", label: "All Types" },
  { value: "EARLY_DECISION", label: "Early Decision" },
  { value: "EARLY_DECISION_2", label: "Early Decision 2" },
  { value: "EARLY_ACTION", label: "Early Action" },
  { value: "RESTRICTIVE_EARLY_ACTION", label: "Restrictive EA" },
  { value: "REGULAR", label: "Regular Decision" },
  { value: "ROLLING", label: "Rolling" },
]

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

/** Compute checklist progress: how many of the 5 items are done */
export function checklistProgress(app: CollegeApp): { done: number; total: number } {
  let done = 0
  const total = 5
  if (app.transcriptSent) done++
  if (app.testScoresSent) done++
  if (app.feeWaiverUsed || (app.applicationFee != null && app.applicationFee === 0)) done++ // fee handled
  // Count supplemental essays
  const essays = Array.isArray(app.supplementalEssays) ? app.supplementalEssays : []
  if (essays.length === 0 || essays.every((e) => e.completed)) done++
  // Count recommenders
  const recs = Array.isArray(app.recommenders) ? app.recommenders : []
  if (recs.length === 0 || recs.every((r) => r.status === "SUBMITTED")) done++
  return { done, total }
}

/* ────── column ────── */

export function KanbanColumn({
  column,
  apps,
  onStatusChange,
  onCardClick,
}: {
  column: ColumnDef
  apps: CollegeApp[]
  onStatusChange: (id: string, status: AppStatus) => void
  onCardClick: (app: CollegeApp) => void
}) {
  const Icon = column.icon
  return (
    <div className={`flex w-72 shrink-0 flex-col rounded-xl ${column.bg} p-3`}>
      <div className="mb-3 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${column.color}`} />
        <span className={`text-sm font-semibold ${column.color}`}>{column.label}</span>
        <span className="ml-auto rounded-full bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground shadow-sm">
          {apps.length}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        <AnimatePresence mode="popLayout">
          {apps.map((app) => (
            <KanbanCard key={app.id} app={app} onStatusChange={onStatusChange} onClick={() => onCardClick(app)} />
          ))}
        </AnimatePresence>
        {apps.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">No applications</p>
        )}
      </div>
    </div>
  )
}

/* ────── card ────── */

function KanbanCard({
  app,
  onStatusChange,
  onClick,
}: {
  app: CollegeApp
  onStatusChange: (id: string, status: AppStatus) => void
  onClick: () => void
}) {
  const days = daysUntil(app.deadline)
  const urgent = days !== null && days >= 0 && days <= 7
  const { done, total } = checklistProgress(app)
  const progressPct = Math.round((done / total) * 100)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        variant="bento"
        className="bg-card shadow-sm ring-1 ring-gray-200/60 p-3 space-y-2 hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
      >
        {/* top row: name + location */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-secondary-foreground leading-tight truncate">{app.universityName}</h3>
            {app.college && (app.college.city || app.college.state) && (
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                <MapPin className="h-2.5 w-2.5 shrink-0" />
                {[app.college.city, app.college.state].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
          {app.committed && (
            <span className="shrink-0 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              Committed
            </span>
          )}
        </div>

        {/* badge row: type + classification + platform */}
        <div className="flex flex-wrap items-center gap-1">
          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${APP_TYPE_COLORS[app.applicationType]}`}>
            {APP_TYPE_LABELS[app.applicationType]}
          </span>
          {app.classification && (
            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${CLASSIFICATION_COLORS[app.classification]}`}>
              {CLASSIFICATION_LABELS[app.classification]}
            </span>
          )}
          {app.platform && (
            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-muted text-muted-foreground">
              {PLATFORM_LABELS[app.platform]}
            </span>
          )}
        </div>

        {/* deadline */}
        {app.deadline && (
          <div className={`flex items-center gap-1.5 text-xs ${urgent ? "text-rose-600 font-medium" : "text-muted-foreground"}`}>
            <Calendar className="h-3 w-3" />
            {formatDate(app.deadline)}
            {days !== null && days >= 0 && (
              <span className="ml-auto">{days === 0 ? "Today!" : `${days}d left`}</span>
            )}
            {days !== null && days < 0 && (
              <span className="ml-auto text-muted-foreground">Passed</span>
            )}
          </div>
        )}

        {/* mini checklist progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Checklist</span>
            <span>{done}/{total}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div
              className={`h-1.5 rounded-full transition-all ${progressPct === 100 ? "bg-emerald-500" : "bg-[#2563EB]"}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* move menu */}
        <div
          className="pt-1 border-t border-border"
          onClick={(e) => e.stopPropagation()}
        >
          <Select value={app.status} onValueChange={(v) => v && onStatusChange(app.id, v as AppStatus)}>
            <SelectTrigger className="w-full h-7 text-xs">
              <GripVertical className="h-3 w-3 text-muted-foreground mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLUMNS.map((c) =>
                c.key === "WAITLISTED" ? (
                  <span key="waitlisted-group">
                    <SelectItem value="WAITLISTED">Waitlisted</SelectItem>
                    <SelectItem value="DEFERRED">Deferred</SelectItem>
                  </span>
                ) : (
                  <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      </Card>
    </motion.div>
  )
}
