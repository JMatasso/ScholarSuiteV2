"use client"

import { motion } from "motion/react"
import { Check, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { JOURNEY_STAGE_LABELS, JOURNEY_STAGES_ORDERED } from "@/lib/constants"

interface TaskCounts {
  total: number
  completed: number
}

interface JourneyTimelineProps {
  currentStage: string
  taskCounts?: Record<string, TaskCounts>
  className?: string
}

export function JourneyTimeline({ currentStage, taskCounts, className }: JourneyTimelineProps) {
  const currentIndex = JOURNEY_STAGES_ORDERED.indexOf(
    currentStage as (typeof JOURNEY_STAGES_ORDERED)[number]
  )

  return (
    <div className={cn("w-full", className)}>
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

            return (
              <motion.div
                key={stage}
                className="relative flex flex-col items-center text-center"
                style={{ width: "25%" }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Circle */}
                <div
                  className={cn(
                    "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                    isCompleted && "border-emerald-500 bg-emerald-500 text-white",
                    isCurrent && "border-[#2563EB] bg-[#2563EB] text-white",
                    isUpcoming && "border-border bg-card text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : isCurrent ? (
                    <>
                      <Clock className="h-5 w-5" />
                      <span className="absolute inset-0 animate-ping rounded-full bg-[#2563EB]/20" />
                    </>
                  ) : (
                    <span className="text-xs font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Label */}
                <p
                  className={cn(
                    "mt-3 text-xs font-semibold leading-tight",
                    isCompleted && "text-emerald-700",
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
      </div>

      {/* Mobile: compact vertical stepper */}
      <div className="sm:hidden space-y-3">
        {JOURNEY_STAGES_ORDERED.map((stage, index) => {
          const info = JOURNEY_STAGE_LABELS[stage]
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex
          const isUpcoming = index > currentIndex
          const counts = taskCounts?.[stage]

          return (
            <motion.div
              key={stage}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2",
                isCurrent && "bg-accent/50 ring-1 ring-[#2563EB]/20",
                isCompleted && "bg-emerald-50/30",
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
                    isCompleted && "text-emerald-700",
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
                    isCompleted ? "text-emerald-600" :
                    isCurrent ? "text-[#2563EB]" : "text-muted-foreground"
                  )}
                >
                  {counts.completed}/{counts.total}
                </span>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
