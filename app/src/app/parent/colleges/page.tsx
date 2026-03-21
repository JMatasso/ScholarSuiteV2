"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/ui/stat-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import {
  GraduationCap,
  Star,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Target,
  ArrowUpCircle,
  TrendingUp,
  MapPin,
} from "lucide-react"
import { formatDate } from "@/lib/format"
import { formatTuition, formatAcceptanceRate } from "@/lib/college-utils"

interface College {
  name?: string
  acceptanceRate?: number | null
  inStateTuition?: number | null
  outStateTuition?: number | null
  city?: string | null
  stateCode?: string | null
}

interface Visit {
  id: string
  type: string
  scheduledAt: string
  completed: boolean
  collegeApplication: {
    id: string
    universityName: string
  }
}

interface CollegeApp {
  id: string
  universityName: string
  applicationType: string
  status: string
  deadline: string | null
  cost: number | null
  isDream: boolean
  isSafety: boolean
  notes: string | null
  classification: string | null
  college: College | null
  committed: boolean
  netCostEstimate: number | null
  aidPackage: Record<string, unknown> | null
  visits: Visit[]
  createdAt: string
}

const statusColor: Record<string, string> = {
  RESEARCHING: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  SUBMITTED: "bg-purple-100 text-purple-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  DENIED: "bg-rose-100 text-rose-700",
  WAITLISTED: "bg-amber-100 text-amber-700",
  DEFERRED: "bg-gray-100 text-gray-600",
}

const typeLabel: Record<string, string> = {
  REGULAR: "Regular",
  EARLY_DECISION: "Early Decision",
  EARLY_ACTION: "Early Action",
  ROLLING: "Rolling",
}

const classificationLabel: Record<string, string> = {
  REACH: "Reach",
  MATCH: "Match",
  SAFETY: "Safety",
  LIKELY: "Likely",
}

const classificationIcon: Record<string, typeof Target> = {
  REACH: ArrowUpCircle,
  MATCH: Target,
  SAFETY: Shield,
  LIKELY: TrendingUp,
}

const classificationColor: Record<string, string> = {
  REACH: "text-rose-600 bg-rose-50 border-rose-200",
  MATCH: "text-blue-600 bg-blue-50 border-blue-200",
  SAFETY: "text-emerald-600 bg-emerald-50 border-emerald-200",
  LIKELY: "text-teal-600 bg-teal-50 border-teal-200",
}

function daysUntil(dateStr: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export default function ParentCollegesPage() {
  const [apps, setApps] = useState<CollegeApp[]>([])
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/college-applications").then(r => r.json()),
      fetch("/api/college-applications/visits").then(r => r.json()),
    ])
      .then(([appData, visitData]) => {
        setApps(Array.isArray(appData) ? appData : [])
        setVisits(Array.isArray(visitData) ? visitData : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const submitted = apps.filter(a =>
    ["SUBMITTED", "ACCEPTED", "DENIED", "WAITLISTED", "DEFERRED"].includes(a.status)
  ).length
  const decisionsReceived = apps.filter(a =>
    ["ACCEPTED", "DENIED", "WAITLISTED"].includes(a.status)
  ).length
  const upcomingDeadlines = apps.filter(a => {
    if (!a.deadline) return false
    const days = daysUntil(a.deadline)
    return days >= 0 && days <= 30
  }).length

  // Group apps by classification
  const grouped = useMemo(() => {
    const groups: Record<string, CollegeApp[]> = {
      REACH: [],
      MATCH: [],
      LIKELY: [],
      SAFETY: [],
      UNCLASSIFIED: [],
    }
    apps.forEach(app => {
      const cls = app.classification || (app.isDream ? "REACH" : app.isSafety ? "SAFETY" : null)
      if (cls && groups[cls]) {
        groups[cls].push(app)
      } else {
        groups.UNCLASSIFIED.push(app)
      }
    })
    return groups
  }, [apps])

  // Upcoming visits (next 30 days, not completed)
  const upcomingVisits = useMemo(() => {
    const now = new Date()
    return visits
      .filter(v => !v.completed && new Date(v.scheduledAt) >= now)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 5)
  }, [visits])

  // Upcoming deadlines list
  const deadlineSoon = useMemo(() => {
    return apps
      .filter(a => a.deadline && daysUntil(a.deadline) >= 0 && daysUntil(a.deadline) <= 60)
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .slice(0, 5)
  }, [apps])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 skeleton-shimmer" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28 rounded-2xl skeleton-shimmer" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 rounded-xl skeleton-shimmer" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1E3A5F]">College Applications</h1>
        <p className="mt-1 text-muted-foreground">
          Track your child&apos;s college application progress and upcoming deadlines.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Colleges" value={apps.length} icon={GraduationCap} index={0} />
        <StatCard title="Submitted" value={submitted} icon={CheckCircle2} index={1} />
        <StatCard title="Decisions In" value={decisionsReceived} icon={XCircle} index={2} />
        <StatCard
          title="Upcoming Deadlines"
          value={upcomingDeadlines}
          description="Next 30 days"
          icon={Clock}
          index={3}
        />
      </div>

      {apps.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No college applications yet"
          description="Your child hasn't started tracking college applications yet. Applications will appear here once they begin building their list."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* College List - grouped by classification */}
          <div className="lg:col-span-2 space-y-6">
            {(["REACH", "MATCH", "LIKELY", "SAFETY", "UNCLASSIFIED"] as const).map(cls => {
              const items = grouped[cls]
              if (items.length === 0) return null
              const Icon = cls !== "UNCLASSIFIED" ? classificationIcon[cls] : GraduationCap
              const label = cls !== "UNCLASSIFIED" ? classificationLabel[cls] : "Other"
              return (
                <div key={cls}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-4 w-4 text-[#1E3A5F]" />
                    <h2 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide">
                      {label} ({items.length})
                    </h2>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {items.map((app, i) => (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <Card
                          variant="bento"
                          className={
                            app.committed ? "ring-2 ring-emerald-400 bg-emerald-50/50" : ""
                          }
                        >
                          <CardContent className="pt-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {app.isDream && (
                                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />
                                  )}
                                  <h3 className="text-sm font-semibold text-[#1E3A5F] truncate">
                                    {app.universityName}
                                  </h3>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {typeLabel[app.applicationType] || app.applicationType}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {app.committed && (
                                  <Badge className="bg-emerald-600 text-white text-[10px]">
                                    Committed
                                  </Badge>
                                )}
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] ${statusColor[app.status] || "bg-gray-100 text-gray-600"}`}
                                >
                                  {app.status.charAt(0) + app.status.slice(1).toLowerCase().replace("_", " ")}
                                </Badge>
                              </div>
                            </div>

                            {/* College details */}
                            <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-muted-foreground">
                              {app.deadline && (
                                <span className="flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3" />
                                  {formatDate(app.deadline)}
                                  {daysUntil(app.deadline) >= 0 && daysUntil(app.deadline) <= 14 && (
                                    <span className="text-rose-600 font-medium ml-0.5">
                                      ({daysUntil(app.deadline)}d)
                                    </span>
                                  )}
                                </span>
                              )}
                              {app.college?.acceptanceRate != null && (
                                <span>{formatAcceptanceRate(app.college.acceptanceRate)} accept</span>
                              )}
                              {app.college?.inStateTuition != null && (
                                <span>{formatTuition(app.college.inStateTuition)}/yr</span>
                              )}
                              {app.college?.city && app.college?.stateCode && (
                                <span className="flex items-center gap-0.5">
                                  <MapPin className="h-3 w-3" />
                                  {app.college.city}, {app.college.stateCode}
                                </span>
                              )}
                            </div>

                            {cls !== "UNCLASSIFIED" && (
                              <div className="mt-2">
                                <span
                                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border ${classificationColor[cls]}`}
                                >
                                  {classificationLabel[cls]}
                                </span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Sidebar: Upcoming Events & Deadlines */}
          <div className="space-y-6">
            {/* Upcoming Visits */}
            <Card variant="bento">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#1E3A5F]" />
                  Upcoming Visits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingVisits.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No upcoming visits scheduled.</p>
                ) : (
                  upcomingVisits.map(visit => (
                    <div
                      key={visit.id}
                      className="flex items-start justify-between gap-2 text-xs"
                    >
                      <div>
                        <p className="font-medium text-[#1E3A5F]">
                          {visit.collegeApplication.universityName}
                        </p>
                        <p className="text-muted-foreground">
                          {visit.type.replace(/_/g, " ")}
                        </p>
                      </div>
                      <span className="text-muted-foreground shrink-0">
                        {formatDate(visit.scheduledAt)}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Upcoming Deadlines */}
            <Card variant="bento">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#1E3A5F]" />
                  Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {deadlineSoon.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No upcoming deadlines.</p>
                ) : (
                  deadlineSoon.map(app => {
                    const days = daysUntil(app.deadline!)
                    return (
                      <div
                        key={app.id}
                        className="flex items-start justify-between gap-2 text-xs"
                      >
                        <div>
                          <p className="font-medium text-[#1E3A5F]">{app.universityName}</p>
                          <p className="text-muted-foreground">
                            {typeLabel[app.applicationType] || app.applicationType}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-muted-foreground">{formatDate(app.deadline)}</p>
                          <p
                            className={`font-medium ${
                              days <= 7
                                ? "text-rose-600"
                                : days <= 14
                                  ? "text-amber-600"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days`}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
