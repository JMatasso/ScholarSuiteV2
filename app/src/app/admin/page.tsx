"use client"

import * as React from "react"
import { motion } from "motion/react"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, FileText, Award, AlertTriangle, Clock, TrendingUp, TrendingDown, ArrowRight, GraduationCap } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
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

// Mini sparkline data for KPI cards
const sparkStudents = [{ v: 20 }, { v: 25 }, { v: 22 }, { v: 30 }, { v: 28 }, { v: 35 }, { v: 40 }]
const sparkApps = [{ v: 50 }, { v: 55 }, { v: 60 }, { v: 58 }, { v: 70 }, { v: 75 }, { v: 84 }]
const sparkAwards = [{ v: 200 }, { v: 400 }, { v: 600 }, { v: 750 }, { v: 900 }, { v: 1000 }, { v: 1200 }]
const sparkRisk = [{ v: 5 }, { v: 4 }, { v: 3 }, { v: 4 }, { v: 2 }, { v: 1 }, { v: 0 }]
const sparkCollege = [{ v: 5 }, { v: 10 }, { v: 18 }, { v: 25 }, { v: 32 }, { v: 40 }, { v: 48 }]

type KpiTone = "blue" | "indigo" | "emerald" | "amber"

const toneStyles: Record<KpiTone, { card: string; value: string; sparkColor: string; iconBg: string; iconColor: string; trendUp: string; trendDown: string }> = {
  blue: {
    card: "bg-blue-50/70 ring-1 ring-blue-200/60",
    value: "text-blue-700",
    sparkColor: "#2563EB",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    trendUp: "text-emerald-600",
    trendDown: "text-rose-600",
  },
  indigo: {
    card: "bg-indigo-50/70 ring-1 ring-indigo-200/60",
    value: "text-indigo-700",
    sparkColor: "#6366F1",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    trendUp: "text-emerald-600",
    trendDown: "text-rose-600",
  },
  emerald: {
    card: "bg-emerald-50/70 ring-1 ring-emerald-200/60",
    value: "text-emerald-700",
    sparkColor: "#10B981",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    trendUp: "text-emerald-700",
    trendDown: "text-rose-600",
  },
  amber: {
    card: "bg-amber-50/70 ring-1 ring-amber-200/60",
    value: "text-amber-700",
    sparkColor: "#F59E0B",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    trendUp: "text-emerald-600",
    trendDown: "text-rose-600",
  },
}

function KpiCard({
  title,
  value,
  icon: Icon,
  trend,
  tone,
  sparkData,
  index = 0,
}: {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend: { value: number; label: string }
  tone: KpiTone
  sparkData: { v: number }[]
  index?: number
}) {
  const t = toneStyles[tone]
  const isUp = trend.value >= 0
  const TrendIcon = isUp ? TrendingUp : TrendingDown

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className={cn(
        "relative overflow-hidden rounded-xl p-5 transform-gpu [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] transition-all duration-300 hover:[box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_4px_8px_rgba(0,0,0,.07),0_16px_32px_rgba(0,0,0,.07)]",
        t.card
      )}
    >
      {/* Decorative corner circles */}
      <span className="pointer-events-none absolute -right-6 -top-6 inline-flex h-16 w-16 rounded-full bg-black/[0.03]" />
      <span className="pointer-events-none absolute -right-2 -top-2 inline-flex h-8 w-8 rounded-full bg-black/[0.03]" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn("text-3xl font-bold tracking-tight", t.value)}>{value}</p>
          <div className="flex items-center gap-1.5">
            <span className={cn("flex items-center gap-1 text-xs font-semibold", isUp ? t.trendUp : t.trendDown)}>
              <TrendIcon className="h-3.5 w-3.5" />
              {isUp ? "+" : ""}{trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", t.iconBg)}>
            <Icon className={cn("h-5 w-5", t.iconColor)} />
          </div>
          {/* Sparkline */}
          <div className="h-8 w-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={t.sparkColor}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48 skeleton-shimmer" />
        <Skeleton className="h-4 w-72 skeleton-shimmer" />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl skeleton-shimmer" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-2xl skeleton-shimmer" />
        <Skeleton className="h-80 rounded-2xl skeleton-shimmer" />
      </div>
    </div>
  )
}

const actionColors: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-rose-100 text-rose-700",
  LOGIN: "bg-gray-100 text-gray-700",
  UPLOAD: "bg-purple-100 text-purple-700",
  SUBMIT: "bg-amber-100 text-amber-700",
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
    <div className="flex flex-col gap-8 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="flex items-end justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold text-[#1E3A5F]">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Welcome back. Here is your practice overview.</p>
        </div>
      </motion.div>

      {/* KPI Cards with colored tones + sparklines */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="Total Students"
          value={totalStudents}
          icon={Users}
          trend={{ value: 8, label: "vs last month" }}
          tone="blue"
          sparkData={sparkStudents}
          index={0}
        />
        <KpiCard
          title="Active Applications"
          value={84}
          icon={FileText}
          trend={{ value: 12, label: "vs last month" }}
          tone="indigo"
          sparkData={sparkApps}
          index={1}
        />
        <KpiCard
          title="Scholarships Awarded"
          value="$1.2M"
          icon={Award}
          trend={{ value: 23, label: "this cycle" }}
          tone="emerald"
          sparkData={sparkAwards}
          index={2}
        />
        <KpiCard
          title="College Acceptances"
          value={48}
          icon={GraduationCap}
          trend={{ value: 15, label: "this cycle" }}
          tone="indigo"
          sparkData={sparkCollege}
          index={3}
        />
        <KpiCard
          title="At Risk Students"
          value={atRiskStudents.length}
          icon={AlertTriangle}
          trend={{ value: -5, label: "vs last week" }}
          tone="amber"
          sparkData={sparkRisk}
          index={4}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Engagement Chart - Area gradient */}
        <motion.div
          className="rounded-xl bg-white p-6 transform-gpu [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] transition-all duration-300 hover:[box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_4px_8px_rgba(0,0,0,.07),0_16px_32px_rgba(0,0,0,.07)]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          viewport={{ once: true }}
        >
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1E3A5F]">Student Engagement</h3>
            <span className="text-xs text-muted-foreground">Last 7 months</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={engagementData}>
                <defs>
                  <linearGradient id="gradLogins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1E3A5F" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#1E3A5F" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradEssays" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    fontSize: "12px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
                  }}
                />
                <Area type="monotone" dataKey="logins" stroke="#1E3A5F" strokeWidth={2} fill="url(#gradLogins)" />
                <Area type="monotone" dataKey="tasks" stroke="#2563EB" strokeWidth={2} fill="url(#gradTasks)" />
                <Area type="monotone" dataKey="essays" stroke="#7c3aed" strokeWidth={2} fill="url(#gradEssays)" />
              </AreaChart>
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
        </motion.div>

        {/* Pipeline Chart - Rounded bars with gradient */}
        <motion.div
          className="rounded-xl bg-white p-6 transform-gpu [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] transition-all duration-300 hover:[box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_4px_8px_rgba(0,0,0,.07),0_16px_32px_rgba(0,0,0,.07)]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          viewport={{ once: true }}
        >
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1E3A5F]">Application Pipeline</h3>
            <span className="text-xs text-muted-foreground">{pipelineData.reduce((s, d) => s + d.count, 0)} total</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} barCategoryGap="20%">
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#1E3A5F" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} stroke="#94a3b8" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    fontSize: "12px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
                  }}
                />
                <Bar dataKey="count" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <motion.div
          className="rounded-xl bg-white p-6 transform-gpu [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] transition-all duration-300 hover:[box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_4px_8px_rgba(0,0,0,.07),0_16px_32px_rgba(0,0,0,.07)]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          viewport={{ once: true }}
        >
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1E3A5F]">Recent Activity</h3>
            <Link href="/admin/audit" className="flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-gray-100">
            {auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No recent activity.</p>
            ) : auditLogs.slice(0, 8).map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className={cn(
                  "inline-flex h-6 items-center rounded-md px-2 text-[10px] font-semibold uppercase tracking-wide",
                  actionColors[log.action] || "bg-gray-100 text-gray-600"
                )}>
                  {log.action}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm text-foreground">
                    <span className="font-medium">{log.user?.name || log.user?.email || "System"}</span>{" "}
                    <span className="text-muted-foreground">{log.resource.toLowerCase()}</span>
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(log.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* At-Risk Students */}
        <motion.div
          className="rounded-xl bg-white p-6 transform-gpu [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] transition-all duration-300 hover:[box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_4px_8px_rgba(0,0,0,.07),0_16px_32px_rgba(0,0,0,.07)]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          viewport={{ once: true }}
        >
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <h3 className="text-sm font-semibold text-[#1E3A5F]">At-Risk Students</h3>
            </div>
            <Link href="/admin/students" className="flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {atRiskStudents.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 mb-3">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-foreground">All students on track</p>
                <p className="text-xs text-muted-foreground mt-1">No at-risk students at this time.</p>
              </div>
            ) : atRiskStudents.slice(0, 5).map((student, i) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="flex items-center justify-between rounded-xl bg-amber-50/60 p-4 ring-1 ring-amber-200/40 transition-all hover:bg-amber-50 hover:ring-amber-300/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700">
                    {(student.name || student.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{student.name || student.email}</p>
                    <p className="text-xs text-muted-foreground">{student.email}</p>
                  </div>
                </div>
                <span className="inline-flex h-6 items-center rounded-full bg-amber-100 px-2.5 text-xs font-semibold text-amber-700">
                  At Risk
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
