"use client"

import * as React from "react"
import { StatCard } from "@/components/ui/stat-card"
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

  const totalStudents = students.length
  const atRiskStudents = students.filter(s => s.studentProfile?.status === "AT_RISK")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back. Here is your practice overview.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={loading ? "—" : totalStudents}
          icon={Users}
          trend={{ value: 8, label: "vs last month" }}
        />
        <StatCard
          title="Active Applications"
          value={84}
          icon={FileText}
          trend={{ value: 12, label: "vs last month" }}
        />
        <StatCard
          title="Scholarships Awarded"
          value="$1.2M"
          icon={Award}
          trend={{ value: 23, label: "this cycle" }}
        />
        <StatCard
          title="At Risk Students"
          value={loading ? "—" : atRiskStudents.length}
          icon={AlertTriangle}
          trend={{ value: -5, label: "vs last week" }}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Engagement Chart */}
        <div className="rounded-xl bg-white p-5 ring-1 ring-foreground/10">
          <h3 className="mb-4 text-sm font-medium text-foreground">Student Engagement</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line type="monotone" dataKey="logins" stroke="#1E3A5F" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="tasks" stroke="#2563EB" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="essays" stroke="#7c3aed" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-[#1E3A5F]" /> Logins
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-[#2563EB]" /> Tasks
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-[#7c3aed]" /> Essays
            </span>
          </div>
        </div>

        {/* Pipeline Chart */}
        <div className="rounded-xl bg-white p-5 ring-1 ring-foreground/10">
          <h3 className="mb-4 text-sm font-medium text-foreground">Application Pipeline</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="stage" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-xl bg-white p-5 ring-1 ring-foreground/10">
          <h3 className="mb-4 text-sm font-medium text-foreground">Recent Activity</h3>
          <div className="flex flex-col gap-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : auditLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3">
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#1E3A5F]/10">
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
        <div className="rounded-xl bg-white p-5 ring-1 ring-foreground/10">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-500" />
            <h3 className="text-sm font-medium text-foreground">At-Risk Students</h3>
          </div>
          <div className="flex flex-col gap-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : atRiskStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No at-risk students.</p>
            ) : atRiskStudents.slice(0, 5).map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{student.name || student.email}</p>
                  <p className="text-xs text-muted-foreground">Status: At Risk</p>
                </div>
                <span className="inline-flex h-5 items-center rounded-full bg-amber-100 px-2 text-xs font-medium text-amber-700">
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
