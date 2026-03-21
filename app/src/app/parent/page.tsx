"use client"

import React, { useState, useEffect } from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { StatCard } from "@/components/ui/stat-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials, formatDate, formatTime } from "@/lib/format"
import {
  CheckSquare,
  FileText,
  DollarSign,
  Clock,
  AlertTriangle,
  ChevronDown,
  GraduationCap,
  TrendingUp,
  CheckCircle2,
  Video,
  MessageSquare,
  ArrowRight,
  Star,
} from "lucide-react"
import { JOURNEY_STAGE_LABELS } from "@/lib/constants"
import { CompletionBanner } from "@/components/ui/completion-banner"
import Link from "next/link"

interface StudentProfile {
  gpa?: number
  gradeLevel?: number
  highSchool?: string
  journeyStage?: string
  status?: string
}

interface Student {
  id: string
  name?: string
  email: string
  image?: string | null
  studentProfile?: StudentProfile
  school?: { name: string }
}

interface Application {
  id: string
  status: string
  scholarship?: { amount?: number }
}

interface Task {
  id: string
  status: string
  dueDate?: string
  title: string
}

interface CollegeApp {
  id: string
  universityName: string
  status: string
  isDream: boolean
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

function getJourneyStageName(stage?: string): string {
  return stage ? (JOURNEY_STAGE_LABELS[stage]?.shortLabel ?? stage) : "Unknown"
}

function getGradeLabel(level?: number) {
  if (!level) return "Unknown Grade"
  const suffix = ["th", "st", "nd", "rd"]
  const v = level % 100
  return `${level}${suffix[(v - 20) % 10] ?? suffix[v] ?? suffix[0]} Grade`
}

function getIncompleteSections(flags: Record<string, boolean> | null): Array<{ label: string; href: string }> {
  if (!flags) return []
  const sections: Array<{ label: string; href: string }> = []
  if (!flags.contact) sections.push({ label: "Contact Info", href: "/parent/onboarding" })
  if (!flags.tour) sections.push({ label: "Welcome Tour", href: "/parent/onboarding" })
  return sections
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64 skeleton-shimmer" />
        <Skeleton className="h-4 w-48 skeleton-shimmer" />
      </div>
      <Skeleton className="h-24 w-full rounded-2xl skeleton-shimmer" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl skeleton-shimmer" />)}
      </div>
    </div>
  )
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

export default function ParentDashboard() {
  const [students, setStudents] = useState<Student[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [collegeApps, setCollegeApps] = useState<CollegeApp[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [completionData, setCompletionData] = useState<{ percentage: number; flags: Record<string, boolean> | null } | null>(null)

  useEffect(() => {
    if (sessionStorage.getItem("parent-banner-dismissed")) {
      setBannerDismissed(true)
    } else {
      fetch("/api/auth/onboarding-status")
        .then(r => r.json())
        .then(d => {
          if (d.completionPercentage < 100) setCompletionData({ percentage: d.completionPercentage, flags: d.completionFlags })
        })
        .catch(() => {})
    }
  }, [])

  const handleDismissBanner = () => {
    setBannerDismissed(true)
    sessionStorage.setItem("parent-banner-dismissed", "true")
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/students").then(r => r.json()),
      fetch("/api/applications").then(r => r.json()),
      fetch("/api/tasks").then(r => r.json()),
      fetch("/api/college-applications").then(r => r.json()).catch(() => []),
      fetch("/api/meetings").then(r => r.json()).catch(() => []),
      fetch("/api/messages").then(r => r.json()).catch(() => []),
    ])
      .then(([s, a, t, c, m, msg]) => {
        const studentList: Student[] = Array.isArray(s) ? s : []
        setStudents(studentList)
        setSelectedStudent(studentList[0] ?? null)
        setApplications(Array.isArray(a) ? a : [])
        setTasks(Array.isArray(t) ? t : [])
        setCollegeApps(Array.isArray(c) ? c : [])
        setMeetings(Array.isArray(m) ? m : [])
        setMessages(Array.isArray(msg) ? msg : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />
  if (!selectedStudent) {
    return <div className="flex items-center justify-center py-24"><p className="text-sm text-muted-foreground">No linked student found.</p></div>
  }

  // Stats
  const completedTasks = tasks.filter(t => t.status === "DONE").length
  const totalTasks = tasks.length
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const submittedApps = applications.filter(a => a.status === "SUBMITTED").length
  const awardedApps = applications.filter(a => a.status === "AWARDED")
  const totalAwarded = awardedApps.reduce((sum, a) => sum + (a.scholarship?.amount ?? 0), 0)
  const collegeAccepted = collegeApps.filter(c => c.status === "ACCEPTED").length
  const collegeSubmitted = collegeApps.filter(c => ["SUBMITTED", "ACCEPTED", "DENIED", "WAITLISTED", "DEFERRED"].includes(c.status)).length

  const now = new Date()
  const overdueTasks = tasks.filter(t => { if (!t.dueDate) return false; return new Date(t.dueDate) < now && t.status !== "DONE" })
  const upcomingDeadlines = tasks.filter(t => {
    if (!t.dueDate) return false
    const diff = (new Date(t.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 14 && t.status !== "DONE"
  })

  const nextMeetings = meetings.filter(m => new Date(m.startTime) > now).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).slice(0, 2)
  const recentMessages = messages.slice(0, 3)

  const alerts = [
    ...overdueTasks.slice(0, 3).map((t, i) => ({ id: `o-${i}`, type: "overdue" as const, title: t.title, description: t.dueDate ? `Was due ${new Date(t.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric" })}` : "Past due", days: t.dueDate ? Math.round((now.getTime() - new Date(t.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0 })),
    ...upcomingDeadlines.slice(0, 3).map((t, i) => ({ id: `u-${i}`, type: "upcoming" as const, title: t.title, description: t.dueDate ? `Due ${new Date(t.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric" })}` : "Upcoming", days: t.dueDate ? Math.round((new Date(t.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0 })),
  ]

  const profile = selectedStudent.studentProfile
  const schoolName = selectedStudent.school?.name ?? profile?.highSchool ?? "Unknown School"
  const avatar = getInitials(selectedStudent.name)
  const stage = getJourneyStageName(profile?.journeyStage)
  const gradeLabel = getGradeLabel(profile?.gradeLevel)
  const status = (profile?.status ?? "ACTIVE") as "ACTIVE" | "NEW" | "AT_RISK" | "INACTIVE" | "GRADUATED"

  // Applications by status
  const statusGroups = [
    { status: "Submitted", count: applications.filter(a => a.status === "SUBMITTED").length, color: "bg-purple-500" },
    { status: "In Progress", count: applications.filter(a => a.status === "IN_PROGRESS").length, color: "bg-blue-500" },
    { status: "Awarded", count: applications.filter(a => a.status === "AWARDED").length, color: "bg-green-500" },
    { status: "Not Started", count: applications.filter(a => a.status === "NOT_STARTED").length, color: "bg-gray-300" },
  ]
  const totalAppCount = statusGroups.reduce((s, i) => s + i.count, 0)

  return (
    <div className="space-y-8 pb-8">
      {!bannerDismissed && completionData && completionData.percentage < 100 && (
        <CompletionBanner percentage={completionData.percentage} incompleteSections={getIncompleteSections(completionData.flags)} onDismiss={handleDismissBanner} />
      )}

      {/* Header + Student Selector */}
      <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground font-display">Parent Dashboard</h1>
          <p className="mt-2 text-base text-muted-foreground">Monitor your child&apos;s scholarship &amp; college preparation progress</p>
        </div>
        <div className="relative">
          <button onClick={() => setSelectorOpen(!selectorOpen)} className="flex items-center gap-3 rounded-2xl bg-card px-4 py-2.5 shadow-lg shadow-black/[0.04] ring-1 ring-white/60 hover:shadow-xl transition-all duration-200">
            <Avatar size="sm">
              {selectedStudent.image && <AvatarImage src={selectedStudent.image} alt={selectedStudent.name ?? selectedStudent.email} />}
              <AvatarFallback className="bg-[#2563EB]/10 text-[#2563EB] text-xs font-semibold">{avatar}</AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">{selectedStudent.name ?? selectedStudent.email}</p>
              <p className="text-[11px] text-muted-foreground">{schoolName}</p>
            </div>
            <ChevronDown className="size-4 text-muted-foreground" />
          </button>
          {selectorOpen && students.length > 1 && (
            <div className="absolute right-0 top-full mt-2 w-full rounded-2xl bg-card py-1 shadow-xl ring-1 ring-white/60 z-50">
              {students.map(student => (
                <button key={student.id} onClick={() => { setSelectedStudent(student); setSelectorOpen(false) }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors rounded-xl mx-1">
                  <Avatar size="sm"><AvatarFallback className="bg-[#2563EB]/10 text-[#2563EB] text-xs font-semibold">{getInitials(student.name)}</AvatarFallback></Avatar>
                  <span className="font-medium text-foreground">{student.name ?? student.email}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Student Profile Card */}
      <motion.div className="rounded-xl bg-white p-6 transform-gpu [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] transition-all duration-300 hover:[box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_4px_8px_rgba(0,0,0,.07),0_16px_32px_rgba(0,0,0,.07)]" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          <Avatar size="lg" className="size-14">
            {selectedStudent.image && <AvatarImage src={selectedStudent.image} alt={selectedStudent.name ?? ""} />}
            <AvatarFallback className="bg-[#1E3A5F] text-white text-lg font-semibold">{avatar}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-foreground font-display">{selectedStudent.name ?? selectedStudent.email}</h2>
              <StatusBadge status={status} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><GraduationCap className="size-3.5" />{schoolName}</span>
              <span>{gradeLabel}</span>
              {profile?.gpa && <span>GPA: {profile.gpa}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-[#2563EB]/5 px-4 py-2.5">
            <TrendingUp className="size-4 text-[#2563EB]" />
            <div>
              <p className="text-xs text-muted-foreground">Journey Stage</p>
              <p className="text-sm font-bold text-[#1E3A5F]">{stage}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards — 6 cards: scholarship + college */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Tasks Done" value={`${completedTasks}/${totalTasks}`} description={`${completionPercent}%`} icon={CheckSquare} index={0} />
        <StatCard title="Scholarship Apps" value={submittedApps} description={`${applications.length} total`} icon={FileText} index={1} />
        <StatCard title="Awards Won" value={`$${totalAwarded.toLocaleString()}`} description={`${awardedApps.length} awards`} icon={DollarSign} index={2} />
        <StatCard title="College Apps" value={collegeApps.length} description={`${collegeSubmitted} submitted`} icon={GraduationCap} index={3} />
        <StatCard title="Accepted" value={collegeAccepted} description={`${collegeApps.filter(c => c.status === "WAITLISTED").length} waitlisted`} icon={CheckCircle2} index={4} />
        <StatCard title="Deadlines" value={upcomingDeadlines.length} description="Next 14 days" icon={Clock} index={5} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Task Completion */}
        <motion.div className="rounded-xl bg-white p-6 transform-gpu [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] transition-all duration-300 hover:[box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_4px_8px_rgba(0,0,0,.07),0_16px_32px_rgba(0,0,0,.07)]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Task Completion</h3>
          <div className="mt-5 flex items-center justify-center">
            <div className="relative size-36">
              <svg className="size-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f0f0f0" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#2563EB" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${completionPercent * 3.14} ${314 - completionPercent * 3.14}`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-foreground font-display">{completionPercent}%</span>
                <span className="text-[11px] text-muted-foreground">Complete</span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">{totalTasks - completedTasks} tasks remaining</p>
        </motion.div>

        {/* Scholarship Apps by Status */}
        <motion.div className="rounded-xl bg-white p-6 transform-gpu [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] transition-all duration-300 hover:[box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_4px_8px_rgba(0,0,0,.07),0_16px_32px_rgba(0,0,0,.07)]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}>
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Scholarship Applications</h3>
          <div className="mt-5 space-y-3">
            {statusGroups.map(item => (
              <div key={item.status} className="flex items-center gap-3">
                <div className={cn("size-2.5 rounded-full", item.color)} />
                <span className="flex-1 text-sm text-muted-foreground">{item.status}</span>
                <span className="text-sm font-bold text-foreground">{item.count}</span>
              </div>
            ))}
          </div>
          {totalAppCount > 0 && (
            <div className="mt-5 h-3 flex rounded-full overflow-hidden bg-muted">
              {statusGroups.map(item => <div key={item.status} className={cn("h-full transition-all duration-500", item.color)} style={{ width: `${(item.count / totalAppCount) * 100}%` }} />)}
            </div>
          )}
        </motion.div>

        {/* College Apps Summary */}
        <motion.div className="rounded-xl bg-white p-6 transform-gpu [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] transition-all duration-300 hover:[box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_4px_8px_rgba(0,0,0,.07),0_16px_32px_rgba(0,0,0,.07)]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.56 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">College Applications</h3>
            <Link href="/parent/colleges"><Button variant="ghost" size="sm" className="text-xs gap-1">View All <ArrowRight className="h-3 w-3" /></Button></Link>
          </div>
          {collegeApps.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No colleges tracked yet</p>
          ) : (
            <div className="space-y-2">
              {collegeApps.slice(0, 5).map(app => (
                <div key={app.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {app.isDream && <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />}
                    <span className="text-sm font-medium truncate">{app.universityName}</span>
                  </div>
                  <Badge variant="secondary" className={`text-[10px] shrink-0 ${collegeStatusColor[app.status] || "bg-gray-100"}`}>
                    {app.status.charAt(0) + app.status.slice(1).toLowerCase().replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom Row: Meetings + Messages + Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upcoming Meetings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card variant="bento">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-green-50"><Video className="h-3.5 w-3.5 text-green-600" /></div>
                  Upcoming Meetings
                </CardTitle>
                <Link href="/parent/meetings"><Button variant="ghost" size="sm" className="text-xs gap-1">View All <ArrowRight className="h-3 w-3" /></Button></Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {nextMeetings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No upcoming meetings</p>
              ) : (
                <div className="space-y-3">
                  {nextMeetings.map(m => (
                    <div key={m.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50 transition-colors">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-green-50"><Video className="h-4 w-4 text-green-600" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(m.startTime)}</p>
                      </div>
                      {m.meetingUrl && <a href={m.meetingUrl} target="_blank" rel="noreferrer"><Button size="sm" className="text-xs">Join</Button></a>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Messages */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
          <Card variant="bento">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50"><MessageSquare className="h-3.5 w-3.5 text-[#2563EB]" /></div>
                  Recent Messages
                </CardTitle>
                <Link href="/parent/messages"><Button variant="ghost" size="sm" className="text-xs gap-1">View All <ArrowRight className="h-3 w-3" /></Button></Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {recentMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No messages yet</p>
              ) : (
                <div className="space-y-2">
                  {recentMessages.map(msg => (
                    <div key={msg.id} className="flex items-start gap-2.5 rounded-lg px-2 py-2 hover:bg-muted/50 transition-colors">
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

        {/* Alerts */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card variant="bento">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <div className="flex size-7 items-center justify-center rounded-lg bg-amber-50"><AlertTriangle className="h-3.5 w-3.5 text-amber-600" /></div>
                Alerts &amp; Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No alerts — everything on track!</p>
              ) : (
                <div className="space-y-2">
                  {alerts.map(alert => (
                    <div key={alert.id} className={cn("flex items-start gap-2.5 rounded-lg px-3 py-2", alert.type === "overdue" ? "bg-red-50" : "bg-amber-50")}>
                      <AlertTriangle className={cn("mt-0.5 size-3.5 shrink-0", alert.type === "overdue" ? "text-red-500" : "text-amber-500")} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-medium", alert.type === "overdue" ? "text-red-800" : "text-amber-800")}>{alert.title}</p>
                        <p className={cn("text-[11px]", alert.type === "overdue" ? "text-red-600" : "text-amber-600")}>{alert.description}</p>
                      </div>
                      <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium", alert.type === "overdue" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                        {alert.type === "overdue" ? `${alert.days}d overdue` : `${alert.days}d left`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
