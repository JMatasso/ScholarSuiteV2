"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ScholarshipPipeline } from "@/components/ui/scholarship-pipeline"
import {
  Award,
  DollarSign,
  Calendar,
  Trophy,
  FileText,
  Clock,
  Send,
  AlertTriangle,
  ArrowRight,
} from "@/lib/icons"

interface Scholarship {
  id: string
  name: string
  provider: string | null
  amount: number | null
  deadline: string | null
}

interface Application {
  id: string
  scholarshipId: string
  status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "AWARDED" | "DENIED"
  amountAwarded: number | null
  scholarship: Scholarship
  createdAt: string
  updatedAt: string
}

function DeadlineCalendar({ applications }: { applications: Application[] }) {
  const deadlines = useMemo(() => {
    const now = new Date()
    return applications
      .filter((a) => {
        if (a.status === "AWARDED" || a.status === "DENIED") return false
        if (!a.scholarship.deadline) return false
        return new Date(a.scholarship.deadline) >= now
      })
      .sort((a, b) => new Date(a.scholarship.deadline!).getTime() - new Date(b.scholarship.deadline!).getTime())
      .slice(0, 6)
  }, [applications])

  const getDaysLeft = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days
  }

  return (
    <Card variant="bento" className="h-full">
      <CardContent className="pt-0 space-y-3">
        {deadlines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">No upcoming deadlines</p>
          </div>
        ) : (
          <>
            {deadlines.map((app) => {
              const days = getDaysLeft(app.scholarship.deadline!)
              const urgent = days <= 7
              const soon = days <= 14
              return (
                <Link
                  key={app.id}
                  href={`/student/scholarships/${app.scholarshipId}`}
                  className="block"
                >
                  <div className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all hover:shadow-sm cursor-pointer ${urgent ? "border-rose-200 bg-rose-50/30" : soon ? "border-amber-200 bg-amber-50/30" : "border-gray-100"}`}>
                    <div className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg text-center ${urgent ? "bg-rose-100" : soon ? "bg-amber-100" : "bg-[#1E3A5F]/10"}`}>
                      <span className={`text-[10px] font-semibold uppercase leading-none ${urgent ? "text-rose-600" : soon ? "text-amber-600" : "text-[#1E3A5F]"}`}>
                        {new Date(app.scholarship.deadline!).toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className={`text-sm font-bold leading-tight ${urgent ? "text-rose-700" : soon ? "text-amber-700" : "text-[#1E3A5F]"}`}>
                        {new Date(app.scholarship.deadline!).getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{app.scholarship.name}</p>
                      <p className={`text-xs ${urgent ? "text-rose-600 font-medium" : soon ? "text-amber-600" : "text-muted-foreground"}`}>
                        {days === 0 ? "Due today" : days === 1 ? "Due tomorrow" : `${days} days left`}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </>
        )}
        <Link
          href="/student/calendar"
          className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-200 px-3 py-2 text-xs text-muted-foreground hover:text-[#2563EB] hover:border-[#2563EB]/30 transition-colors"
        >
          <Calendar className="h-3.5 w-3.5" />
          View full calendar
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  )
}

export default function OverviewPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((apps) => {
        setApplications(Array.isArray(apps) ? apps : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    const notStarted = applications.filter((a) => a.status === "NOT_STARTED").length
    const inProgress = applications.filter((a) => a.status === "IN_PROGRESS").length
    const submitted = applications.filter((a) => a.status === "SUBMITTED").length
    const awarded = applications.filter((a) => a.status === "AWARDED")
    const denied = applications.filter((a) => a.status === "DENIED").length
    const totalAwarded = awarded.reduce(
      (sum, a) => sum + (a.amountAwarded || a.scholarship.amount || 0),
      0
    )

    // Upcoming deadlines (within 30 days)
    const now = new Date()
    const upcoming = applications.filter((a) => {
      if (a.status === "AWARDED" || a.status === "DENIED") return false
      if (!a.scholarship.deadline) return false
      const deadline = new Date(a.scholarship.deadline)
      const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return daysLeft >= 0 && daysLeft <= 30
    }).length

    return {
      total: applications.length,
      notStarted,
      inProgress,
      submitted,
      awardedCount: awarded.length,
      denied,
      totalAwarded,
      upcoming,
    }
  }, [applications])

  const awards = useMemo(
    () => applications.filter((a) => a.status === "AWARDED"),
    [applications]
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  const statCards = [
    {
      label: "Total Applications",
      value: stats.total,
      icon: FileText,
      color: "text-secondary-foreground",
      bg: "bg-accent",
    },
    {
      label: "Not Started",
      value: stats.notStarted,
      icon: Clock,
      color: "text-muted-foreground",
      bg: "bg-muted",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: FileText,
      color: "text-[#2563EB]",
      bg: "bg-accent",
    },
    {
      label: "Submitted",
      value: stats.submitted,
      icon: Send,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Upcoming Deadlines",
      value: stats.upcoming,
      icon: AlertTriangle,
      color: stats.upcoming > 0 ? "text-amber-600" : "text-muted-foreground",
      bg: stats.upcoming > 0 ? "bg-amber-50" : "bg-muted",
    },
    {
      label: "Total Awarded",
      value: `$${stats.totalAwarded.toLocaleString()}`,
      icon: Trophy,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Your scholarship journey at a glance — applications, awards, and progress."
      />

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card variant="bento" className="transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="pt-0">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold tracking-tight text-secondary-foreground font-display">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Scholarship Pipeline + Deadline Calendar */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-secondary-foreground uppercase tracking-wide">
            Scholarship Pipeline
          </h2>
          <ScholarshipPipeline applications={applications} />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-secondary-foreground uppercase tracking-wide">
            Upcoming Deadlines
          </h2>
          <DeadlineCalendar applications={applications} />
        </div>
      </div>

      {/* Won Awards */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-secondary-foreground uppercase tracking-wide">
          Won Awards
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <Card variant="bento" className="border-emerald-200 bg-emerald-50/30">
            <CardContent className="pt-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                  <DollarSign className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-700">
                    ${stats.totalAwarded.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Awarded</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="bento">
            <CardContent className="pt-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                  <Trophy className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary-foreground">{stats.awardedCount}</p>
                  <p className="text-xs text-muted-foreground">Scholarships Won</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {awards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Award className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No awards yet</p>
            <p className="text-xs mt-1">
              Keep applying — awarded scholarships will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {awards.map((award, index) => (
              <motion.div
                key={award.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
              >
                <Card variant="bento" className="border-emerald-200/50">
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                        <Award className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {award.scholarship.name}
                        </p>
                        {award.scholarship.provider && (
                          <p className="text-xs text-muted-foreground">
                            {award.scholarship.provider}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-emerald-700">
                          ${(award.amountAwarded || award.scholarship.amount || 0).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                          <Calendar className="h-3 w-3" />
                          {new Date(award.updatedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
