"use client"

import { useState, useEffect, useMemo } from "react"
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
} from "lucide-react"

interface Scholarship {
  name: string
  provider: string | null
  amount: number | null
  deadline: string | null
}

interface Application {
  id: string
  status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "AWARDED" | "DENIED"
  amountAwarded: number | null
  scholarship: Scholarship
  createdAt: string
  updatedAt: string
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
      color: "text-[#1E3A5F]",
      bg: "bg-[#1E3A5F]/10",
    },
    {
      label: "Not Started",
      value: stats.notStarted,
      icon: Clock,
      color: "text-gray-600",
      bg: "bg-gray-100",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: FileText,
      color: "text-[#2563EB]",
      bg: "bg-blue-50",
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
      color: stats.upcoming > 0 ? "text-amber-600" : "text-gray-500",
      bg: stats.upcoming > 0 ? "bg-amber-50" : "bg-gray-100",
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
                      <p className="text-2xl font-bold tracking-tight text-[#1E3A5F] font-display">
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

      {/* Scholarship Pipeline */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide">
          Scholarship Pipeline
        </h2>
        <ScholarshipPipeline applications={applications} />
      </div>

      {/* Won Awards */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide">
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
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1E3A5F]/10">
                  <Trophy className="h-5 w-5 text-[#1E3A5F]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1E3A5F]">{stats.awardedCount}</p>
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
