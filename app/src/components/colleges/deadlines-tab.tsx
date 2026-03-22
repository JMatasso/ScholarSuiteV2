"use client"

import { useMemo } from "react"
import {
  CalendarDays, AlertTriangle, Clock, CheckCircle2, GraduationCap,
  DollarSign, FileText,
} from "@/lib/icons"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { type CollegeApp, APP_TYPE_LABELS, CLASSIFICATION_LABELS } from "@/components/college-kanban"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

/* ────── helpers ────── */

interface DeadlineItem {
  id: string
  appId: string
  universityName: string
  type: "application" | "financial-aid" | "deposit"
  label: string
  date: Date
  dateStr: string
  status: string
  classification: string | null
  isPast: boolean
  daysAway: number
}

function buildDeadlines(apps: CollegeApp[]): DeadlineItem[] {
  const items: DeadlineItem[] = []
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  for (const app of apps) {
    if (app.deadline) {
      const date = new Date(app.deadline)
      const daysAway = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      items.push({
        id: `${app.id}-app`,
        appId: app.id,
        universityName: app.universityName,
        type: "application",
        label: `Application Deadline (${APP_TYPE_LABELS[app.applicationType] || app.applicationType})`,
        date,
        dateStr: app.deadline,
        status: app.status,
        classification: app.classification,
        isPast: daysAway < 0,
        daysAway,
      })
    }
    if (app.financialAidDeadline) {
      const date = new Date(app.financialAidDeadline)
      const daysAway = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      items.push({
        id: `${app.id}-faid`,
        appId: app.id,
        universityName: app.universityName,
        type: "financial-aid",
        label: "Financial Aid Deadline",
        date,
        dateStr: app.financialAidDeadline,
        status: app.status,
        classification: app.classification,
        isPast: daysAway < 0,
        daysAway,
      })
    }
    if (app.depositDeadline) {
      const date = new Date(app.depositDeadline)
      const daysAway = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      items.push({
        id: `${app.id}-dep`,
        appId: app.id,
        universityName: app.universityName,
        type: "deposit",
        label: app.depositPaid ? "Deposit Paid" : "Deposit Deadline",
        date,
        dateStr: app.depositDeadline,
        status: app.status,
        classification: app.classification,
        isPast: daysAway < 0,
        daysAway,
      })
    }
  }

  return items.sort((a, b) => a.date.getTime() - b.date.getTime())
}

const typeIcon = {
  "application": FileText,
  "financial-aid": DollarSign,
  "deposit": CheckCircle2,
}

const typeColor = {
  "application": "bg-blue-100 text-blue-700",
  "financial-aid": "bg-emerald-100 text-emerald-700",
  "deposit": "bg-amber-100 text-amber-700",
}

/* ────── component ────── */

interface DeadlinesTabProps {
  apps: CollegeApp[]
}

export function DeadlinesTab({ apps }: DeadlinesTabProps) {
  const deadlines = useMemo(() => buildDeadlines(apps), [apps])

  const upcoming = deadlines.filter((d) => !d.isPast)
  const past = deadlines.filter((d) => d.isPast)

  // Group upcoming by month
  const upcomingByMonth = useMemo(() => {
    const groups: { month: string; items: DeadlineItem[] }[] = []
    for (const d of upcoming) {
      const monthKey = d.date.toLocaleString("en-US", { month: "long", year: "numeric" })
      const existing = groups.find((g) => g.month === monthKey)
      if (existing) {
        existing.items.push(d)
      } else {
        groups.push({ month: monthKey, items: [d] })
      }
    }
    return groups
  }, [upcoming])

  if (deadlines.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No deadlines yet"
        description="Add deadlines to your college applications and they'll appear here in a timeline view."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Urgent banner */}
      {upcoming.length > 0 && upcoming[0].daysAway <= 7 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                {upcoming.filter((d) => d.daysAway <= 7).length} deadline{upcoming.filter((d) => d.daysAway <= 7).length > 1 ? "s" : ""} coming up this week
              </p>
              <p className="text-xs text-amber-600">
                Next: {upcoming[0].universityName} — {upcoming[0].label} ({formatDate(upcoming[0].dateStr)})
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming deadlines */}
      {upcomingByMonth.length > 0 && (
        <div className="space-y-5">
          <h2 className="text-sm font-semibold text-secondary-foreground uppercase tracking-wide">
            Upcoming
          </h2>
          {upcomingByMonth.map((group) => (
            <div key={group.month} className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">{group.month}</p>
              <div className="space-y-2">
                {group.items.map((d) => (
                  <DeadlineCard key={d.id} item={d} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Past deadlines */}
      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Past Deadlines
          </h2>
          <div className="space-y-2 opacity-60">
            {past.slice(-10).reverse().map((d) => (
              <DeadlineCard key={d.id} item={d} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ────── deadline card ────── */

function DeadlineCard({ item }: { item: DeadlineItem }) {
  const Icon = typeIcon[item.type]
  const urgency = item.isPast
    ? "past"
    : item.daysAway <= 3
      ? "critical"
      : item.daysAway <= 7
        ? "soon"
        : item.daysAway <= 30
          ? "upcoming"
          : "far"

  const urgencyColor = {
    past: "border-gray-200",
    critical: "border-rose-300 bg-rose-50/30",
    soon: "border-amber-200 bg-amber-50/20",
    upcoming: "border-border",
    far: "border-border",
  }

  const daysLabel = item.isPast
    ? `${Math.abs(item.daysAway)} day${Math.abs(item.daysAway) !== 1 ? "s" : ""} ago`
    : item.daysAway === 0
      ? "Today"
      : item.daysAway === 1
        ? "Tomorrow"
        : `${item.daysAway} days`

  const daysColor = item.isPast
    ? "text-muted-foreground"
    : item.daysAway <= 3
      ? "text-rose-600 font-semibold"
      : item.daysAway <= 7
        ? "text-amber-600 font-medium"
        : "text-muted-foreground"

  return (
    <Card className={cn("hover:shadow-sm transition-shadow", urgencyColor[urgency])}>
      <CardContent className="flex items-center gap-4 py-3">
        {/* Icon */}
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", typeColor[item.type])}>
          <Icon className="h-4 w-4" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-secondary-foreground truncate">
            {item.universityName}
          </p>
          <p className="text-xs text-muted-foreground">{item.label}</p>
        </div>

        {/* Classification */}
        {item.classification && (
          <Badge variant="outline" className="hidden sm:inline-flex text-[11px]">
            {CLASSIFICATION_LABELS[item.classification as keyof typeof CLASSIFICATION_LABELS] || item.classification}
          </Badge>
        )}

        {/* Date */}
        <div className="text-right shrink-0">
          <p className="text-sm font-medium">{formatDate(item.dateStr)}</p>
          <p className={cn("text-xs", daysColor)}>
            {item.isPast ? (
              <span className="flex items-center gap-1 justify-end">
                <CheckCircle2 className="h-3 w-3" /> {daysLabel}
              </span>
            ) : (
              <span className="flex items-center gap-1 justify-end">
                <Clock className="h-3 w-3" /> {daysLabel}
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
