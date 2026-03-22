"use client"

import * as React from "react"
import { motion } from "motion/react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/ui/status-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, GraduationCap, FileText,
  CheckCircle2, Clock, ListTodo, Plus, Trash2, Building2, Upload,
} from "@/lib/icons"
import { AssigneePicker, type AdminUser } from "@/components/ui/assignee-picker"
import { Tabs as VercelTabs } from "@/components/ui/vercel-tabs"
import { JourneyTimeline } from "@/components/ui/journey-timeline"
import { TASK_PHASE_TO_JOURNEY_STAGE, SERVICE_TIER_LABELS, JOURNEY_STAGE_LABELS } from "@/lib/constants"

const tabItems = [
  { id: "Profile", label: "Profile" },
  { id: "Applications", label: "Scholarships" },
  { id: "CollegeApps", label: "College Apps" },
  { id: "Tasks", label: "Tasks" },
  { id: "Essays", label: "Essays" },
  { id: "Documents", label: "Documents" },
  { id: "Financial", label: "Financial" },
  { id: "Notes", label: "Notes" },
]
type Tab = typeof tabItems[number]["id"]

interface CollegeApp {
  id: string
  universityName: string
  applicationType: string
  status: string
  deadline?: string | null
  cost?: number | null
  isDream: boolean
  isSafety: boolean
}

interface StudentData {
  id: string
  name: string
  email: string
  image?: string | null
  createdAt: string
  school?: { name: string } | null
  studentProfile?: {
    phone?: string | null
    city?: string | null
    state?: string | null
    gpa?: number | null
    satScore?: number | null
    journeyStage?: string | null
    gradeLevel?: number | null
    status?: string | null
    serviceTier?: string | null
    doneApplying?: boolean
    assignedAdminId?: string | null
    assignedAdmin?: { id: string; name: string | null; image: string | null } | null
  } | null
  scholarshipApps?: Array<{
    id: string
    status: string
    amountAwarded?: number | null
    scholarship: { name: string; amount?: number | null; deadline?: string | null }
    createdAt: string
  }>
  collegeApps?: CollegeApp[]
  tasks?: Array<{
    id: string
    title: string
    status: string
    phase?: string | null
    track?: string | null
    priority?: string | null
    dueDate?: string | null
    requiresUpload?: boolean
    documentFolder?: string | null
  }>
  essays?: Array<{
    id: string
    title: string
    status: string
    content?: string | null
    updatedAt: string
  }>
  documents?: Array<{
    id: string
    name: string
    type: string
    createdAt: string
  }>
  financialPlans?: Array<{
    id: string
    semesters?: Array<{ name: string; tuition: number; housing: number; food: number; transportation: number; books: number; personal: number; other: number; incomeSources: Array<{ name: string; amount: number }> }>
  }>
  linkedParents?: Array<{ parent: { id: string; name?: string | null; email: string } }>
}

const COLLEGE_APP_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  RESEARCHING: { label: "Researching", color: "bg-gray-100 text-gray-600 ring-gray-300" },
  APPLYING: { label: "Applying", color: "bg-blue-50 text-blue-700 ring-blue-300" },
  SUBMITTED: { label: "Submitted", color: "bg-amber-50 text-amber-700 ring-amber-300" },
  ACCEPTED: { label: "Accepted", color: "bg-green-50 text-green-700 ring-green-300" },
  DENIED: { label: "Denied", color: "bg-rose-50 text-rose-700 ring-rose-300" },
  WAITLISTED: { label: "Waitlisted", color: "bg-purple-50 text-purple-700 ring-purple-300" },
  COMMITTED: { label: "Committed", color: "bg-emerald-50 text-emerald-700 ring-emerald-300" },
  DEFERRED: { label: "Deferred", color: "bg-orange-50 text-orange-700 ring-orange-300" },
}

function StudentDetailContent() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [activeTab, setActiveTab] = React.useState<Tab>("Profile" as Tab)
  const [student, setStudent] = React.useState<StudentData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [noteText, setNoteText] = React.useState("")
  const [assigningTasks, setAssigningTasks] = React.useState(false)
  const [admins, setAdmins] = React.useState<AdminUser[]>([])
  const [addTaskOpen, setAddTaskOpen] = React.useState(false)
  const [newTask, setNewTask] = React.useState({
    title: "",
    description: "",
    track: "SCHOLARSHIP",
    phase: "PHASE_1",
    priority: "MEDIUM",
    dueDate: "",
    requiresUpload: false,
    documentFolder: "",
  })
  const [savingTask, setSavingTask] = React.useState(false)

  const handleAssignAdmin = async (adminId: string | null) => {
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedAdminId: adminId }),
      })
      if (!res.ok) throw new Error()
      const admin = adminId ? admins.find(a => a.id === adminId) || null : null
      setStudent(prev => prev ? {
        ...prev,
        studentProfile: {
          ...prev.studentProfile,
          assignedAdminId: adminId,
          assignedAdmin: admin,
        },
      } : prev)
      toast.success(adminId ? "Counselor assigned" : "Counselor removed")
    } catch {
      toast.error("Failed to assign counselor")
    }
  }

  const handleServiceTierChange = async (value: string) => {
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: { serviceTier: value || null } }),
      })
      if (!res.ok) throw new Error()
      setStudent(prev => prev ? { ...prev, studentProfile: { ...prev.studentProfile, serviceTier: value || null } } : prev)
      toast.success("Service tier updated")
    } catch {
      toast.error("Failed to update service tier")
    }
  }

  const handleJourneyStageChange = async (value: string) => {
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: { journeyStage: value } }),
      })
      if (!res.ok) throw new Error()
      setStudent(prev => prev ? { ...prev, studentProfile: { ...prev.studentProfile, journeyStage: value } } : prev)
      toast.success("Journey stage updated")
    } catch {
      toast.error("Failed to update journey stage")
    }
  }

  const handleAssignPhaseTasks = async () => {
    setAssigningTasks(true)
    try {
      const res = await fetch("/api/task-templates/assign-phase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to assign tasks")
      toast.success(data.message || `${data.tasksCreated || 0} tasks assigned`)
      refreshStudent()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign phase tasks")
    } finally {
      setAssigningTasks(false)
    }
  }

  const handleAddTask = async () => {
    if (!newTask.title.trim()) { toast.error("Title is required"); return }
    setSavingTask(true)
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: id,
          title: newTask.title,
          description: newTask.description || null,
          track: newTask.track,
          phase: newTask.phase,
          priority: newTask.priority,
          dueDate: newTask.dueDate || null,
          requiresUpload: newTask.requiresUpload,
          documentFolder: newTask.documentFolder || null,
          notifyParent: true,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Task added")
      setAddTaskOpen(false)
      setNewTask({ title: "", description: "", track: "SCHOLARSHIP", phase: "PHASE_1", priority: "MEDIUM", dueDate: "", requiresUpload: false, documentFolder: "" })
      refreshStudent()
    } catch {
      toast.error("Failed to add task")
    } finally {
      setSavingTask(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setStudent(prev => prev ? { ...prev, tasks: prev.tasks?.filter(t => t.id !== taskId) } : prev)
      toast.success("Task deleted")
    } catch {
      toast.error("Failed to delete task")
    }
  }

  const refreshStudent = async () => {
    const res = await fetch(`/api/students/${id}`)
    if (res.ok) setStudent(await res.json())
  }

  React.useEffect(() => {
    fetch(`/api/students/${id}`)
      .then(res => res.json())
      .then(d => { setStudent(d); setLoading(false) })
      .catch(() => { toast.error("Failed to load student"); setLoading(false) })
    fetch("/api/admin/users/all")
      .then(res => res.json())
      .then(users => {
        if (Array.isArray(users)) {
          setAdmins(users.filter((u: { role: string }) => u.role === "ADMIN").map((u: { id: string; name: string | null; image: string | null }) => ({ id: u.id, name: u.name, image: u.image })))
        }
      })
      .catch(() => {})
  }, [id])

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">Loading student...</div>
  }

  if (!student || (student as { error?: string }).error) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/admin/students" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft className="size-3.5" /> Back to Students
        </Link>
        <p className="text-sm text-muted-foreground">Student not found.</p>
      </div>
    )
  }

  const profile = student.studentProfile
  const applications = student.scholarshipApps || []
  const collegeApps = student.collegeApps || []
  const tasks = student.tasks || []
  const essays = student.essays || []
  const documents = student.documents || []
  const financialPlan = student.financialPlans?.[0]

  const initials = (student.name || student.email).substring(0, 2).toUpperCase()
  const location = [profile?.city, profile?.state].filter(Boolean).join(", ") || "—"
  const totalAwardedAmount = applications.filter(a => a.status === "AWARDED").reduce((sum, a) => sum + (a.amountAwarded || 0), 0)
  const awardedCount = applications.filter(a => a.status === "AWARDED").length
  const tasksComplete = tasks.filter(t => t.status === "DONE").length

  const totalCost = financialPlan?.semesters?.reduce((sum, s) => sum + s.tuition + s.housing + s.food + s.transportation + s.books + s.personal + s.other, 0) || 0
  const totalIncome = financialPlan?.semesters?.reduce((sum, s) => sum + s.incomeSources.reduce((a, src) => a + src.amount, 0), 0) || 0

  const tasksByStage: Record<string, { total: number; completed: number }> = {
    EARLY_EXPLORATION: { total: 0, completed: 0 },
    ACTIVE_PREP: { total: 0, completed: 0 },
    APPLICATION_PHASE: { total: 0, completed: 0 },
    POST_ACCEPTANCE: { total: 0, completed: 0 },
  }
  for (const task of tasks) {
    const stage = TASK_PHASE_TO_JOURNEY_STAGE[task.phase || ""] || "EARLY_EXPLORATION"
    if (tasksByStage[stage]) {
      tasksByStage[stage].total++
      if (task.status === "DONE") tasksByStage[stage].completed++
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/students" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
        <ArrowLeft className="size-3.5" /> Back to Students
      </Link>

      {/* Student Header */}
      <motion.div
        className="flex items-start gap-5 rounded-xl bg-card p-6 transform-gpu [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] transition-all duration-300 hover:[box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_4px_8px_rgba(0,0,0,.07),0_16px_32px_rgba(0,0,0,.07)]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <Avatar size="lg">
          {student.image && <AvatarImage src={student.image} alt={student.name || student.email} />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold text-foreground">{student.name || student.email}</h1>
            {profile?.status && <StatusBadge status={profile.status as "NEW" | "ACTIVE" | "AT_RISK" | "INACTIVE" | "GRADUATED"} />}
            <select
              value={profile?.serviceTier || ""}
              onChange={e => handleServiceTierChange(e.target.value)}
              className="h-7 rounded-md border border-border bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="">No Tier</option>
              {Object.entries(SERVICE_TIER_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <AssigneePicker
              currentAdmin={profile?.assignedAdmin || null}
              admins={admins}
              onAssign={handleAssignAdmin}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {student.school?.name && <span className="flex items-center gap-1"><GraduationCap className="size-3.5" /> {student.school.name}</span>}
            {location !== "—" && <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {location}</span>}
            <span className="flex items-center gap-1"><Mail className="size-3.5" /> {student.email}</span>
            {profile?.phone && <span className="flex items-center gap-1"><Phone className="size-3.5" /> {profile.phone}</span>}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-background p-3 text-center">
              <p className="text-lg font-semibold text-foreground">{applications.length}</p>
              <p className="text-xs text-muted-foreground">Applications</p>
            </div>
            <div className="rounded-lg bg-background p-3 text-center">
              <p className="text-lg font-semibold text-foreground">{awardedCount}</p>
              <p className="text-xs text-muted-foreground">Awarded</p>
            </div>
            <div className="rounded-lg bg-background p-3 text-center">
              <p className="text-lg font-semibold text-green-600">{totalAwardedAmount > 0 ? `$${totalAwardedAmount.toLocaleString()}` : "$0"}</p>
              <p className="text-xs text-muted-foreground">Total Awarded</p>
            </div>
            <div className="rounded-lg bg-background p-3 text-center">
              <p className="text-lg font-semibold text-foreground">{tasksComplete}/{tasks.length}</p>
              <p className="text-xs text-muted-foreground">Tasks Complete</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/messages")}><Mail className="size-3.5" /> Message</Button>
          <Button size="sm" onClick={() => router.push("/admin/meetings")}><Calendar className="size-3.5" /> Schedule</Button>
        </div>
      </motion.div>

      <VercelTabs
        tabs={tabItems}
        onTabChange={(tabId) => setActiveTab(tabId as Tab)}
        className="border-b border-border pb-[6px]"
      />

      <motion.div
        className="rounded-xl bg-card p-6 transform-gpu [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] transition-all duration-300 hover:[box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_4px_8px_rgba(0,0,0,.07),0_16px_32px_rgba(0,0,0,.07)]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        {activeTab === "Profile" && (
          <div className="flex flex-col gap-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-foreground">Journey Progress</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Update Stage:</span>
                  <select
                    value={profile?.journeyStage || "EARLY_EXPLORATION"}
                    onChange={e => handleJourneyStageChange(e.target.value)}
                    className="h-7 rounded-md border border-border bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    {Object.entries(JOURNEY_STAGE_LABELS).map(([key, val]) => (
                      <option key={key} value={key}>{val.shortLabel}</option>
                    ))}
                  </select>
                </div>
              </div>
              <JourneyTimeline currentStage={profile?.journeyStage || "EARLY_EXPLORATION"} taskCounts={tasksByStage} />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-medium text-foreground">Academic Information</h3>
                <div className="flex flex-col gap-2">
                  {[
                    ["GPA", profile?.gpa ?? "—"],
                    ["SAT Score", profile?.satScore ?? "—"],
                    ["Grade Level", profile?.gradeLevel ? `Grade ${profile.gradeLevel}` : "—"],
                    ["Journey Stage", profile?.journeyStage ? (JOURNEY_STAGE_LABELS[profile.journeyStage]?.shortLabel || profile.journeyStage) : "—"],
                    ["Joined", new Date(student.createdAt).toLocaleDateString()],
                  ].map(([label, value], i, arr) => (
                    <div key={label as string} className={`flex justify-between py-2 ${i < arr.length - 1 ? "border-b border-border/50" : ""}`}>
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className="text-sm font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-medium text-foreground">Contact Information</h3>
                <div className="flex flex-col gap-2">
                  {[
                    ["Email", student.email],
                    ["Phone", profile?.phone ?? "—"],
                    ["Location", location],
                    ["Parent(s)", student.linkedParents && student.linkedParents.length > 0
                      ? student.linkedParents.map(lp => lp.parent.name || lp.parent.email).join(", ")
                      : "—"],
                  ].map(([label, value], i, arr) => (
                    <div key={label as string} className={`flex justify-between py-2 ${i < arr.length - 1 ? "border-b border-border/50" : ""}`}>
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className="text-sm font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Applications" && (
          <div className="flex flex-col gap-3">
            {applications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No scholarship applications yet.</p>
            ) : applications.map((app) => (
              <div key={app.id} className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{app.scholarship.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {app.scholarship.deadline ? `Deadline: ${new Date(app.scholarship.deadline).toLocaleDateString()}` : "No deadline"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">
                    {app.amountAwarded ? `$${app.amountAwarded.toLocaleString()}` : app.scholarship.amount ? `$${app.scholarship.amount.toLocaleString()}` : "—"}
                  </span>
                  <StatusBadge status={app.status as "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "AWARDED" | "DENIED"} />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "CollegeApps" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-foreground">College Applications ({collegeApps.length})</h3>
              {profile?.doneApplying && (
                <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 text-xs font-medium">
                  Done Applying
                </span>
              )}
            </div>
            {collegeApps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No college applications yet.</p>
            ) : collegeApps.map((app) => {
              const statusInfo = COLLEGE_APP_STATUS_LABELS[app.status] || { label: app.status, color: "bg-gray-100 text-gray-600 ring-gray-300" }
              return (
                <div key={app.id} className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{app.universityName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground">{app.applicationType}</p>
                        {app.isDream && <span className="text-[10px] text-amber-600 font-medium">Dream</span>}
                        {app.isSafety && <span className="text-[10px] text-emerald-600 font-medium">Safety</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {app.deadline && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(app.deadline).toLocaleDateString()}
                      </span>
                    )}
                    <span className={`inline-flex h-5 items-center rounded-full px-2 text-xs font-medium ring-1 ring-inset ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === "Tasks" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-foreground">Tasks ({tasks.length})</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setAddTaskOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add Task
                </Button>
                <Button
                  size="sm"
                  className="gap-2"
                  disabled={assigningTasks}
                  onClick={handleAssignPhaseTasks}
                >
                  <ListTodo className="h-4 w-4" />
                  {assigningTasks ? "Assigning..." : "Assign Phase Tasks"}
                </Button>
              </div>
            </div>
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks yet.</p>
            ) : tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded-lg border border-border/50 p-4 group">
                <div className="flex items-center gap-3">
                  {task.status === "DONE" ? (
                    <CheckCircle2 className="size-4 text-green-500" />
                  ) : (
                    <Clock className="size-4 text-muted-foreground" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{task.title}</p>
                      {task.requiresUpload && <Upload className="size-3 text-blue-500" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground">
                        {task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : "No due date"}
                      </p>
                      {task.track && (
                        <span className="text-[10px] text-muted-foreground/70">{task.track.replace(/_/g, " ")}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex h-5 items-center rounded-full px-2 text-xs font-medium ring-1 ring-inset ${
                    task.status === "DONE" ? "bg-green-50 text-green-700 ring-green-300" :
                    task.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-700 ring-blue-300" :
                    "bg-muted text-foreground ring-gray-300"
                  }`}>{task.status === "DONE" ? "Done" : task.status === "IN_PROGRESS" ? "In Progress" : "Not Started"}</span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-600"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Essays" && (
          <div className="flex flex-col gap-3">
            {essays.length === 0 ? (
              <p className="text-sm text-muted-foreground">No essays yet.</p>
            ) : essays.map((essay) => (
              <div key={essay.id} className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                <div className="flex items-center gap-3">
                  <FileText className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{essay.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {essay.content ? `${essay.content.length} chars` : "No content"} — Updated {new Date(essay.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex h-5 items-center rounded-full px-2 text-xs font-medium ring-1 ring-inset ${
                  essay.status === "APPROVED" ? "bg-green-50 text-green-700 ring-green-300" :
                  essay.status === "UNDER_REVIEW" ? "bg-blue-50 text-blue-700 ring-blue-300" :
                  essay.status === "REVISION_NEEDED" ? "bg-amber-50 text-amber-700 ring-amber-300" :
                  "bg-muted text-foreground ring-gray-300"
                }`}>{essay.status === "REVISION_NEEDED" ? "Revision Needed" : essay.status === "UNDER_REVIEW" ? "Under Review" : essay.status === "APPROVED" ? "Approved" : "Draft"}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Documents" && (
          <div className="flex flex-col gap-3">
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
            ) : documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                <div className="flex items-center gap-3">
                  <FileText className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">Uploaded {new Date(doc.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="inline-flex h-5 items-center rounded-full bg-muted px-2 text-xs font-medium text-muted-foreground">{doc.type}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Financial" && (
          <div>
            {!financialPlan ? (
              <p className="text-sm text-muted-foreground">No financial plan yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-lg bg-green-50 p-4 text-center">
                  <p className="text-2xl font-semibold text-green-700">${totalIncome.toLocaleString()}</p>
                  <p className="text-xs text-green-600">Total Income / Aid</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-4 text-center">
                  <p className="text-2xl font-semibold text-blue-700">${totalCost.toLocaleString()}</p>
                  <p className="text-xs text-blue-600">Total Cost of Attendance</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-4 text-center">
                  <p className="text-2xl font-semibold text-amber-700">${Math.max(0, totalCost - totalIncome).toLocaleString()}</p>
                  <p className="text-xs text-amber-600">Remaining Gap</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "Notes" && (
          <div className="flex flex-col gap-4">
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Add a note about this student..."
              className="h-24 w-full rounded-lg border border-input bg-transparent p-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
            />
            <Button
              size="sm"
              className="w-fit"
              onClick={async () => {
                if (!noteText.trim()) return
                try {
                  await fetch("/api/messages", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ receiverId: student.id, content: `[Note] ${noteText}` }),
                  })
                  toast.success("Note saved")
                  setNoteText("")
                } catch {
                  toast.error("Failed to save note")
                }
              }}
            >
              Add Note
            </Button>
          </div>
        )}
      </motion.div>

      {/* Add Custom Task Dialog */}
      <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Custom Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Title *</label>
              <Input
                placeholder="Task title"
                value={newTask.title}
                onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <textarea
                placeholder="Optional description..."
                className="h-20 w-full rounded-lg border border-input bg-transparent p-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
                value={newTask.description}
                onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Track</label>
                <select
                  value={newTask.track}
                  onChange={e => setNewTask(prev => ({ ...prev, track: e.target.value }))}
                  className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="SCHOLARSHIP">Scholarship</option>
                  <option value="COLLEGE_PREP">College Prep</option>
                  <option value="COLLEGE_APP">College App</option>
                  <option value="GENERAL">General</option>
                  <option value="FINANCIAL">Financial</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Phase</label>
                <select
                  value={newTask.phase}
                  onChange={e => setNewTask(prev => ({ ...prev, phase: e.target.value }))}
                  className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="INTRODUCTION">Introduction</option>
                  <option value="PHASE_1">Phase 1</option>
                  <option value="PHASE_2">Phase 2</option>
                  <option value="ONGOING">Ongoing</option>
                  <option value="FINAL">Final</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={e => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                  className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Due Date</label>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={e => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Document Folder</label>
                <Input
                  placeholder="e.g. Transcripts"
                  value={newTask.documentFolder}
                  onChange={e => setNewTask(prev => ({ ...prev, documentFolder: e.target.value }))}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newTask.requiresUpload}
                onChange={e => setNewTask(prev => ({ ...prev, requiresUpload: e.target.checked }))}
                className="rounded border-border"
              />
              Requires document upload to complete
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setAddTaskOpen(false)}>Cancel</Button>
              <Button size="sm" className="bg-[#2563EB] hover:bg-[#2563EB]/90" disabled={savingTask} onClick={handleAddTask}>
                {savingTask ? "Saving..." : "Add Task"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function StudentDetailPage() {
  return <StudentDetailContent />
}
