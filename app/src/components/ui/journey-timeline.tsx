"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Check, Clock, ChevronDown } from "@/lib/icons"
import { cn } from "@/lib/utils"
import { JOURNEY_STAGE_LABELS, JOURNEY_STAGES_ORDERED, JOURNEY_PHASE_CONTENT } from "@/lib/constants"
import { JourneyPhaseDetail } from "@/components/ui/journey-phase-detail"

interface TaskCounts {
  total: number
  completed: number
}

interface JourneyTimelineProps {
  currentStage: string
  taskCounts?: Record<string, TaskCounts>
  role?: "STUDENT" | "PARENT"
  expandable?: boolean
  className?: string
}

function getSchoolYearAndSemester(): { schoolYear: string; semester: string } {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  const isFall = month >= 7
  const isSpring = month >= 0 && month <= 4
  const startYear = isFall ? year : year - 1
  const endYear = startYear + 1
  const schoolYear = `${startYear}–${endYear}`
  const semester = isFall ? "Fall" : isSpring ? "Spring" : "Summer"
  return { schoolYear, semester }
}

export function JourneyTimeline({
  currentStage,
  taskCounts,
  role = "STUDENT",
  expandable = false,
  className,
}: JourneyTimelineProps) {
  const currentIndex = JOURNEY_STAGES_ORDERED.indexOf(
    currentStage as (typeof JOURNEY_STAGES_ORDERED)[number]
  )
  const { schoolYear, semester } = getSchoolYearAndSemester()
  const [expandedStage, setExpandedStage] = useState<string | null>(null)

  const handleStageClick = (stage: string) => {
    if (!expandable) return
    setExpandedStage(prev => (prev === stage ? null : stage))
  }

  return (
    <div className={cn("w-full", className)}>
      {/* School year & semester indicator */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          <span className="font-semibold text-secondary-foreground">{schoolYear}</span> School Year
        </p>
        <span className="inline-flex items-center rounded-md bg-[#2563EB]/10 px-2 py-0.5 text-[11px] font-semibold text-[#2563EB]">
          {semester} Semester
        </span>
      </div>

      {/* Desktop: horizontal stepper */}
      <div className="hidden sm:block">
        <div className="relative flex items-start justify-between">
          {/* Background line */}
          <div className="absolute top-5 left-[calc(12.5%)] right-[calc(12.5%)] h-0.5 bg-muted" />
          {/* Progress line */}
          {currentIndex > 0 && (
            <motion.div
              className="absolute top-5 left-[calc(12.5%)] h-0.5 bg-emerald-500"
              initial={{ width: 0 }}
              animate={{
                width: `${(currentIndex / (JOURNEY_STAGES_ORDERED.length - 1)) * 75}%`,
              }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          )}

          {JOURNEY_STAGES_ORDERED.map((stage, index) => {
            const info = JOURNEY_STAGE_LABELS[stage]
            const isCompleted = index < currentIndex
            const isCurrent = index === currentIndex
            const isUpcoming = index > currentIndex
            const counts = taskCounts?.[stage]
            const isExpanded = expandedStage === stage

            return (
              <motion.div
                key={stage}
                className="relative flex flex-col items-center text-center"
                style={{ width: "25%" }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Clickable circle + label group */}
                <button
                  type="button"
                  onClick={() => handleStageClick(stage)}
                  disabled={!expandable}
                  className={cn(
                    "flex flex-col items-center focus:outline-none",
                    expandable && "cursor-pointer group"
                  )}
                >
                  {/* Circle */}
                  <div
                    className={cn(
                      "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                      isCompleted && "border-emerald-500 bg-emerald-500 text-white",
                      isCurrent && "border-[#2563EB] bg-[#2563EB] text-white",
                      isUpcoming && "border-border bg-card text-muted-foreground",
                      expandable && "group-hover:scale-110 transition-transform",
                      isExpanded && "ring-2 ring-offset-2 ring-[#2563EB] ring-offset-background"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : isCurrent ? (
                      <>
                        <Clock className="h-5 w-5" />
                        {!isExpanded && <span className="absolute inset-0 animate-ping rounded-full bg-[#2563EB]/20" />}
                      </>
                    ) : (
                      <span className="text-xs font-semibold">{index + 1}</span>
                    )}
                  </div>

                  {/* Label */}
                  <p
                    className={cn(
                      "mt-3 text-xs font-semibold leading-tight",
                      isCompleted && "text-emerald-700 dark:text-emerald-400",
                      isCurrent && "text-secondary-foreground",
                      isUpcoming && "text-muted-foreground"
                    )}
                  >
                    {info?.shortLabel ?? stage}
                  </p>

                  {/* Grade range */}
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {info?.gradeRange}
                  </p>

                  {/* Expand indicator */}
                  {expandable && (
                    <ChevronDown
                      className={cn(
                        "mt-1 h-3 w-3 text-muted-foreground transition-transform duration-200",
                        isExpanded && "rotate-180 text-[#2563EB]"
                      )}
                    />
                  )}
                </button>

                {/* Task progress */}
                {counts && counts.total > 0 && (
                  <div className="mt-1.5 flex items-center gap-1">
                    <div className="h-1 w-12 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className={cn(
                          "h-full rounded-full",
                          isCompleted ? "bg-emerald-500" :
                          isCurrent ? "bg-[#2563EB]" : "bg-muted"
                        )}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(counts.completed / counts.total) * 100}%`,
                        }}
                        transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {counts.completed}/{counts.total}
                    </span>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Expanded detail panel (desktop - full width below timeline) */}
        <AnimatePresence mode="wait">
          {expandedStage && expandable && (
            <JourneyPhaseDetail
              key={expandedStage}
              content={JOURNEY_PHASE_CONTENT.find(p => p.stage === expandedStage)!}
              role={role}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Mobile: compact vertical stepper */}
      <div className="sm:hidden space-y-1">
        {JOURNEY_STAGES_ORDERED.map((stage, index) => {
          const info = JOURNEY_STAGE_LABELS[stage]
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex
          const isUpcoming = index > currentIndex
          const counts = taskCounts?.[stage]
          const isExpanded = expandedStage === stage

          return (
            <div key={stage}>
              <motion.button
                type="button"
                onClick={() => handleStageClick(stage)}
                disabled={!expandable}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left",
                  isCurrent && "bg-accent/50 ring-1 ring-[#2563EB]/20",
                  isCompleted && "bg-emerald-50/30 dark:bg-emerald-900/10",
                  expandable && "cursor-pointer hover:bg-muted/50 transition-colors",
                  isExpanded && "bg-muted/50"
                )}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs",
                    isCompleted && "border-emerald-500 bg-emerald-500 text-white",
                    isCurrent && "border-[#2563EB] bg-[#2563EB] text-white",
                    isUpcoming && "border-border bg-card text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-xs font-semibold",
                      isCompleted && "text-emerald-700 dark:text-emerald-400",
                      isCurrent && "text-secondary-foreground",
                      isUpcoming && "text-muted-foreground"
                    )}
                  >
                    {info?.shortLabel}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{info?.gradeRange}</p>
                </div>
                {counts && counts.total > 0 && (
                  <span
                    className={cn(
                      "text-[10px] font-medium",
                      isCompleted ? "text-emerald-600 dark:text-emerald-400" :
                      isCurrent ? "text-[#2563EB]" : "text-muted-foreground"
                    )}
                  >
                    {counts.completed}/{counts.total}
                  </span>
                )}
                {expandable && (
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                      isExpanded && "rotate-180 text-[#2563EB]"
                    )}
                  />
                )}
              </motion.button>

              {/* Mobile expanded detail */}
              <AnimatePresence>
                {isExpanded && expandable && (
                  <JourneyPhaseDetail
                    key={`mobile-${expandedStage}`}
                    content={JOURNEY_PHASE_CONTENT.find(p => p.stage === stage)!}
                    role={role}
                  />
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
