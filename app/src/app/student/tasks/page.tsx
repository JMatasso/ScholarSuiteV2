"use client"

import { useState } from "react"
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

interface Task {
  id: number
  title: string
  dueDate: string
  dueStatus: "overdue" | "due_soon" | "upcoming" | "no_date"
  priority: "high" | "medium" | "low"
  track: "scholarship" | "college_prep"
  phase: "introduction" | "phase_1" | "phase_2" | "ongoing" | "final"
  completed: boolean
}

const tasks: Task[] = [
  {
    id: 1,
    title: "Complete FAFSA application",
    dueDate: "Mar 8, 2026",
    dueStatus: "overdue",
    priority: "high",
    track: "college_prep",
    phase: "introduction",
    completed: false,
  },
  {
    id: 2,
    title: "Request recommendation letter from Ms. Chen",
    dueDate: "Mar 15, 2026",
    dueStatus: "due_soon",
    priority: "high",
    track: "scholarship",
    phase: "introduction",
    completed: false,
  },
  {
    id: 3,
    title: "Upload unofficial transcript to ScholarSuite",
    dueDate: "Mar 12, 2026",
    dueStatus: "due_soon",
    priority: "medium",
    track: "college_prep",
    phase: "introduction",
    completed: true,
  },
  {
    id: 4,
    title: "Finalize personal statement - Draft 4",
    dueDate: "Mar 20, 2026",
    dueStatus: "upcoming",
    priority: "high",
    track: "scholarship",
    phase: "phase_1",
    completed: false,
  },
  {
    id: 5,
    title: "Document 20 community service hours",
    dueDate: "Mar 25, 2026",
    dueStatus: "upcoming",
    priority: "medium",
    track: "scholarship",
    phase: "phase_1",
    completed: false,
  },
  {
    id: 6,
    title: "Research 5 target universities and compare financial aid",
    dueDate: "Mar 30, 2026",
    dueStatus: "upcoming",
    priority: "medium",
    track: "college_prep",
    phase: "phase_1",
    completed: false,
  },
  {
    id: 7,
    title: "Complete Gates Millennium application",
    dueDate: "Apr 10, 2026",
    dueStatus: "upcoming",
    priority: "high",
    track: "scholarship",
    phase: "phase_2",
    completed: false,
  },
  {
    id: 8,
    title: "Submit Ron Brown Scholar essay",
    dueDate: "Mar 28, 2026",
    dueStatus: "upcoming",
    priority: "high",
    track: "scholarship",
    phase: "phase_2",
    completed: false,
  },
  {
    id: 9,
    title: "Schedule meeting with college counselor",
    dueDate: "Apr 5, 2026",
    dueStatus: "upcoming",
    priority: "low",
    track: "college_prep",
    phase: "phase_2",
    completed: false,
  },
  {
    id: 10,
    title: "Update activities resume monthly",
    dueDate: "Monthly",
    dueStatus: "no_date",
    priority: "low",
    track: "college_prep",
    phase: "ongoing",
    completed: false,
  },
  {
    id: 11,
    title: "Check for new scholarship matches weekly",
    dueDate: "Weekly",
    dueStatus: "no_date",
    priority: "medium",
    track: "scholarship",
    phase: "ongoing",
    completed: false,
  },
  {
    id: 12,
    title: "Review and send all thank-you letters",
    dueDate: "May 15, 2026",
    dueStatus: "upcoming",
    priority: "medium",
    track: "scholarship",
    phase: "final",
    completed: false,
  },
  {
    id: 13,
    title: "Confirm enrollment deposit and financial aid package",
    dueDate: "May 1, 2026",
    dueStatus: "upcoming",
    priority: "high",
    track: "college_prep",
    phase: "final",
    completed: false,
  },
]

const phaseLabels: Record<string, string> = {
  introduction: "Introduction",
  phase_1: "Phase 1 - Research & Preparation",
  phase_2: "Phase 2 - Applications",
  ongoing: "Ongoing Tasks",
  final: "Final Steps",
}

const phaseOrder = ["introduction", "phase_1", "phase_2", "ongoing", "final"]

const priorityColors: Record<string, string> = {
  high: "bg-rose-100 text-rose-700 border-rose-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-gray-100 text-gray-600 border-gray-200",
}

const dueDateColor: Record<string, string> = {
  overdue: "text-rose-600",
  due_soon: "text-amber-600",
  upcoming: "text-muted-foreground",
  no_date: "text-muted-foreground",
}

const trackColors: Record<string, string> = {
  scholarship: "bg-blue-50 text-blue-700 border-blue-200",
  college_prep: "bg-purple-50 text-purple-700 border-purple-200",
}

export default function TasksPage() {
  const [taskState, setTaskState] = useState(tasks)
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "completed">("all")
  const [filterPriority, setFilterPriority] = useState<"all" | "high" | "medium" | "low">("all")
  const [filterTrack, setFilterTrack] = useState<"all" | "scholarship" | "college_prep">("all")

  const toggleTask = (id: number) => {
    setTaskState((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    )
  }

  const filteredTasks = taskState.filter((t) => {
    if (filterStatus === "pending" && t.completed) return false
    if (filterStatus === "completed" && !t.completed) return false
    if (filterPriority !== "all" && t.priority !== filterPriority) return false
    if (filterTrack !== "all" && t.track !== filterTrack) return false
    return true
  })

  const totalTasks = taskState.length
  const completedCount = taskState.filter((t) => t.completed).length

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
              {(["all", "high", "medium", "low"] as const).map((p) => (
                <Button
                  key={p}
                  variant={filterPriority === p ? "default" : "outline"}
                  size="xs"
                  onClick={() => setFilterPriority(p)}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Button>
              ))}
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex gap-1.5">
              {(["all", "scholarship", "college_prep"] as const).map((tr) => (
                <Button
                  key={tr}
                  variant={filterTrack === tr ? "default" : "outline"}
                  size="xs"
                  onClick={() => setFilterTrack(tr)}
                >
                  {tr === "college_prep" ? "College Prep" : tr.charAt(0).toUpperCase() + tr.slice(1)}
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
          return (
            <div key={phase}>
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
                        checked={task.completed}
                        onCheckedChange={() => toggleTask(task.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            task.completed ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {task.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 text-xs ${dueDateColor[task.dueStatus]}`}
                        >
                          <Calendar className="h-3 w-3" />
                          {task.dueDate}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${priorityColors[task.priority]}`}
                        >
                          {task.priority}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${trackColors[task.track]}`}
                        >
                          {task.track === "college_prep" ? "College Prep" : "Scholarship"}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}
