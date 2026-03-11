"use client"

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

const stats = [
  {
    label: "Scholarships Matched",
    value: "24",
    change: "+3 this week",
    icon: Search,
    color: "text-[#2563EB]",
    bg: "bg-blue-50",
  },
  {
    label: "Applications In Progress",
    value: "7",
    change: "2 due this week",
    icon: FileText,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    label: "Awards Won",
    value: "$12,500",
    change: "3 scholarships",
    icon: DollarSign,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    label: "Tasks Due",
    value: "5",
    change: "2 overdue",
    icon: CheckSquare,
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
]

const recentActivity = [
  {
    id: 1,
    action: "Submitted application",
    target: "Gates Millennium Scholarship",
    time: "2 hours ago",
    icon: FileText,
    color: "text-emerald-600",
  },
  {
    id: 2,
    action: "Essay reviewed",
    target: "Personal Statement - Draft 3",
    time: "5 hours ago",
    icon: PenTool,
    color: "text-[#2563EB]",
  },
  {
    id: 3,
    action: "New match found",
    target: "Coca-Cola Scholars Foundation",
    time: "1 day ago",
    icon: Star,
    color: "text-amber-500",
  },
  {
    id: 4,
    action: "Task completed",
    target: "Upload unofficial transcript",
    time: "1 day ago",
    icon: CheckSquare,
    color: "text-emerald-600",
  },
  {
    id: 5,
    action: "Award notification",
    target: "National Merit Scholarship - $2,500",
    time: "3 days ago",
    icon: Award,
    color: "text-purple-600",
  },
]

const upcomingDeadlines = [
  {
    id: 1,
    name: "Jack Kent Cooke Foundation",
    date: "Mar 22, 2026",
    daysLeft: 11,
    amount: "$55,000",
    status: "in_progress",
  },
  {
    id: 2,
    name: "QuestBridge National College Match",
    date: "Mar 27, 2026",
    daysLeft: 16,
    amount: "Full Tuition",
    status: "not_started",
  },
  {
    id: 3,
    name: "Ron Brown Scholar Program",
    date: "Apr 1, 2026",
    daysLeft: 21,
    amount: "$40,000",
    status: "in_progress",
  },
  {
    id: 4,
    name: "Elks National Foundation",
    date: "Apr 10, 2026",
    daysLeft: 30,
    amount: "$50,000",
    status: "not_started",
  },
]

const quickActions = [
  { label: "Find Scholarships", href: "/student/scholarships", icon: Search, variant: "default" as const },
  { label: "Start Application", href: "/student/applications", icon: FileText, variant: "outline" as const },
  { label: "Continue Essay", href: "/student/essays", icon: PenTool, variant: "outline" as const },
  { label: "View Tasks", href: "/student/tasks", icon: CheckSquare, variant: "outline" as const },
]

export default function StudentDashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1E3A5F]">
          Welcome back, Maya
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
                    <p className="text-2xl font-bold text-[#1E3A5F]">{stat.value}</p>
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
            <div className="space-y-3">
              {upcomingDeadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  className="rounded-lg border p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-tight">{deadline.name}</p>
                    <Badge
                      variant={deadline.status === "in_progress" ? "default" : "secondary"}
                      className="shrink-0 text-[10px]"
                    >
                      {deadline.status === "in_progress" ? "In Progress" : "Not Started"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {deadline.date}
                    </span>
                    <span className="font-medium text-[#1E3A5F]">{deadline.amount}</span>
                  </div>
                  <p className={`text-xs font-medium ${deadline.daysLeft <= 14 ? "text-rose-600" : "text-muted-foreground"}`}>
                    {deadline.daysLeft} days left
                  </p>
                </div>
              ))}
            </div>
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
