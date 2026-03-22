"use client"

import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { ScholarshipCalendar } from "@/components/ui/scholarship-calendar"
import { Circle, CheckCircle2, CalendarRange, ClipboardList, Info } from "lucide-react"
import type { PhaseDetailContent } from "@/lib/constants"

interface JourneyPhaseDetailProps {
  content: PhaseDetailContent
  role: "STUDENT" | "PARENT"
  className?: string
}

export function JourneyPhaseDetail({ content, role, className }: JourneyPhaseDetailProps) {
  const isParent = role === "PARENT"
  const overview = isParent ? content.parentOverview : content.studentOverview
  const calendarLegend = isParent ? content.parentCalendarLegend : content.calendarLegend

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn("overflow-hidden", className)}
    >
      <div className="space-y-5 rounded-xl border border-border bg-card p-5 mt-3">
        {/* Overview */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent">
              <Info className="h-3.5 w-3.5 text-secondary-foreground" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">What to Expect</h4>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground pl-8">
            {overview}
          </p>
        </div>

        {/* Checklist */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent">
              <ClipboardList className="h-3.5 w-3.5 text-secondary-foreground" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">
              {isParent ? "Parent Checklist" : "Your Checklist"}
            </h4>
          </div>
          <div className="grid gap-1.5 pl-8 sm:grid-cols-2">
            {content.checklist.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/50"
              >
                <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="text-xs leading-snug text-foreground">
                  {isParent ? item.parentLabel : item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Scholarship Calendar */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent">
              <CalendarRange className="h-3.5 w-3.5 text-secondary-foreground" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">Scholarship Timeline</h4>
          </div>
          <div className="pl-8">
            <ScholarshipCalendar
              months={content.calendar}
              legend={calendarLegend}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
