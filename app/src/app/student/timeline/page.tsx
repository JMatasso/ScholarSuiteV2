"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CheckCircle2,
  Circle,
  Clock,
  GraduationCap,
  FileText,
  Search,
  PenTool,
  DollarSign,
  Award,
  BookOpen,
  Star,
  Target,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  description: string | null
  status: "NOT_STARTED" | "IN_PROGRESS" | "DONE"
  phase: "INTRODUCTION" | "PHASE_1" | "PHASE_2" | "ONGOING" | "FINAL"
  dueDate: string | null
  createdAt: string
}

interface Application {
  id: string
  status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "AWARDED" | "DENIED"
  createdAt: string
  updatedAt: string
  scholarship: {
    name: string
    amount: number | null
    deadline: string | null
  }
}

interface TimelineEvent {
  id: string
  title: string
  description: string
  date: string
  status: "completed" | "current" | "upcoming"
  icon: typeof CheckCircle2
  category: "task" | "application"
}

const statusStyles = {
  completed: {
    dot: "bg-emerald-500",
    iconColor: "text-emerald-600",
    ring: "ring-emerald-100",
    iconBg: "bg-emerald-50",
  },
  current: {
    dot: "bg-[#2563EB]",
    iconColor: "text-[#2563EB]",
    ring: "ring-blue-100",
    iconBg: "bg-blue-50",
  },
  upcoming: {
    dot: "bg-gray-300",
    iconColor: "text-gray-400",
    ring: "ring-gray-100",
    iconBg: "bg-gray-50",
  },
}

function getApplicationStatus(status: Application["status"]): "completed" | "current" | "upcoming" {
  if (status === "AWARDED" || status === "SUBMITTED" || status === "DENIED") return "completed"
  if (status === "IN_PROGRESS") return "current"
  return "upcoming"
}

function getTaskStatus(task: Task): "completed" | "current" | "upcoming" {
  if (task.status === "DONE") return "completed"
  if (task.status === "IN_PROGRESS") return "current"
  return "upcoming"
}

function getEventDate(event: { dueDate?: string | null; updatedAt?: string; createdAt: string }): string {
  return event.dueDate ?? event.updatedAt ?? event.createdAt
}

export default function TimelinePage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/applications").then((r) => r.json()),
    ])
      .then(([tasksData, appsData]) => {
        setTasks(Array.isArray(tasksData) ? tasksData : [])
        setApplications(Array.isArray(appsData) ? appsData : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Build timeline events from tasks and applications
  const taskEvents: TimelineEvent[] = tasks.map((task) => ({
    id: `task-${task.id}`,
    title: task.title,
    description: task.description ?? `Phase: ${task.phase.replace(/_/g, " ").toLowerCase()}`,
    date: getEventDate({ dueDate: task.dueDate, createdAt: task.createdAt }),
    status: getTaskStatus(task),
    icon: FileText,
    category: "task" as const,
  }))

  const appEvents: TimelineEvent[] = applications.map((app) => ({
    id: `app-${app.id}`,
    title: app.scholarship.name,
    description:
      app.status === "AWARDED"
        ? `Awarded${app.scholarship.amount ? ` - $${app.scholarship.amount.toLocaleString()}` : ""}`
        : app.status === "SUBMITTED"
        ? "Application Submitted"
        : app.status === "DENIED"
        ? "Application Denied"
        : app.status === "IN_PROGRESS"
        ? "Application In Progress"
        : "Not Started",
    date: getEventDate({ dueDate: app.scholarship.deadline, updatedAt: app.updatedAt, createdAt: app.createdAt }),
    status: getApplicationStatus(app.status),
    icon: app.status === "AWARDED" ? Award : DollarSign,
    category: "application" as const,
  }))

  const allEvents = [...taskEvents, ...appEvents].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const completedEvents = allEvents.filter((e) => e.status === "completed")
  const currentEvents = allEvents.filter((e) => e.status === "current")
  const upcomingEvents = allEvents.filter((e) => e.status === "upcoming")
  const orderedEvents = [...completedEvents, ...currentEvents, ...upcomingEvents]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">Loading timeline...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1E3A5F]">Timeline</h1>
        <p className="mt-1 text-muted-foreground">
          Your scholarship journey — tasks and application milestones.
        </p>
      </div>

      {/* Current position indicator */}
      <Card className="border-[#2563EB]/30 bg-blue-50/30">
        <CardContent className="pt-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563EB]/10 ring-2 ring-[#2563EB]/20">
              <Clock className="h-5 w-5 text-[#2563EB]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#1E3A5F]">
                {completedEvents.length} completed · {currentEvents.length} in progress · {upcomingEvents.length} upcoming
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vertical timeline */}
      {orderedEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Clock className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">No timeline events yet. Tasks and applications will appear here.</p>
        </div>
      ) : (
        <div className="relative ml-4 pl-8">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-gray-200" />

          <div className="space-y-4">
            {orderedEvents.map((event, eventIndex) => {
              const Icon = event.icon
              const styles = statusStyles[event.status]

              return (
                <motion.div
                  key={event.id}
                  className="relative"
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: eventIndex * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  viewport={{ once: true }}
                >
                  {/* Dot on the line */}
                  <div
                    className={cn(
                      "absolute -left-8 top-3 h-3.5 w-3.5 rounded-full ring-4",
                      styles.dot,
                      styles.ring
                    )}
                  />
                  {event.status === "current" && (
                    <div className="absolute -left-8 top-3 h-3.5 w-3.5 animate-ping rounded-full bg-[#2563EB]/40" />
                  )}

                  <Card className={cn(
                    "transition-shadow hover:shadow-sm",
                    event.status === "current" && "border-[#2563EB]/30 bg-blue-50/20",
                    event.status === "upcoming" && "opacity-60"
                  )}>
                    <CardContent className="pt-0">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          styles.iconBg
                        )}>
                          <Icon className={cn("h-4 w-4", styles.iconColor)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">{event.title}</p>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {new Date(event.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">{event.description}</p>
                          <span className={cn(
                            "mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                            event.category === "task"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-purple-50 text-purple-700 border-purple-200"
                          )}>
                            {event.category === "task" ? "Task" : "Application"}
                          </span>
                        </div>
                        {event.status === "completed" && (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
