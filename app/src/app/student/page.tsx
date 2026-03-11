"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  FileText,
  PenTool,
  CheckSquare,
  TrendingUp,
  Clock,
  DollarSign,
  Award,
  ArrowRight,
  Calendar,
  BookOpen,
  Star,
} from "lucide-react"
import Link from "next/link"

interface Task {
  id: string
  status: "NOT_STARTED" | "IN_PROGRESS" | "DONE"
  dueDate: string | null
}

interface Application {
  id: string
  status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "AWARDED" | "DENIED"
  scholarship: {
    name: string
    amount: number | null
    deadline: string | null
  }
  updatedAt: string
}

interface Scholarship {
  id: string
  name: string
}

interface Essay {
  id: string
  title: string
  status: string
  updatedAt: string
}

const quickActions = [
  { label: "Find Scholarships", href: "/student/scholarships", icon: Search, variant: "default" as const },
  { label: "Start Application", href: "/student/applications", icon: FileText, variant: "outline" as const },
  { label: "Continue Essay", href: "/student/essays", icon: PenTool, variant: "outline" as const },
  { label: "View Tasks", href: "/student/tasks", icon: CheckSquare, variant: "outline" as const },
]

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "No deadline"
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function StudentDashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [scholarships, setScholarships] = useState<Scholarship[]>([])
  const [essays, setEssays] = useState<Essay[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    // Get user name from session
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => {
        if (s?.user?.name) setUserName(s.user.name.split(" ")[0])
      })
      .catch(() => {})

    Promise.all([
      fetch("/api/tasks").then((r) => r.json()).catch(() => []),
      fetch("/api/applications").then((r) => r.json()).catch(() => []),
      fetch("/api/scholarships").then((r) => r.json()).catch(() => []),
      fetch("/api/essays").then((r) => r.json()).catch(() => []),
    ]).then(([tasksData, appsData, scholData, essaysData]) => {
      setTasks(Array.isArray(tasksData) ? tasksData : [])
      setApplications(Array.isArray(appsData) ? appsData : [])
      setScholarships(Array.isArray(scholData) ? scholData : [])
      setEssays(Array.isArray(essaysData) ? essaysData : [])
      setLoading(false)
    })
  }, [])

  // Compute stats
  const totalScholarshipsMatched = scholarships.length
  const appsInProgress = applications.filter((a) => a.status === "IN_PROGRESS" || a.status === "NOT_STARTED").length
  const totalAwarded = applications
    .filter((a) => a.status === "AWARDED")
    .reduce((sum, a) => sum + (a.scholarship.amount ?? 0), 0)
  const tasksDue = tasks.filter((t) => t.status !== "DONE" && t.dueDate && daysUntil(t.dueDate)! <= 7).length
  const tasksOverdue = tasks.filter((t) => t.status !== "DONE" && t.dueDate && daysUntil(t.dueDate)! < 0).length

  const stats = [
    {
      label: "Scholarships Matched",
      value: String(totalScholarshipsMatched),
      change: "Available scholarships",
      icon: Search,
      color: "text-[#2563EB]",
      bg: "bg-blue-50",
    },
    {
      label: "Applications In Progress",
      value: String(appsInProgress),
      change: `${applications.filter((a) => {
        const d = a.scholarship.deadline
        return d && daysUntil(d)! <= 7 && daysUntil(d)! >= 0
      }).length} due this week`,
      icon: FileText,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Awards Won",
      value: totalAwarded > 0 ? `$${totalAwarded.toLocaleString()}` : "$0",
      change: `${applications.filter((a) => a.status === "AWARDED").length} scholarships`,
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Tasks Due",
      value: String(tasksDue),
      change: tasksOverdue > 0 ? `${tasksOverdue} overdue` : "All on track",
      icon: CheckSquare,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
  ]

  // Upcoming deadlines from applications with future deadlines
  const upcomingDeadlines = applications
    .filter((a) => a.scholarship.deadline && daysUntil(a.scholarship.deadline)! >= 0)
    .sort((a, b) => {
      const da = daysUntil(a.scholarship.deadline)!
      const db = daysUntil(b.scholarship.deadline)!
      return da - db
    })
    .slice(0, 4)

  // Recent activity from recently updated applications and essays
  const recentActivity = [
    ...applications.slice(0, 3).map((a) => ({
      id: `app-${a.id}`,
      action: a.status === "SUBMITTED" ? "Application submitted" : a.status === "AWARDED" ? "Award received" : "Application updated",
      target: a.scholarship.name,
      time: new Date(a.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      icon: a.status === "AWARDED" ? Award : FileText,
      color: a.status === "AWARDED" ? "text-purple-600" : "text-emerald-600",
    })),
    ...essays.slice(0, 2).map((e) => ({
      id: `essay-${e.id}`,
      action: "Essay updated",
      target: e.title,
      time: new Date(e.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      icon: PenTool,
      color: "text-[#2563EB]",
    })),
  ].slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1E3A5F]">
          Welcome back{userName ? `, ${userName}` : ""}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here is what is happening with your scholarship journey today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="pt-0">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-[#1E3A5F]">
                      {loading ? "—" : stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.change}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#2563EB]" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const Icon = activity.icon
                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Icon className={`h-4 w-4 ${activity.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="text-muted-foreground">{activity.action}</span>
                          {" "}
                          <span className="font-medium text-foreground">{activity.target}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#2563EB]" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming deadlines.</p>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((app) => {
                  const days = daysUntil(app.scholarship.deadline)
                  return (
                    <div key={app.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">{app.scholarship.name}</p>
                        <Badge
                          variant={app.status === "IN_PROGRESS" ? "default" : "secondary"}
                          className="shrink-0 text-[10px]"
                        >
                          {app.status === "IN_PROGRESS" ? "In Progress" : "Not Started"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(app.scholarship.deadline)}
                        </span>
                        {app.scholarship.amount && (
                          <span className="font-medium text-[#1E3A5F]">
                            ${app.scholarship.amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                      {days !== null && (
                        <p className={`text-xs font-medium ${days <= 14 ? "text-rose-600" : "text-muted-foreground"}`}>
                          {days} days left
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#2563EB]" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.label} href={action.href}>
                  <Button variant={action.variant} size="lg" className="gap-2">
                    <Icon className="h-4 w-4" />
                    {action.label}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
