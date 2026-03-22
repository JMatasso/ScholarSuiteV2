"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { Tabs } from "@/components/ui/vercel-tabs"
import {
  CheckSquare,
  Calendar,
  Filter,
  FolderOpen,
  Upload,
  X,
  FileText,
  Download,
  ChevronRight,
} from "@/lib/icons"
import { toast } from "sonner"
import LoaderOne from "@/components/ui/loader-one"
import { UploadButton } from "@/lib/uploadthing"
import { JOURNEY_STAGE_LABELS, JOURNEY_STAGES_ORDERED, JOURNEY_STAGE_TO_TASK_PHASES } from "@/lib/constants"

interface Task {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  priority: "HIGH" | "MEDIUM" | "LOW"
  track: "SCHOLARSHIP" | "COLLEGE_PREP" | "COLLEGE_APP" | "FINANCIAL" | "ACADEMIC" | "GENERAL"
  phase: "INTRODUCTION" | "PHASE_1" | "PHASE_2" | "ONGOING" | "FINAL"
  status: "NOT_STARTED" | "IN_PROGRESS" | "DONE"
  documentFolder: string | null
  requiresUpload: boolean
}

interface Document {
  id: string
  name: string
  fileUrl: string
  fileSize: number | null
  createdAt: string
}

const phaseLabels: Record<string, string> = {
  INTRODUCTION: "Introduction",
  PHASE_1: "Phase 1 - Research & Preparation",
  PHASE_2: "Phase 2 - Applications",
  ONGOING: "Ongoing Tasks",
  FINAL: "Final Steps",
}

const phaseOrder = ["INTRODUCTION", "PHASE_1", "PHASE_2", "ONGOING", "FINAL"]

const priorityColors: Record<string, string> = {
  HIGH: "bg-rose-100 text-rose-700 border-rose-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  LOW: "bg-muted text-muted-foreground border-border",
}

function getDueDateStatus(dueDate: string | null): string {
  if (!dueDate) return "no_date"
  const diffDays = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return "overdue"
  if (diffDays <= 7) return "due_soon"
  return "upcoming"
}

const dueDateColor: Record<string, string> = {
  overdue: "text-rose-600",
  due_soon: "text-amber-600",
  upcoming: "text-muted-foreground",
  no_date: "text-muted-foreground",
}

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return "No due date"
  return new Date(dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStage, setActiveStage] = useState<string>("EARLY_EXPLORATION")
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "completed">("all")
  const [filterPriority, setFilterPriority] = useState<"all" | "HIGH" | "MEDIUM" | "LOW">("all")
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [folderDocs, setFolderDocs] = useState<Document[]>([])
  const [docsLoading, setDocsLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/tasks").then((r) => r.json()).catch(() => []),
      fetch("/api/timeline").then((r) => r.json()).catch(() => null),
    ]).then(([taskData, tl]) => {
      setTasks(Array.isArray(taskData) ? taskData : [])
      if (tl?.journeyStage && JOURNEY_STAGES_ORDERED.includes(tl.journeyStage)) {
        setActiveStage(tl.journeyStage)
      }
      setLoading(false)
    })
  }, [])

  // Fetch documents for selected task's folder
  useEffect(() => {
    if (!selectedTask?.documentFolder) { setFolderDocs([]); return }
    setDocsLoading(true)
    fetch("/api/documents")
      .then((res) => res.json())
      .then((data) => {
        const docs = Array.isArray(data) ? data : []
        setFolderDocs(docs.filter((d: Document & { folder?: string }) => d.folder === selectedTask.documentFolder))
        setDocsLoading(false)
      })
      .catch(() => setDocsLoading(false))
  }, [selectedTask])

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === "DONE" ? "IN_PROGRESS" : "DONE"

    // If requires upload and trying to mark as done, check if docs uploaded
    if (newStatus === "DONE" && task.requiresUpload && task.documentFolder) {
      const docsRes = await fetch("/api/documents")
      const docs = await docsRes.json()
      const taskDocs = Array.isArray(docs) ? docs.filter((d: { folder?: string }) => d.folder === task.documentFolder) : []
      if (taskDocs.length === 0) {
        toast.error("Upload the required document(s) before marking this task as complete")
        setSelectedTask(task) // Open detail panel so they can upload
        return
      }
    }

    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: newStatus as Task["status"] } : t))
    if (selectedTask?.id === task.id) setSelectedTask({ ...task, status: newStatus as Task["status"] })

    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) {
      setTasks((prev) => prev.map((t) => t.id === task.id ? task : t))
      toast.error("Failed to update task")
    }
  }

  // Filter tasks by journey stage (using phase mapping)
  const stagePhases = JOURNEY_STAGE_TO_TASK_PHASES[activeStage] || []
  const stageTasks = tasks.filter((t) => stagePhases.includes(t.phase))

  const filteredTasks = stageTasks.filter((t) => {
    if (filterStatus === "pending" && t.status === "DONE") return false
    if (filterStatus === "completed" && t.status !== "DONE") return false
    if (filterPriority !== "all" && t.priority !== filterPriority) return false
    return true
  })

  // Compute counts per stage for tab labels
  const stageCounts = JOURNEY_STAGES_ORDERED.reduce((acc, stage) => {
    const phases = JOURNEY_STAGE_TO_TASK_PHASES[stage] || []
    const all = tasks.filter((t) => phases.includes(t.phase))
    acc[stage] = { total: all.length, completed: all.filter((t) => t.status === "DONE").length }
    return acc
  }, {} as Record<string, { total: number; completed: number }>)

  const totalTasks = stageTasks.length
  const completedCount = stageTasks.filter((t) => t.status === "DONE").length
  const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0

  const stageTabs = JOURNEY_STAGES_ORDERED.map((stage) => ({
    id: stage,
    label: `${JOURNEY_STAGE_LABELS[stage]?.shortLabel ?? stage}  ${stageCounts[stage]?.completed ?? 0}/${stageCounts[stage]?.total ?? 0}`,
  }))

  if (loading) {
    return <div className="flex items-center justify-center py-16"><LoaderOne /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-secondary-foreground">Tasks</h1>
          <p className="mt-1 text-muted-foreground">Track your college prep and scholarship progress.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-[#2563EB] transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-sm font-semibold text-secondary-foreground">{progressPct}%</span>
          </div>
        </div>
      </div>

      {/* Stage Tabs */}
      <Tabs
        tabs={stageTabs}
        activeTab={activeStage}
        onTabChange={(v) => { setActiveStage(v); setSelectedTask(null) }}
      />

      {/* Filter bar */}
      <Card variant="bento">
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Filters:</span>
            </div>
            <div className="flex gap-1.5">
              {(["all", "pending", "completed"] as const).map((s) => (
                <Button key={s} variant={filterStatus === s ? "default" : "outline"} size="xs" onClick={() => setFilterStatus(s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex gap-1.5">
              {(["all", "HIGH", "MEDIUM", "LOW"] as const).map((p) => (
                <Button key={p} variant={filterPriority === p ? "default" : "outline"} size="xs" onClick={() => setFilterPriority(p)}>
                  {p === "all" ? "All" : p.charAt(0) + p.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-6">
        {/* Task list */}
        <div className={cn("space-y-6 transition-all", selectedTask ? "flex-1 min-w-0" : "w-full")}>
          {phaseOrder.map((phase) => {
            const phaseTasks = filteredTasks.filter((t) => t.phase === phase)
            if (phaseTasks.length === 0) return null
            const phaseCompleted = phaseTasks.filter((t) => t.status === "DONE").length
            return (
              <motion.div
                key={phase}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: phaseOrder.indexOf(phase) * 0.05 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-secondary-foreground uppercase tracking-wide">{phaseLabels[phase]}</h2>
                  <span className="text-xs text-muted-foreground">{phaseCompleted}/{phaseTasks.length}</span>
                </div>
                <Card variant="bento">
                  <CardContent className="pt-0 divide-y">
                    {phaseTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className={cn(
                          "flex items-center gap-3 py-3 first:pt-0 last:pb-0 cursor-pointer transition-colors hover:bg-muted/30 -mx-6 px-6",
                          selectedTask?.id === task.id && "bg-[#2563EB]/5"
                        )}
                      >
                        <Checkbox
                          checked={task.status === "DONE"}
                          onCheckedChange={(e) => { e.valueOf(); toggleTask(task) }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={cn("text-sm font-medium", task.status === "DONE" && "line-through text-muted-foreground")}>
                              {task.title}
                            </p>
                            {task.requiresUpload && (
                              <Upload className="h-3 w-3 text-blue-500 shrink-0" />
                            )}
                            {task.documentFolder && !task.requiresUpload && (
                              <FolderOpen className="h-3 w-3 text-blue-500 shrink-0" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn("text-xs flex items-center gap-1", dueDateColor[getDueDateStatus(task.dueDate)])}>
                            <Calendar className="h-3 w-3" />
                            {formatDueDate(task.dueDate)}
                          </span>
                          <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", priorityColors[task.priority])}>
                            {task.priority}
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
          {filteredTasks.length === 0 && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">No tasks match your filters.</p>
            </div>
          )}
        </div>

        {/* Task Detail Panel */}
        <AnimatePresence>
          {selectedTask && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 380 }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0"
            >
              <div className="sticky top-6 rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between p-5 border-b border-border/50">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-secondary-foreground pr-2">{selectedTask.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", priorityColors[selectedTask.priority])}>
                        {selectedTask.priority}
                      </span>
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                        selectedTask.status === "DONE" ? "bg-emerald-100 text-emerald-700" :
                        selectedTask.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {selectedTask.status === "DONE" ? "Completed" : selectedTask.status === "IN_PROGRESS" ? "In Progress" : "Not Started"}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon-xs" onClick={() => setSelectedTask(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-5">
                  {/* Description */}
                  {selectedTask.description && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Description</p>
                      <p className="text-sm text-foreground leading-relaxed">{selectedTask.description}</p>
                    </div>
                  )}

                  {/* Due date */}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className={cn("text-sm", dueDateColor[getDueDateStatus(selectedTask.dueDate)])}>
                      {formatDueDate(selectedTask.dueDate)}
                    </span>
                  </div>

                  {/* Status toggle */}
                  <Button
                    size="sm"
                    variant={selectedTask.status === "DONE" ? "outline" : "default"}
                    className="w-full"
                    onClick={() => toggleTask(selectedTask)}
                  >
                    <CheckSquare className="h-4 w-4" />
                    {selectedTask.status === "DONE" ? "Mark as In Progress" : "Mark as Complete"}
                  </Button>

                  {/* Upload requirement notice */}
                  {selectedTask.requiresUpload && selectedTask.status !== "DONE" && (
                    <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                      <Upload className="h-4 w-4 text-amber-600 shrink-0" />
                      <p className="text-xs text-amber-700">This task requires a document upload before it can be completed.</p>
                    </div>
                  )}

                  {/* Document upload section (if task has a linked folder) */}
                  {selectedTask.documentFolder && (
                    <div className="space-y-3 pt-2 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-blue-500" />
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Upload to: {selectedTask.documentFolder}
                        </p>
                      </div>

                      <UploadButton
                        endpoint="folderUploader"
                        input={{ folder: selectedTask.documentFolder! }}
                        onClientUploadComplete={() => {
                          toast.success("Document uploaded!")
                          // Refresh folder docs
                          fetch("/api/documents")
                            .then((r) => r.json())
                            .then((data) => {
                              const docs = Array.isArray(data) ? data : []
                              setFolderDocs(docs.filter((d: Document & { folder?: string }) => d.folder === selectedTask.documentFolder))
                            })
                        }}
                        onUploadError={(error: Error) => { toast.error(`Upload failed: ${error.message}`) }}
                        appearance={{
                          button: "bg-[#2563EB] hover:bg-[#2563EB]/90 text-white text-xs px-3 py-1.5 rounded-lg w-full",
                          allowedContent: "text-[10px] text-muted-foreground mt-1",
                        }}
                      />

                      {/* Files in this folder */}
                      {docsLoading ? (
                        <div className="flex justify-center py-2"><LoaderOne /></div>
                      ) : folderDocs.length > 0 ? (
                        <div className="space-y-1.5">
                          {folderDocs.map((doc) => (
                            <div key={doc.id} className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
                              <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-xs font-medium truncate flex-1">{doc.name}</span>
                              <span className="text-[10px] text-muted-foreground">{formatFileSize(doc.fileSize)}</span>
                              <Button variant="ghost" size="icon-xs" onClick={() => window.open(doc.fileUrl, "_blank")}>
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No documents uploaded yet for this folder.</p>
                      )}

                      {/* Link to documents page */}
                      <Button
                        variant="ghost"
                        size="xs"
                        className="w-full gap-1 text-[#2563EB]"
                        onClick={() => window.location.href = "/student/documents"}
                      >
                        <FolderOpen className="h-3 w-3" />
                        View all in Documents
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
