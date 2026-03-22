"use client"

import { useMemo } from "react"
import { motion } from "motion/react"
import { Award, Clock, Send, FileX, FileText, DollarSign, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface ScholarshipApp {
  id: string
  status: string
  amountAwarded?: number | null
  scholarship: {
    name: string
    amount?: number | null
    deadline?: string | null
  }
  createdAt: string
  updatedAt: string
}

interface ScholarshipPipelineProps {
  applications: ScholarshipApp[]
  className?: string
}

const statusConfig: Record<string, { color: string; bgColor: string; ringColor: string; dotColor: string; icon: typeof Award; label: string }> = {
  AWARDED: {
    color: "text-emerald-700",
    bgColor: "bg-emerald-50/50",
    ringColor: "ring-emerald-200",
    dotColor: "bg-emerald-500",
    icon: Award,
    label: "Awarded",
  },
  SUBMITTED: {
    color: "text-purple-700",
    bgColor: "bg-purple-50/50",
    ringColor: "ring-purple-200",
    dotColor: "bg-purple-500",
    icon: Send,
    label: "Submitted",
  },
  IN_PROGRESS: {
    color: "text-[#2563EB]",
    bgColor: "bg-accent/50",
    ringColor: "ring-blue-200",
    dotColor: "bg-[#2563EB]",
    icon: Clock,
    label: "In Progress",
  },
  DENIED: {
    color: "text-rose-700",
    bgColor: "bg-rose-50/50",
    ringColor: "ring-rose-200",
    dotColor: "bg-rose-500",
    icon: FileX,
    label: "Denied",
  },
  NOT_STARTED: {
    color: "text-muted-foreground",
    bgColor: "bg-muted/50/50",
    ringColor: "ring-gray-200",
    dotColor: "bg-muted-foreground",
    icon: FileText,
    label: "Not Started",
  },
}

function formatAmount(amount: number | null | undefined): string {
  if (!amount) return "Varies"
  return `$${amount.toLocaleString()}`
}

function formatDeadline(deadline: string | null | undefined): string {
  if (!deadline) return "No deadline"
  return new Date(deadline).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function ScholarshipPipeline({ applications, className }: ScholarshipPipelineProps) {
  const sorted = useMemo(() => {
    const statusPriority: Record<string, number> = {
      IN_PROGRESS: 0,
      NOT_STARTED: 1,
      SUBMITTED: 2,
      AWARDED: 3,
      DENIED: 4,
    }
    return [...applications].sort((a, b) => {
      // Active items first, then by deadline
      const aPri = statusPriority[a.status] ?? 5
      const bPri = statusPriority[b.status] ?? 5
      if (aPri !== bPri) return aPri - bPri
      const aDate = a.scholarship.deadline ? new Date(a.scholarship.deadline).getTime() : Infinity
      const bDate = b.scholarship.deadline ? new Date(b.scholarship.deadline).getTime() : Infinity
      return aDate - bDate
    })
  }, [applications])

  const stats = useMemo(() => {
    const totalApplied = applications.filter((a) => a.status !== "NOT_STARTED").length
    const totalAwarded = applications
      .filter((a) => a.status === "AWARDED")
      .reduce((sum, a) => sum + (a.amountAwarded || a.scholarship.amount || 0), 0)
    const pending = applications.filter(
      (a) => a.status === "IN_PROGRESS" || a.status === "SUBMITTED"
    ).length
    return { totalApplied, totalAwarded, pending }
  }, [applications])

  if (applications.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 text-muted-foreground", className)}>
        <DollarSign className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">No scholarship applications yet.</p>
        <p className="text-xs mt-1">Applications will appear here as you apply to scholarships.</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-card p-3 ring-1 ring-foreground/5 text-center">
          <p className="text-lg font-semibold text-secondary-foreground">{stats.totalApplied}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Applied</p>
        </div>
        <div className="rounded-lg bg-emerald-50/50 p-3 ring-1 ring-emerald-200/50 text-center">
          <p className="text-lg font-semibold text-emerald-700">
            {stats.totalAwarded > 0 ? `$${stats.totalAwarded.toLocaleString()}` : "$0"}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Awarded</p>
        </div>
        <div className="rounded-lg bg-accent/50 p-3 ring-1 ring-blue-200/50 text-center">
          <p className="text-lg font-semibold text-[#2563EB]">{stats.pending}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pending</p>
        </div>
      </div>

      {/* Vertical timeline */}
      <div className="relative ml-4 pl-8">
        <div className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-muted" />

        <div className="space-y-3">
          {sorted.map((app, index) => {
            const config = statusConfig[app.status] || statusConfig.NOT_STARTED
            const Icon = config.icon

            return (
              <motion.div
                key={app.id}
                className="relative"
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true }}
              >
                {/* Dot */}
                <div
                  className={cn(
                    "absolute -left-8 top-3.5 h-3.5 w-3.5 rounded-full ring-4 ring-white",
                    config.dotColor
                  )}
                />
                {app.status === "IN_PROGRESS" && (
                  <div className="absolute -left-8 top-3.5 h-3.5 w-3.5 animate-ping rounded-full bg-[#2563EB]/30" />
                )}

                <Card
                  variant="bento"
                  className={cn(
                    "transition-shadow hover:shadow-sm",
                    app.status === "IN_PROGRESS" && "border-[#2563EB]/20",
                    app.status === "AWARDED" && "border-emerald-200",
                    app.status === "DENIED" && "opacity-60"
                  )}
                >
                  <CardContent className="pt-0">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          config.bgColor
                        )}
                      >
                        <Icon className={cn("h-4 w-4", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">{app.scholarship.name}</p>
                          <span
                            className={cn(
                              "inline-flex h-5 items-center rounded-full border px-2 text-[10px] font-medium shrink-0",
                              config.bgColor,
                              config.color,
                              config.ringColor
                            )}
                          >
                            {config.label}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {app.status === "AWARDED" && app.amountAwarded
                              ? formatAmount(app.amountAwarded)
                              : formatAmount(app.scholarship.amount)}
                          </span>
                          {app.scholarship.deadline && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDeadline(app.scholarship.deadline)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
