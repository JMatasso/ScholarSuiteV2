"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { JourneyTimeline } from "@/components/ui/journey-timeline"
import { JOURNEY_STAGE_LABELS, JOURNEY_STAGE_TO_TASK_PHASES } from "@/lib/constants"
import {
  FileText,
  PenTool,
  CheckSquare,
  Award,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Video,
  Activity,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Sparkles,
  GraduationCap,
  TrendingUp,
  DollarSign,
} from "@/lib/icons"
import Link from "next/link"
import { toast } from "sonner"
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

interface StudentSnapshot {
  gradeLevel: number | null
  graduationYear: number | null
  journeyStage: string | null
  semester: string
  gpa: { unweighted: number | null; weighted: number | null; scale: string }
  classRank: string | null
  classSize: string | null
  satScore: number | null
  actScore: number | null
  intendedMajor: string | null
  collegeApps: { total: number; submitted: number; accepted: number; committed: string | null }
  scholarshipApps: { total: number; active: number; awarded: number; totalAwarded: number }
  academicSummary: { totalCourses: number; apCourses: number; honorsCourses: number; completedCredits: number }
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
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

function SnapshotStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2 text-center">
      <p className="text-lg font-bold text-secondary-foreground leading-tight">
        {value}
        {sub && <span className="text-xs font-normal text-muted-foreground ml-0.5">{sub}</span>}
      </p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}

export default function StudentDashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [collegeApps, setCollegeApps] = useState<CollegeApp[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [timelineData, setTimelineData] = useState<{ journeyStage: string; tasksByStage: Record<string, { total: number; completed: number }> } | null>(null)
  const [snapshot, setSnapshot] = useState<StudentSnapshot | null>(null)
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
      fetch("/api/college-applications").then(r => r.json()).catch(() => []),
      fetch("/api/meetings").then(r => r.json()).catch(() => []),
      fetch("/api/messages").then(r => r.json()).catch(() => []),
      fetch("/api/timeline").then(r => r.json()).catch(() => null),
      fetch("/api/students/snapshot").then(r => r.json()).catch(() => null),
    ]).then(([t, a, c, m, msg, tl, snap]) => {
      setTasks(Array.isArray(t) ? t : [])
      setApplications(Array.isArray(a) ? a : [])
      setCollegeApps(Array.isArray(c) ? c : [])
      setMeetings(Array.isArray(m) ? m : [])
      setMessages(Array.isArray(msg) ? msg : [])
      setTimelineData(tl && tl.journeyStage ? tl : null)
      setSnapshot(snap && snap.semester ? snap : null)
      setLoading(false)
    })
  }, [])

  // Task stats — scoped to the student's current journey stage
  const currentStage = timelineData?.journeyStage || "EARLY_EXPLORATION"
  const currentPhases = JOURNEY_STAGE_TO_TASK_PHASES[currentStage] || []
  const stageTasks = currentPhases.length > 0
    ? tasks.filter(t => currentPhases.includes(t.phase))
    : tasks
  const activeTasks = stageTasks.filter(t => t.status !== "DONE")
  const overdueTasks = activeTasks.filter(t => t.dueDate && daysUntil(t.dueDate)! < 0)
  const urgentTasks = activeTasks
    .sort((a, b) => {
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })
    .slice(0, 6)
  const taskCompletion = stageTasks.length > 0
    ? Math.round((stageTasks.filter(t => t.status === "DONE").length / stageTasks.length) * 100)
    : 0
  const stageLabel = JOURNEY_STAGE_LABELS[currentStage]?.shortLabel || "Current Stage"

  // Most urgent deadline across everything
  const allDeadlines = [
    ...applications.filter(a => a.scholarship.deadline && daysUntil(a.scholarship.deadline)! > 0 && daysUntil(a.scholarship.deadline)! <= 7)
      .map(a => ({ name: a.scholarship.name, days: daysUntil(a.scholarship.deadline)!, type: "scholarship" })),
    ...collegeApps.filter(c => c.deadline && daysUntil(c.deadline)! > 0 && daysUntil(c.deadline)! <= 7)
      .map(c => ({ name: c.universityName, days: daysUntil(c.deadline)!, type: "college" })),
  ].sort((a, b) => a.days - b.days)

  const urgentDeadline = allDeadlines[0]

  // Fire a toast for the most urgent deadline (once per session)
  useEffect(() => {
    if (!loading && urgentDeadline && !sessionStorage.getItem("deadline-toast-shown")) {
      const typeLabel = urgentDeadline.type === "college" ? "application" : "scholarship"
      const dayLabel = urgentDeadline.days === 1 ? "1 day" : `${urgentDeadline.days} days`
      toast.warning(`${urgentDeadline.name} ${typeLabel} deadline in ${dayLabel}`, {
        duration: 6000,
      })
      sessionStorage.setItem("deadline-toast-shown", "true")
    }
  }, [loading, urgentDeadline])

  // Upcoming meetings
  const now = new Date()
  const upcomingMeetings = meetings
    .filter(m => new Date(m.startTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 3)

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
        <h1 className="text-4xl font-black tracking-tight text-secondary-foreground font-display">
          Welcome back{userName ? `, ${userName}` : ""}
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Here&apos;s what&apos;s happening with your scholarship &amp; college journey today.
        </p>
      </motion.div>

      {/* Student Snapshot */}
      {(snapshot || loading) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card variant="bento">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <div className="flex size-7 items-center justify-center rounded-lg bg-[#1E3A5F]/10">
                  <GraduationCap className="h-3.5 w-3.5 text-[#1E3A5F]" />
                </div>
                Student Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {loading || !snapshot ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-full skeleton-shimmer" />
                  <Skeleton className="h-20 w-full skeleton-shimmer" />
                  <Skeleton className="h-16 w-full skeleton-shimmer" />
                </div>
              ) : (
                <>
                  {/* Row 1: Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                      {snapshot.semester}
                    </Badge>
                    {snapshot.journeyStage && JOURNEY_STAGE_LABELS[snapshot.journeyStage] && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                        {JOURNEY_STAGE_LABELS[snapshot.journeyStage].shortLabel}
                      </Badge>
                    )}
                    {snapshot.gradeLevel && (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-200">
                        Grade {snapshot.gradeLevel}
                      </Badge>
                    )}
                    {snapshot.intendedMajor && (
                      <Badge variant="secondary" className="bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20">
                        {snapshot.intendedMajor}
                      </Badge>
                    )}
                  </div>

                  {/* Row 2: Academic Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <SnapshotStat label="Unweighted GPA" value={snapshot.gpa.unweighted?.toFixed(2) ?? "--"} />
                    <SnapshotStat label="Weighted GPA" value={snapshot.gpa.weighted?.toFixed(2) ?? "--"} sub={`/ ${snapshot.gpa.scale}`} />
                    <SnapshotStat label="Class Rank" value={snapshot.classRank && snapshot.classSize ? `${snapshot.classRank}/${snapshot.classSize}` : "--"} />
                    <SnapshotStat label="SAT" value={snapshot.satScore?.toLocaleString() ?? "--"} />
                    <SnapshotStat label="ACT" value={snapshot.actScore?.toString() ?? "--"} />
                  </div>

                  {/* Row 3: College + Scholarship Summaries */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl bg-blue-50/50 ring-1 ring-blue-100 p-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                        <span className="text-xs font-semibold text-blue-800">College Applications</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-blue-700">
                        <span><strong>{snapshot.collegeApps.submitted}</strong> submitted</span>
                        <span className="text-emerald-700"><strong>{snapshot.collegeApps.accepted}</strong> accepted</span>
                        {snapshot.collegeApps.committed && (
                          <span className="text-emerald-700 font-semibold">{snapshot.collegeApps.committed}</span>
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl bg-emerald-50/50 ring-1 ring-emerald-100 p-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-800">Scholarships</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-emerald-700">
                        <span><strong>{snapshot.scholarshipApps.active}</strong> active</span>
                        <span><strong>{snapshot.scholarshipApps.awarded}</strong> awarded</span>
                        {snapshot.scholarshipApps.totalAwarded > 0 && (
                          <span className="font-semibold">${snapshot.scholarshipApps.totalAwarded.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 4-Year Journey Timeline */}
      {timelineData && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Link href="/student/learning" className="block group">
            <Card variant="bento" className="cursor-pointer transition-shadow group-hover:shadow-md">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-sm">4-Year Journey</CardTitle>
                <span className="text-xs text-muted-foreground group-hover:text-[#2563EB] transition-colors flex items-center gap-1">
                  View details <ArrowRight className="h-3 w-3" />
                </span>
              </CardHeader>
              <CardContent>
                <JourneyTimeline
                  currentStage={timelineData.journeyStage}
                  taskCounts={timelineData.tasksByStage}
                />
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      )}

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
                    {stageLabel} Tasks
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
                          <button onClick={() => handleMarkDone(task.id)} className="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-border transition-colors hover:border-[#2563EB] hover:bg-[#2563EB]/10 group-hover:border-[#2563EB]">
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

          {/* Recent Messages */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <Card variant="bento">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-accent">
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
                    {messages.slice(0, 4).map(msg => (
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

          {/* Suggested Tools */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}>
            <Card variant="bento">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-accent">
                    <Sparkles className="h-3.5 w-3.5 text-[#2563EB]" />
                  </div>
                  Suggested Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Essays", href: "/student/essays", icon: PenTool, color: "text-blue-600 bg-blue-50" },
                    { label: "Brag Sheet", href: "/student/activities", icon: Activity, color: "text-emerald-600 bg-emerald-50" },
                    { label: "Resume", href: "/student/resume", icon: FileText, color: "text-purple-600 bg-purple-50" },
                    { label: "Documents", href: "/student/documents", icon: FileText, color: "text-amber-600 bg-amber-50" },
                    { label: "ScholarSuite AI", href: "/student/assistant", icon: Sparkles, color: "text-[#2563EB] bg-[#2563EB]/10" },
                    { label: "Letters of Rec", href: "/student/letters", icon: Award, color: "text-rose-600 bg-rose-50" },
                  ].map(tool => (
                    <Link key={tool.href} href={tool.href}>
                      <div className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors group">
                        <div className={`flex size-8 items-center justify-center rounded-lg ${tool.color}`}>
                          <tool.icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{tool.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
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
                      <div className="flex size-7 items-center justify-center rounded-lg bg-accent">
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
                              {app.scholarship.amount && <span className="text-xs font-semibold text-secondary-foreground shrink-0">${app.scholarship.amount.toLocaleString()}</span>}
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


          {/* Upcoming Meetings */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
            <Card variant="bento">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-green-50">
                      <Video className="h-3.5 w-3.5 text-green-600" />
                    </div>
                    Upcoming Meetings
                  </CardTitle>
                  <Link href="/student/meetings">
                    <Button variant="ghost" size="sm" className="text-xs gap-1">View All <ArrowRight className="h-3 w-3" /></Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {loading ? (
                  <Skeleton className="h-12 w-full skeleton-shimmer" />
                ) : upcomingMeetings.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No upcoming meetings</p>
                ) : (
                  <div className="space-y-2">
                    {upcomingMeetings.map(meeting => {
                      const meetingDate = new Date(meeting.startTime)
                      const days = Math.ceil((meetingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                      const isTodays = days <= 0 && meetingDate.toDateString() === now.toDateString()
                      return (
                        <div key={meeting.id} className="flex items-center gap-3 rounded-xl bg-muted/30 p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-50">
                            <Video className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{meeting.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(meeting.startTime)} · {formatTime(meeting.startTime)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[11px] font-medium ${isTodays ? "text-green-600" : days <= 1 ? "text-amber-600" : "text-muted-foreground"}`}>
                              {isTodays ? "Today" : days === 1 ? "Tomorrow" : `${days}d`}
                            </span>
                            {meeting.meetingUrl && (
                              <a href={meeting.meetingUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
                                <Button size="xs" className="text-[11px]">Join</Button>
                              </a>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
