"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  CheckSquare,
  Calendar,
  Filter,
  ListTodo,
} from "lucide-react"
import { toast } from "sonner"

interface Task {
  id: string
  title: string
  dueDate: string | null
  priority: "HIGH" | "MEDIUM" | "LOW"
  track: "SCHOLARSHIP" | "COLLEGE_PREP"
  phase: "INTRODUCTION" | "PHASE_1" | "PHASE_2" | "ONGOING" | "FINAL"
  status: "NOT_STARTED" | "IN_PROGRESS" | "DONE"
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
  LOW: "bg-gray-100 text-gray-600 border-gray-200",
}

const trackColors: Record<string, string> = {
  SCHOLARSHIP: "bg-blue-50 text-blue-700 border-blue-200",
  COLLEGE_PREP: "bg-purple-50 text-purple-700 border-purple-200",
}

function getDueDateStatus(dueDate: string | null): string {
  if (!dueDate) return "no_date"
  const due = new Date(dueDate)
  const now = new Date()
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
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

export default function TasksPage() {
  const [taskState, setTaskState] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "completed">("all")
  const [filterPriority, setFilterPriority] = useState<"all" | "HIGH" | "MEDIUM" | "LOW">("all")
  const [filterTrack, setFilterTrack] = useState<"all" | "SCHOLARSHIP" | "COLLEGE_PREP">("all")

  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => {
        setTaskState(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === "DONE" ? "IN_PROGRESS" : "DONE"
    const optimistic = taskState.map((t) => t.id === task.id ? { ...t, status: newStatus as Task["status"] } : t)
    setTaskState(optimistic)

    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) {
      setTaskState(taskState)
      toast.error("Failed to update task")
    }
  }

  const filteredTasks = taskState.filter((t) => {
    if (filterStatus === "pending" && t.status === "DONE") return false
    if (filterStatus === "completed" && t.status !== "DONE") return false
    if (filterPriority !== "all" && t.priority !== filterPriority) return false
    if (filterTrack !== "all" && t.track !== filterTrack) return false
    return true
  })

  const totalTasks = taskState.length
  const completedCount = taskState.filter((t) => t.status === "DONE").length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">Loading tasks...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1E3A5F]">Tasks</h1>
          <p className="mt-1 text-muted-foreground">
            {completedCount} of {totalTasks} tasks completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{totalTasks} Total Tasks</span>
        </div>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Filters:</span>
            </div>
            <div className="flex gap-1.5">
              {(["all", "pending", "completed"] as const).map((s) => (
                <Button
                  key={s}
                  variant={filterStatus === s ? "default" : "outline"}
                  size="xs"
                  onClick={() => setFilterStatus(s)}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex gap-1.5">
              {(["all", "HIGH", "MEDIUM", "LOW"] as const).map((p) => (
                <Button
                  key={p}
                  variant={filterPriority === p ? "default" : "outline"}
                  size="xs"
                  onClick={() => setFilterPriority(p)}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex gap-1.5">
              {(["all", "SCHOLARSHIP", "COLLEGE_PREP"] as const).map((tr) => (
                <Button
                  key={tr}
                  variant={filterTrack === tr ? "default" : "outline"}
                  size="xs"
                  onClick={() => setFilterTrack(tr)}
                >
                  {tr === "COLLEGE_PREP" ? "College Prep" : tr === "all" ? "All" : "Scholarship"}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task list grouped by phase */}
      <div className="space-y-6">
        {phaseOrder.map((phase) => {
          const phaseTasks = filteredTasks.filter((t) => t.phase === phase)
          if (phaseTasks.length === 0) return null
          const dueStatus = (t: Task) => getDueDateStatus(t.dueDate)
          return (
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: phaseOrder.indexOf(phase) * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="mb-3 text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide">
                {phaseLabels[phase]}
              </h2>
              <Card>
                <CardContent className="pt-0 divide-y">
                  {phaseTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <Checkbox
                        checked={task.status === "DONE"}
                        onCheckedChange={() => toggleTask(task)}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            task.status === "DONE" ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {task.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 text-xs ${dueDateColor[dueStatus(task)]}`}
                        >
                          <Calendar className="h-3 w-3" />
                          {formatDueDate(task.dueDate)}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${priorityColors[task.priority]}`}
                        >
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1).toLowerCase()}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${trackColors[task.track]}`}
                        >
                          {task.track === "COLLEGE_PREP" ? "College Prep" : "Scholarship"}
                        </span>
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
    </div>
  )
}
