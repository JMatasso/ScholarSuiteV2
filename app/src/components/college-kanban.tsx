"use client"

import { motion, AnimatePresence } from "motion/react"
import {
  Star, Shield, Calendar, GripVertical, DollarSign,
  GraduationCap, Send, CheckCircle2, Clock, XCircle, Search,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { formatDate, formatCurrency } from "@/lib/format"

/* ────── types ────── */

export type AppType = "REGULAR" | "EARLY_DECISION" | "EARLY_ACTION" | "ROLLING"
export type AppStatus = "RESEARCHING" | "IN_PROGRESS" | "SUBMITTED" | "ACCEPTED" | "DENIED" | "WAITLISTED" | "DEFERRED"

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
  { key: "RESEARCHING", label: "Researching", color: "text-gray-600", bg: "bg-gray-50", icon: Search },
  { key: "IN_PROGRESS", label: "In Progress", color: "text-blue-600", bg: "bg-blue-50/60", icon: GraduationCap },
  { key: "SUBMITTED", label: "Submitted", color: "text-purple-600", bg: "bg-purple-50/60", icon: Send },
  { key: "ACCEPTED", label: "Accepted", color: "text-emerald-600", bg: "bg-emerald-50/60", icon: CheckCircle2 },
  { key: "WAITLISTED", label: "Waitlisted / Deferred", color: "text-amber-600", bg: "bg-amber-50/60", icon: Clock },
  { key: "DENIED", label: "Denied", color: "text-rose-600", bg: "bg-rose-50/60", icon: XCircle },
]

export const APP_TYPE_LABELS: Record<AppType, string> = {
  EARLY_DECISION: "ED",
  EARLY_ACTION: "EA",
  REGULAR: "Regular",
  ROLLING: "Rolling",
}

const APP_TYPE_COLORS: Record<AppType, string> = {
  EARLY_DECISION: "bg-purple-100 text-purple-700",
  EARLY_ACTION: "bg-blue-100 text-blue-700",
  REGULAR: "bg-gray-100 text-gray-700",
  ROLLING: "bg-teal-100 text-teal-700",
}

export const FILTER_OPTIONS = [
  { value: "ALL", label: "All Types" },
  { value: "EARLY_DECISION", label: "Early Decision" },
  { value: "EARLY_ACTION", label: "Early Action" },
  { value: "REGULAR", label: "Regular" },
  { value: "ROLLING", label: "Rolling" },
]

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

/* ────── column ────── */

export function KanbanColumn({
  column,
  apps,
  onStatusChange,
}: {
  column: ColumnDef
  apps: CollegeApp[]
  onStatusChange: (id: string, status: AppStatus) => void
}) {
  const Icon = column.icon
  return (
    <div className={`flex w-72 shrink-0 flex-col rounded-xl ${column.bg} p-3`}>
      <div className="mb-3 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${column.color}`} />
        <span className={`text-sm font-semibold ${column.color}`}>{column.label}</span>
        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-600 shadow-sm">
          {apps.length}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        <AnimatePresence mode="popLayout">
          {apps.map((app) => (
            <KanbanCard key={app.id} app={app} onStatusChange={onStatusChange} />
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
}: {
  app: CollegeApp
  onStatusChange: (id: string, status: AppStatus) => void
}) {
  const days = daysUntil(app.deadline)
  const urgent = days !== null && days >= 0 && days <= 7

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-white shadow-sm ring-1 ring-gray-200/60 p-3 space-y-2 hover:shadow-md transition-shadow cursor-default">
        {/* top row */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-[#1E3A5F] leading-tight">{app.universityName}</h3>
          <div className="flex items-center gap-1 shrink-0">
            {app.isDream && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />}
            {app.isSafety && <Shield className="h-3.5 w-3.5 text-blue-500 fill-blue-200" />}
          </div>
        </div>

        {/* type badge */}
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${APP_TYPE_COLORS[app.applicationType]}`}>
          {APP_TYPE_LABELS[app.applicationType]}
        </span>

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

        {/* cost */}
        {app.cost != null && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            {formatCurrency(app.cost)}/yr
          </div>
        )}

        {/* notes */}
        {app.notes && (
          <p className="text-xs text-muted-foreground line-clamp-1">{app.notes}</p>
        )}

        {/* move menu */}
        <div className="pt-1 border-t border-gray-100">
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
