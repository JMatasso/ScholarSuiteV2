"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search,
  FileText,
  PenTool,
  CheckSquare,
  DollarSign,
  Award,
  ArrowRight,
  Clock,
  GraduationCap,
  Building2,
  CheckCircle2,
  Star,
  Calendar,
  Video,
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDate, formatTime, getInitials } from "@/lib/format"
import { CompletionBanner } from "@/components/ui/completion-banner"

interface Task {
  id: string
  title: string
  status: "NOT_STARTED" | "IN_PROGRESS" | "DONE"
  priority: "LOW" | "MEDIUM" | "HIGH"
  dueDate: string | null
  phase: string
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

interface CollegeApp {
  id: string
  universityName: string
  applicationType: string
  status: string
  deadline: string | null
  isDream: boolean
  isSafety: boolean
}

interface Essay {
  id: string
  title: string
  status: string
  updatedAt: string
}

interface ActivityEntry {
  id: string
  title: string
  category: string
  totalHours: number | null
  isLeadership: boolean
  isAward: boolean
}

interface Meeting {
  id: string
  title: string
  startTime: string
  isVideoCall: boolean
  meetingUrl: string | null
}

interface Message {
  id: string
  content: string
  senderId: string
  sender?: { name?: string; image?: string | null }
  createdAt: string
  isRead: boolean
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function StatSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-lg shadow-black/[0.04] ring-1 ring-white/60">
      <Skeleton className="h-3 w-20 skeleton-shimmer" />
      <Skeleton className="h-8 w-16 skeleton-shimmer" />
      <Skeleton className="h-3 w-24 skeleton-shimmer" />
    </div>
  )
}

function getIncompleteSections(flags: Record<string, boolean> | null): Array<{ label: string; href: string }> {
  if (!flags) return []
  const sections: Array<{ label: string; href: string }> = []
  if (!flags.personal) sections.push({ label: "Personal Info", href: "/student/onboarding" })
  if (!flags.academic) sections.push({ label: "Academic Info", href: "/student/onboarding" })
  if (!flags.background) sections.push({ label: "Background", href: "/student/onboarding" })
  if (!flags.financial) sections.push({ label: "Financial Info", href: "/student/onboarding" })
  if (!flags.activities) sections.push({ label: "Activities", href: "/student/onboarding" })
  if (!flags.goals) sections.push({ label: "Goals", href: "/student/onboarding" })
  return sections
}

const appTypeShort: Record<string, string> = {
  REGULAR: "Regular",
  EARLY_DECISION: "ED",
  EARLY_ACTION: "EA",
  ROLLING: "Rolling",
}

const collegeStatusColor: Record<string, string> = {
  RESEARCHING: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  SUBMITTED: "bg-purple-100 text-purple-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  DENIED: "bg-rose-100 text-rose-700",
  WAITLISTED: "bg-amber-100 text-amber-700",
  DEFERRED: "bg-gray-100 text-gray-600",
}

export default function StudentDashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [scholarships, setScholarships] = useState<{ id: string }[]>([])
  const [collegeApps, setCollegeApps] = useState<CollegeApp[]>([])
  const [essays, setEssays] = useState<Essay[]>([])
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string | null>(null)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [completionData, setCompletionData] = useState<{ percentage: number; flags: Record<string, boolean> | null } | null>(null)

  // Mini calendar state
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())

  useEffect(() => {
    if (sessionStorage.getItem("student-banner-dismissed")) {
      setBannerDismissed(true)
    } else {
      fetch("/api/auth/onboarding-status")
        .then(r => r.json())
        .then(d => {
          if (d.completionPercentage < 100) {
            setCompletionData({ percentage: d.completionPercentage, flags: d.completionFlags })
          }
        })
        .catch(() => {})
    }
  }, [])

  const handleDismissBanner = () => {
    setBannerDismissed(true)
    sessionStorage.setItem("student-banner-dismissed", "true")
  }

  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(s => { if (s?.user?.name) setUserName(s.user.name.split(" ")[0]) })
      .catch(() => {})

    Promise.all([
      fetch("/api/tasks").then(r => r.json()).catch(() => []),
      fetch("/api/applications").then(r => r.json()).catch(() => []),
      fetch("/api/scholarships").then(r => r.json()).catch(() => []),
      fetch("/api/college-applications").then(r => r.json()).catch(() => []),
      fetch("/api/essays").then(r => r.json()).catch(() => []),
      fetch("/api/activities").then(r => r.json()).catch(() => []),
      fetch("/api/meetings").then(r => r.json()).catch(() => []),
      fetch("/api/messages").then(r => r.json()).catch(() => []),
    ]).then(([t, a, s, c, e, act, m, msg]) => {
      setTasks(Array.isArray(t) ? t : [])
      setApplications(Array.isArray(a) ? a : [])
      setScholarships(Array.isArray(s) ? s : [])
      setCollegeApps(Array.isArray(c) ? c : [])
      setEssays(Array.isArray(e) ? e : [])
      setActivities(Array.isArray(act) ? act : [])
      setMeetings(Array.isArray(m) ? m : [])
      setMessages(Array.isArray(msg) ? msg : [])
      setLoading(false)
    })
  }, [])

  // Scholarship stats
  const totalMatched = scholarships.length
  const appsInProgress = applications.filter(a => a.status === "IN_PROGRESS" || a.status === "NOT_STARTED").length
  const totalAwarded = applications.filter(a => a.status === "AWARDED").reduce((sum, a) => sum + (a.scholarship.amount ?? 0), 0)

  // College stats
  const collegeApplied = collegeApps.filter(c => ["SUBMITTED", "ACCEPTED", "DENIED", "WAITLISTED", "DEFERRED"].includes(c.status)).length
  const collegeAccepted = collegeApps.filter(c => c.status === "ACCEPTED").length

  // Task stats
  const activeTasks = tasks.filter(t => t.status !== "DONE")
  const overdueTasks = activeTasks.filter(t => t.dueDate && daysUntil(t.dueDate)! < 0)
  const urgentTasks = activeTasks
    .sort((a, b) => {
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })
    .slice(0, 6)
  const taskCompletion = tasks.length > 0
    ? Math.round((tasks.filter(t => t.status === "DONE").length / tasks.length) * 100)
    : 0

  // Most urgent deadline across everything
  const allDeadlines = [
    ...applications.filter(a => a.scholarship.deadline && daysUntil(a.scholarship.deadline)! > 0 && daysUntil(a.scholarship.deadline)! <= 7)
      .map(a => ({ name: a.scholarship.name, days: daysUntil(a.scholarship.deadline)!, type: "scholarship" })),
    ...collegeApps.filter(c => c.deadline && daysUntil(c.deadline)! > 0 && daysUntil(c.deadline)! <= 7)
      .map(c => ({ name: c.universityName, days: daysUntil(c.deadline)!, type: "college" })),
  ].sort((a, b) => a.days - b.days)

  const urgentDeadline = allDeadlines[0]

  // Brag sheet stats
  const totalHours = activities.reduce((sum, a) => sum + (a.totalHours ?? 0), 0)
  const leadershipCount = activities.filter(a => a.isLeadership).length
  const awardCount = activities.filter(a => a.isAward).length

  // Next meeting
  const now = new Date()
  const nextMeeting = meetings
    .filter(m => new Date(m.startTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0]

  // Top essays
  const activeEssays = essays.filter(e => e.status !== "APPROVED").slice(0, 3)

  // Mini calendar
  const calDays = new Date(calYear, calMonth + 1, 0).getDate()
  const calFirstDay = new Date(calYear, calMonth, 1).getDay()
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

  // Collect deadline dates for calendar dots
  const deadlineDates = new Set<number>()
  const isCurrentMonth = (d: string | null) => {
    if (!d) return false
    const dt = new Date(d)
    return dt.getMonth() === calMonth && dt.getFullYear() === calYear
  }
  tasks.forEach(t => { if (isCurrentMonth(t.dueDate)) deadlineDates.add(new Date(t.dueDate!).getDate()) })
  applications.forEach(a => { if (isCurrentMonth(a.scholarship.deadline)) deadlineDates.add(new Date(a.scholarship.deadline!).getDate()) })
  collegeApps.forEach(c => { if (isCurrentMonth(c.deadline)) deadlineDates.add(new Date(c.deadline!).getDate()) })

  const today = new Date()
  const isToday = (day: number) => day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear()

  const stats = [
    { label: "Scholarships Matched", value: String(totalMatched), sub: "Available", icon: Search, color: "text-[#2563EB]", bg: "bg-blue-50" },
    { label: "Scholarship Apps", value: String(appsInProgress), sub: `$${totalAwarded.toLocaleString()} won`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "College Apps", value: String(collegeApps.length), sub: `${collegeApplied} submitted`, icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Accepted", value: String(collegeAccepted), sub: `${collegeApps.filter(c => c.status === "WAITLISTED").length} waitlisted`, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Tasks Due", value: String(activeTasks.filter(t => t.dueDate && daysUntil(t.dueDate)! <= 7 && daysUntil(t.dueDate)! >= 0).length), sub: overdueTasks.length > 0 ? `${overdueTasks.length} overdue` : "All on track", icon: CheckSquare, color: overdueTasks.length > 0 ? "text-rose-600" : "text-amber-600", bg: overdueTasks.length > 0 ? "bg-rose-50" : "bg-amber-50" },
    { label: "Brag Sheet", value: String(activities.length), sub: `${totalHours.toLocaleString()} hrs`, icon: Activity, color: "text-[#1E3A5F]", bg: "bg-[#1E3A5F]/10" },
  ]

  const handleMarkDone = async (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "DONE" } : t))
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DONE" }),
      })
    } catch { /* revert on error would be nice but keeping simple */ }
  }

  return (
    <div className="space-y-8 pb-8">
      {!bannerDismissed && completionData && completionData.percentage < 100 && (
        <CompletionBanner
          percentage={completionData.percentage}
          incompleteSections={getIncompleteSections(completionData.flags)}
          onDismiss={handleDismissBanner}
        />
      )}

      {/* Welcome + Urgent Deadline */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
        <h1 className="text-4xl font-black tracking-tight text-[#1E3A5F] font-display">
          Welcome back{userName ? `, ${userName}` : ""}
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Here&apos;s what&apos;s happening with your scholarship &amp; college journey today.
        </p>
      </motion.div>

      {urgentDeadline && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 ${urgentDeadline.days <= 3 ? "bg-rose-50 ring-1 ring-rose-200" : "bg-amber-50 ring-1 ring-amber-200"}`}
        >
          <AlertTriangle className={`h-4 w-4 ${urgentDeadline.days <= 3 ? "text-rose-600" : "text-amber-600"}`} />
          <span className={`text-sm font-medium ${urgentDeadline.days <= 3 ? "text-rose-800" : "text-amber-800"}`}>
            {urgentDeadline.name} {urgentDeadline.type === "college" ? "application" : "scholarship"} deadline in {urgentDeadline.days} day{urgentDeadline.days !== 1 ? "s" : ""}
          </span>
        </motion.div>
      )}

      {/* Stat Cards — 6 cards: 3 scholarship + 3 college/activity */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}>
                <Card variant="bento" className="transition-all duration-300 hover:scale-[1.02]">
                  <CardContent className="pt-0">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold tracking-tight text-[#1E3A5F] font-display">{stat.value}</p>
                        <p className="text-[11px] text-muted-foreground">{stat.sub}</p>
                      </div>
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}>
                        <Icon className={`h-4 w-4 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Main Grid: Left (tasks + colleges + brag sheet) / Right (calendar + essays + scholarships + meeting) */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Column — 3/5 */}
        <div className="lg:col-span-3 space-y-6">
          {/* My Tasks */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <Card variant="bento">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-amber-50">
                      <CheckSquare className="h-3.5 w-3.5 text-amber-600" />
                    </div>
                    My Tasks
                    <span className="text-xs font-normal text-muted-foreground ml-1">{taskCompletion}% complete</span>
                  </CardTitle>
                  <Link href="/student/tasks">
                    <Button variant="ghost" size="sm" className="text-xs gap-1">View All <ArrowRight className="h-3 w-3" /></Button>
                  </Link>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mt-2">
                  <div className="h-full rounded-full bg-[#2563EB] transition-all duration-500" style={{ width: `${taskCompletion}%` }} />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {loading ? (
                  <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full skeleton-shimmer" />)}</div>
                ) : urgentTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">All tasks completed! Great work.</p>
                ) : (
                  <div className="space-y-1">
                    {urgentTasks.map(task => {
                      const days = daysUntil(task.dueDate)
                      const isOverdue = days !== null && days < 0
                      return (
                        <div key={task.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50 transition-colors group">
                          <button onClick={() => handleMarkDone(task.id)} className="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-gray-300 transition-colors hover:border-[#2563EB] hover:bg-[#2563EB]/10 group-hover:border-[#2563EB]">
                            {task.status === "DONE" && <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${task.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
                          </div>
                          {task.priority === "HIGH" && <Badge variant="secondary" className="bg-rose-100 text-rose-700 text-[10px]">High</Badge>}
                          {task.dueDate && (
                            <span className={`text-[11px] shrink-0 ${isOverdue ? "text-rose-600 font-semibold" : days !== null && days <= 3 ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                              {isOverdue ? `${Math.abs(days!)}d overdue` : days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days}d`}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* College Applications */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <Card variant="bento">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-purple-50">
                      <GraduationCap className="h-3.5 w-3.5 text-purple-600" />
                    </div>
                    College Applications
                  </CardTitle>
                  <Link href="/student/colleges/applications">
                    <Button variant="ghost" size="sm" className="text-xs gap-1">View All <ArrowRight className="h-3 w-3" /></Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {loading ? (
                  <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full skeleton-shimmer" />)}</div>
                ) : collegeApps.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">No colleges tracked yet</p>
                    <Link href="/student/colleges">
                      <Button size="sm" className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-1 text-xs">
                        <Building2 className="h-3 w-3" /> Search Colleges
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {collegeApps.slice(0, 5).map(app => (
                      <div key={app.id} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {app.isDream && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                          <span className="text-sm font-medium truncate">{app.universityName}</span>
                          <Badge variant="secondary" className="text-[10px] shrink-0 bg-gray-100 text-gray-500">{appTypeShort[app.applicationType] || app.applicationType}</Badge>
                        </div>
                        <Badge variant="secondary" className={`text-[10px] shrink-0 ${collegeStatusColor[app.status] || "bg-gray-100 text-gray-600"}`}>
                          {app.status.charAt(0) + app.status.slice(1).toLowerCase().replace("_", " ")}
                        </Badge>
                      </div>
                    ))}
                    {collegeApps.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center pt-1">+ {collegeApps.length - 5} more</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Brag Sheet Snapshot */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}>
            <Card variant="bento">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-[#1E3A5F]/10">
                      <Activity className="h-3.5 w-3.5 text-[#1E3A5F]" />
                    </div>
                    Brag Sheet
                  </CardTitle>
                  <Link href="/student/activities">
                    <Button variant="ghost" size="sm" className="text-xs gap-1">View Full Sheet <ArrowRight className="h-3 w-3" /></Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {loading ? (
                  <Skeleton className="h-16 w-full skeleton-shimmer" />
                ) : activities.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">Start building your brag sheet</p>
                    <Link href="/student/activities">
                      <Button size="sm" className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-1 text-xs">
                        <Activity className="h-3 w-3" /> Add Activities
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-6 text-sm">
                      <div><span className="text-lg font-bold text-[#1E3A5F]">{activities.length}</span> <span className="text-muted-foreground">activities</span></div>
                      <div><span className="text-lg font-bold text-[#1E3A5F]">{totalHours.toLocaleString()}</span> <span className="text-muted-foreground">hours</span></div>
                      <div><span className="text-lg font-bold text-[#1E3A5F]">{leadershipCount}</span> <span className="text-muted-foreground">leadership</span></div>
                      <div><span className="text-lg font-bold text-[#1E3A5F]">{awardCount}</span> <span className="text-muted-foreground">awards</span></div>
                    </div>
                    {/* Smart nudges */}
                    {activities.filter(a => a.category === "VOLUNTEER").length === 0 && (
                      <p className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Add volunteer activities to strengthen your brag sheet</p>
                    )}
                    {activities.filter(a => !a.totalHours).length > 0 && (
                      <p className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {activities.filter(a => !a.totalHours).length} activities missing hours</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column — 2/5 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mini Calendar */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}>
            <Link href="/student/calendar">
              <Card variant="bento" className="cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50">
                        <Calendar className="h-3.5 w-3.5 text-[#2563EB]" />
                      </div>
                      {monthNames[calMonth]} {calYear}
                    </CardTitle>
                    <div className="flex items-center gap-1" onClick={e => e.preventDefault()}>
                      <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }} className="p-1 rounded hover:bg-muted"><ChevronLeft className="h-3.5 w-3.5" /></button>
                      <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }} className="p-1 rounded hover:bg-muted"><ChevronRight className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-7 text-center text-[10px] text-muted-foreground mb-1">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <div key={d}>{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 text-center text-xs gap-y-0.5">
                    {Array.from({ length: calFirstDay }).map((_, i) => <div key={`e-${i}`} />)}
                    {Array.from({ length: calDays }, (_, i) => i + 1).map(day => (
                      <div key={day} className={`relative py-1 rounded ${isToday(day) ? "bg-[#2563EB] text-white font-bold" : ""}`}>
                        {day}
                        {deadlineDates.has(day) && !isToday(day) && (
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#2563EB]" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          {/* Top Scholarship Matches */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <Card variant="bento">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50">
                      <Award className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    Upcoming Deadlines
                  </CardTitle>
                  <Link href="/student/scholarships">
                    <Button variant="ghost" size="sm" className="text-xs gap-1">View All <ArrowRight className="h-3 w-3" /></Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {loading ? (
                  <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl skeleton-shimmer" />)}</div>
                ) : (
                  <div className="space-y-2">
                    {applications
                      .filter(a => a.scholarship.deadline && daysUntil(a.scholarship.deadline)! >= 0)
                      .sort((a, b) => daysUntil(a.scholarship.deadline)! - daysUntil(b.scholarship.deadline)!)
                      .slice(0, 3)
                      .map(app => {
                        const days = daysUntil(app.scholarship.deadline)
                        return (
                          <div key={app.id} className="rounded-xl bg-muted/30 p-3 space-y-1 hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium leading-tight">{app.scholarship.name}</p>
                              {app.scholarship.amount && <span className="text-xs font-semibold text-[#1E3A5F] shrink-0">${app.scholarship.amount.toLocaleString()}</span>}
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{formatDate(app.scholarship.deadline, "No deadline")}</span>
                              <span className={`font-medium ${days !== null && days <= 7 ? "text-rose-600" : ""}`}>{days}d left</span>
                            </div>
                          </div>
                        )
                      })}
                    {applications.filter(a => a.scholarship.deadline && daysUntil(a.scholarship.deadline)! >= 0).length === 0 && (
                      <p className="text-sm text-muted-foreground py-2">No upcoming deadlines</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Essays */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}>
            <Card variant="bento">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50">
                      <PenTool className="h-3.5 w-3.5 text-[#2563EB]" />
                    </div>
                    Essays
                  </CardTitle>
                  <Link href="/student/essays">
                    <Button variant="ghost" size="sm" className="text-xs gap-1">View All <ArrowRight className="h-3 w-3" /></Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {loading ? (
                  <Skeleton className="h-12 w-full skeleton-shimmer" />
                ) : activeEssays.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No essays in progress</p>
                ) : (
                  <div className="space-y-2">
                    {activeEssays.map(essay => (
                      <div key={essay.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors">
                        <span className="text-sm font-medium truncate">{essay.title}</span>
                        <Badge variant="secondary" className={`text-[10px] ${
                          essay.status === "DRAFT" ? "bg-gray-100 text-gray-600" :
                          essay.status === "UNDER_REVIEW" ? "bg-blue-100 text-blue-700" :
                          essay.status === "REVISION_NEEDED" ? "bg-amber-100 text-amber-700" :
                          "bg-emerald-100 text-emerald-700"
                        }`}>
                          {essay.status.replace("_", " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Messages */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
            <Card variant="bento">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50">
                      <MessageSquare className="h-3.5 w-3.5 text-[#2563EB]" />
                    </div>
                    Messages
                  </CardTitle>
                  <Link href="/student/messages">
                    <Button variant="ghost" size="sm" className="text-xs gap-1">View All <ArrowRight className="h-3 w-3" /></Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {loading ? (
                  <Skeleton className="h-12 w-full skeleton-shimmer" />
                ) : messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No messages yet</p>
                ) : (
                  <div className="space-y-2">
                    {messages.slice(0, 3).map(msg => (
                      <div key={msg.id} className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors">
                        <Avatar size="sm">
                          {msg.sender?.image && <AvatarImage src={msg.sender.image} />}
                          <AvatarFallback className="text-[10px]">{getInitials(msg.sender?.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-medium">{msg.sender?.name || "Unknown"}</p>
                            <span className="text-[10px] text-muted-foreground">{formatTime(msg.createdAt)}</span>
                            {!msg.isRead && <div className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Next Meeting */}
          {nextMeeting && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
              <Card variant="bento">
                <CardContent className="pt-0">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-green-50">
                      <Video className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{nextMeeting.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(nextMeeting.startTime)}</p>
                    </div>
                    {nextMeeting.meetingUrl && (
                      <a href={nextMeeting.meetingUrl} target="_blank" rel="noreferrer">
                        <Button size="sm" className="bg-[#2563EB] hover:bg-[#2563EB]/90 text-xs">Join</Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
