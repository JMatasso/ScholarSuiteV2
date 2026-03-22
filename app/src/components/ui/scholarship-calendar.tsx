"use client"

import { cn } from "@/lib/utils"
import type { PhaseCalendarMonth, MonthStatus } from "@/lib/constants"

const STATUS_STYLES: Record<MonthStatus, { bg: string; border: string; label: string }> = {
  inactive: { bg: "bg-muted/40", border: "border-border", label: "No Activity" },
  prep: { bg: "bg-amber-100 dark:bg-amber-900/30", border: "border-amber-300 dark:border-amber-700", label: "Prep" },
  active: { bg: "bg-amber-200 dark:bg-amber-800/40", border: "border-amber-400 dark:border-amber-600", label: "Application Season" },
  peak: { bg: "bg-amber-400 dark:bg-amber-600/50", border: "border-amber-500 dark:border-amber-500", label: "Peak Deadlines" },
  disbursement: { bg: "bg-emerald-200 dark:bg-emerald-800/40", border: "border-emerald-400 dark:border-emerald-600", label: "Disbursements" },
  payment: { bg: "bg-blue-200 dark:bg-blue-800/40", border: "border-blue-400 dark:border-blue-600", label: "Payments to School" },
}

interface ScholarshipCalendarProps {
  months: PhaseCalendarMonth[]
  legend: string
  className?: string
}

export function ScholarshipCalendar({ months, legend, className }: ScholarshipCalendarProps) {
  // Determine which statuses are actually used for the legend
  const usedStatuses = [...new Set(months.map(m => m.status))].filter(s => s !== "inactive")

  // Find peak range for the bracket label
  const peakStart = months.findIndex(m => m.status === "peak")
  const peakEnd = months.findLastIndex(m => m.status === "peak")
  const activeStart = months.findIndex(m => m.status === "active")
  const activeEnd = months.findLastIndex(m => m.status === "active" || m.status === "peak")
  const hasPeak = peakStart >= 0
  const hasActive = activeStart >= 0

  return (
    <div className={cn("space-y-3", className)}>
      {/* Calendar bar */}
      <div className="relative">
        {/* Month cells */}
        <div className="grid grid-cols-12 gap-0.5">
          {months.map((month) => {
            const style = STATUS_STYLES[month.status]
            return (
              <div
                key={month.shortMonth}
                className={cn(
                  "flex flex-col items-center rounded-md border py-2 transition-colors",
                  style.bg,
                  style.border,
                  month.status === "peak" && "ring-1 ring-amber-500/50 dark:ring-amber-400/30"
                )}
              >
                <span className="text-[10px] font-medium text-foreground sm:text-xs">
                  {month.shortMonth}
                </span>
              </div>
            )
          })}
        </div>

        {/* Bracket labels underneath */}
        {(hasActive || hasPeak) && (
          <div className="relative mt-1.5 h-8">
            {/* Active season bracket */}
            {hasActive && (
              <div
                className="absolute top-0 flex flex-col items-center"
                style={{
                  left: `${(activeStart / 12) * 100}%`,
                  width: `${((activeEnd - activeStart + 1) / 12) * 100}%`,
                }}
              >
                <div className="h-1.5 w-full rounded-full bg-amber-400/30 dark:bg-amber-500/20" />
                <span className="mt-0.5 text-[9px] font-medium text-amber-700 dark:text-amber-400 whitespace-nowrap">
                  Application Season
                </span>
              </div>
            )}

            {/* Peak bracket (overlaid) */}
            {hasPeak && (
              <div
                className="absolute top-0 flex flex-col items-center"
                style={{
                  left: `${(peakStart / 12) * 100}%`,
                  width: `${((peakEnd - peakStart + 1) / 12) * 100}%`,
                }}
              >
                <div className="h-1.5 w-full rounded-full border-2 border-dashed border-rose-400 dark:border-rose-500" />
                <span className="mt-0.5 text-[9px] font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                  Peak (Jan–May)
                </span>
              </div>
            )}

            {/* Disbursement bracket */}
            {months.some(m => m.status === "disbursement") && (
              <div
                className="absolute top-0 flex flex-col items-center"
                style={{
                  left: `${(months.findIndex(m => m.status === "disbursement") / 12) * 100}%`,
                  width: `${(months.filter(m => m.status === "disbursement").length / 12) * 100}%`,
                }}
              >
                <div className="h-1.5 w-full rounded-full bg-emerald-400/30 dark:bg-emerald-500/20" />
                <span className="mt-0.5 text-[9px] font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                  Disbursements
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Color legend */}
      {usedStatuses.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {usedStatuses.map(status => {
            const style = STATUS_STYLES[status]
            return (
              <div key={status} className="flex items-center gap-1.5">
                <div className={cn("h-2.5 w-2.5 rounded-sm border", style.bg, style.border)} />
                <span className="text-[10px] text-muted-foreground">{style.label}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Description */}
      <p className="text-xs leading-relaxed text-muted-foreground">{legend}</p>
    </div>
  )
}
