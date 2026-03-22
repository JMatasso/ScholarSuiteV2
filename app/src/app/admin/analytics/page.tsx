"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, DollarSign, GraduationCap } from "@/lib/icons"
import { toast } from "sonner"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"

const CHART_COLORS = ["#1E3A5F", "#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"]

const STAGE_LABELS: Record<string, string> = {
  EARLY_EXPLORATION: "Early Exploration",
  ACTIVE_PREP: "Active Prep",
  APPLICATION_PHASE: "Application Phase",
  POST_ACCEPTANCE: "Post-Acceptance",
}

const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  SUBMITTED: "Submitted",
  AWARDED: "Awarded",
  DENIED: "Denied",
  RESEARCHING: "Researching",
  ACCEPTED: "Accepted",
  WAITLISTED: "Waitlisted",
}

interface AnalyticsData {
  overview: {
    totalStudents: number
    activeStudents: number
    totalParents: number
    totalScholarships: number
    localScholarships: number
    totalApplications: number
    totalCollegeApps: number
    totalAwarded: number
    recentActivity: number
  }
  scholarshipApplications: Record<string, number>
  collegeApplications: Record<string, number>
  studentsByStage: Record<string, number>
  monthlyApplications: { month: string; count: number }[]
  cohorts: { id: string; name: string; members: number }[]
}

export default function AnalyticsPage() {
  const [data, setData] = React.useState<AnalyticsData | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => { toast.error("Failed to load analytics data"); setLoading(false) })
  }, [])

  const scholarshipPipeline = React.useMemo(() => {
    if (!data) return []
    return Object.entries(data.scholarshipApplications).map(([status, count]) => ({
      status: STATUS_LABELS[status] || status,
      count,
    }))
  }, [data])

  const collegePie = React.useMemo(() => {
    if (!data) return []
    return Object.entries(data.collegeApplications).map(([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      value: count,
    }))
  }, [data])

  const stageData = React.useMemo(() => {
    if (!data) return []
    return Object.entries(data.studentsByStage).map(([stage, count]) => ({
      stage: STAGE_LABELS[stage] || stage,
      count,
    }))
  }, [data])

  const monthlyData = React.useMemo(() => {
    if (!data) return []
    return data.monthlyApplications.map((m) => ({
      month: new Date(m.month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      count: m.count,
    }))
  }, [data])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">Loading analytics...</p>
      </div>
    )
  }

  const o = data?.overview

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Reports"
        description="Track student outcomes, scholarship wins, and program performance."
      />

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={o ? `${o.activeStudents} / ${o.totalStudents}` : "--"}
          description="active / total"
          icon={Users}
          index={0}
        />
        <StatCard
          title="Scholarship Applications"
          value={o?.totalApplications ?? 0}
          icon={FileText}
          index={1}
        />
        <StatCard
          title="Total Awarded"
          value={o ? `$${o.totalAwarded.toLocaleString()}` : "--"}
          icon={DollarSign}
          index={2}
        />
        <StatCard
          title="College Applications"
          value={o?.totalCollegeApps ?? 0}
          icon={GraduationCap}
          index={3}
        />
      </div>

      {/* Two-column charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scholarship Application Pipeline */}
        <Card variant="bento">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-secondary-foreground">
              Scholarship Application Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scholarshipPipeline} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis dataKey="status" type="category" tick={{ fontSize: 11 }} stroke="#94a3b8" width={90} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Applications">
                    {scholarshipPipeline.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* College Application Status */}
        <Card variant="bento">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-secondary-foreground">
              College Application Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={collegePie}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {collegePie.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Over Time */}
      <Card variant="bento">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-secondary-foreground">
            Applications Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fill="url(#colorCount)"
                  name="Applications"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bottom two-column grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Students by Journey Stage */}
        <Card variant="bento">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-secondary-foreground">
              Students by Journey Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="stage" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Students">
                    {stageData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cohort Overview */}
        <Card variant="bento">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-secondary-foreground">
              Cohort Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.cohorts && data.cohorts.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 border-b border-border pb-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cohort</span>
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground text-right">Members</span>
                </div>
                {data.cohorts.map((cohort) => (
                  <div key={cohort.id} className="grid grid-cols-2 py-2 border-b border-border last:border-0">
                    <span className="text-sm text-foreground">{cohort.name}</span>
                    <span className="text-sm font-medium text-secondary-foreground text-right">{cohort.members}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No cohorts found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
