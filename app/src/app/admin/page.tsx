"use client"

import * as React from "react"
import { StatCard } from "@/components/ui/stat-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, FileText, Award, AlertTriangle, Clock } from "lucide-react"
import { toast } from "sonner"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface Student {
  id: string
  name?: string | null
  email: string
  studentProfile?: { status?: string | null } | null
  tasks?: Array<{ status: string; dueDate?: string | null }>
}

interface AuditLog {
  id: string
  action: string
  resource: string
  details?: string | null
  createdAt: string
  user?: { name?: string | null; email: string } | null
}

const engagementData = [
  { month: "Sep", logins: 120, tasks: 85, essays: 30 },
  { month: "Oct", logins: 145, tasks: 110, essays: 45 },
  { month: "Nov", logins: 160, tasks: 125, essays: 55 },
  { month: "Dec", logins: 130, tasks: 90, essays: 40 },
  { month: "Jan", logins: 175, tasks: 140, essays: 60 },
  { month: "Feb", logins: 190, tasks: 155, essays: 72 },
  { month: "Mar", logins: 210, tasks: 170, essays: 80 },
]

const pipelineData = [
  { stage: "Researching", count: 42 },
  { stage: "Drafting", count: 35 },
  { stage: "Reviewing", count: 28 },
  { stage: "Submitted", count: 22 },
  { stage: "Awarded", count: 14 },
]

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48 skeleton-shimmer" />
        <Skeleton className="h-4 w-72 skeleton-shimmer" />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl skeleton-shimmer" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-2xl skeleton-shimmer" />
        <Skeleton className="h-80 rounded-2xl skeleton-shimmer" />
      </div>
    </div>
  )
}

function ActivityItemSkeleton() {
  return (
    <div className="flex items-start gap-3">
      <Skeleton className="size-8 rounded-full shrink-0 skeleton-shimmer" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4 skeleton-shimmer" />
        <Skeleton className="h-3 w-24 skeleton-shimmer" />
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [students, setStudents] = React.useState<Student[]>([])
  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    Promise.all([
      fetch("/api/students").then(r => r.json()),
      fetch("/api/audit?limit=10").then(r => r.json()),
    ])
      .then(([studentsData, auditData]) => {
        setStudents(Array.isArray(studentsData) ? studentsData : [])
        setAuditLogs(Array.isArray(auditData.logs) ? auditData.logs : [])
        setLoading(false)
      })
      .catch(() => { toast.error("Failed to load dashboard data"); setLoading(false) })
  }, [])

  if (loading) {
    return <DashboardSkeleton />
  }

  const totalStudents = students.length
  const atRiskStudents = students.filter(s => s.studentProfile?.status === "AT_RISK")

  return (
    <div className="flex flex-col gap-10 pb-8">
      {/* Header */}
      <div className="animate-card-entrance">
        <h1 className="text-4xl font-black tracking-tight text-foreground font-display">Dashboard</h1>
        <p className="mt-2 text-base text-muted-foreground">Welcome back. Here is your practice overview.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Students", value: totalStudents, icon: Users, trend: { value: 8, label: "vs last month" } },
          { title: "Active Applications", value: 84, icon: FileText, trend: { value: 12, label: "vs last month" } },
          { title: "Scholarships Awarded", value: "$1.2M", icon: Award, trend: { value: 23, label: "this cycle" } },
          { title: "At Risk Students", value: atRiskStudents.length, icon: AlertTriangle, trend: { value: -5, label: "vs last week" } },
        ].map((stat, i) => (
          <div key={stat.title} className="animate-card-entrance" style={{ animationDelay: `${i * 80}ms` }}>
            <StatCard {...stat} />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Engagement Chart */}
        <div className="rounded-2xl bg-card p-6 shadow-lg shadow-black/[0.04] ring-1 ring-white/60 animate-card-entrance" style={{ animationDelay: "200ms" }}>
          <h3 className="mb-5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Student Engagement</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "none",
                    borderRadius: "16px",
                    fontSize: "12px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
                  }}
                />
                <Line type="monotone" dataKey="logins" stroke="#1E3A5F" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="tasks" stroke="#2563EB" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="essays" stroke="#7c3aed" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center gap-5">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2.5 rounded-full bg-[#1E3A5F]" /> Logins
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2.5 rounded-full bg-[#2563EB]" /> Tasks
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2.5 rounded-full bg-[#7c3aed]" /> Essays
            </span>
          </div>
        </div>

        {/* Pipeline Chart */}
        <div className="rounded-2xl bg-card p-6 shadow-lg shadow-black/[0.04] ring-1 ring-white/60 animate-card-entrance" style={{ animationDelay: "280ms" }}>
          <h3 className="mb-5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Application Pipeline</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="stage" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "none",
                    borderRadius: "16px",
                    fontSize: "12px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
                  }}
                />
                <Bar dataKey="count" fill="#1E3A5F" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-2xl bg-card p-6 shadow-lg shadow-black/[0.04] ring-1 ring-white/60 animate-card-entrance" style={{ animationDelay: "360ms" }}>
          <h3 className="mb-5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Recent Activity</h3>
          <div className="flex flex-col gap-3">
            {auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No recent activity.</p>
            ) : auditLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 rounded-xl p-2 transition-colors hover:bg-muted/50">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#1E3A5F]/8">
                  <Clock className="size-3.5 text-[#1E3A5F]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{log.user?.name || log.user?.email || "System"}</span>{" "}
                    <span className="text-muted-foreground">{log.action.toLowerCase()} {log.resource.toLowerCase()}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* At-Risk Students */}
        <div className="rounded-2xl bg-card p-6 shadow-lg shadow-black/[0.04] ring-1 ring-white/60 animate-card-entrance" style={{ animationDelay: "440ms" }}>
          <div className="mb-5 flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-amber-50">
              <AlertTriangle className="size-4 text-amber-500" />
            </div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">At-Risk Students</h3>
          </div>
          <div className="flex flex-col gap-3">
            {atRiskStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No at-risk students.</p>
            ) : atRiskStudents.slice(0, 5).map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between rounded-xl bg-amber-50/50 p-4 ring-1 ring-amber-200/40 transition-colors hover:bg-amber-50"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{student.name || student.email}</p>
                  <p className="text-xs text-muted-foreground">Status: At Risk</p>
                </div>
                <span className="inline-flex h-5 items-center rounded-full bg-amber-100 px-2.5 text-xs font-medium text-amber-700">
                  At Risk
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
