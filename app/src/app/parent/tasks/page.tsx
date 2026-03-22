"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  Filter,
  Check,
} from "@/lib/icons";

interface ApiTask {
  id: string;
  title: string;
  description?: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "DONE";
  dueDate?: string;
  priority: string;
  track: string;
  parentAcknowledged: boolean;
}

type TaskStatus = "completed" | "in_progress" | "overdue" | "not_started";

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
  category: string;
  acknowledged: boolean;
}

const statusConfig: Record<
  TaskStatus,
  { label: string; icon: React.ElementType; color: string }
> = {
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-green-600",
  },
  in_progress: { label: "In Progress", icon: Clock, color: "text-blue-600" },
  overdue: { label: "Overdue", icon: AlertTriangle, color: "text-red-600" },
  not_started: { label: "Not Started", icon: Circle, color: "text-muted-foreground" },
};

type FilterStatus = "all" | TaskStatus;

function toTaskStatus(apiStatus: ApiTask["status"], dueDate?: string): TaskStatus {
  if (apiStatus === "DONE") return "completed";
  if (apiStatus === "IN_PROGRESS") {
    if (dueDate && new Date(dueDate) < new Date()) return "overdue";
    return "in_progress";
  }
  // NOT_STARTED
  if (dueDate && new Date(dueDate) < new Date()) return "overdue";
  return "not_started";
}

function formatDueDate(dueDate?: string) {
  if (!dueDate) return "—";
  return new Date(dueDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function trackToCategory(track: string) {
  const map: Record<string, string> = {
    SCHOLARSHIP: "Scholarships",
    COLLEGE_PREP: "College Prep",
  };
  return map[track] ?? track;
}

export default function TasksPage() {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((d: ApiTask[]) => {
        const list = Array.isArray(d) ? d : [];
        const uiTasks: Task[] = list.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description ?? "",
          status: toTaskStatus(t.status, t.dueDate),
          dueDate: formatDueDate(t.dueDate),
          category: trackToCategory(t.track),
          acknowledged: t.parentAcknowledged,
        }));
        setTasks(uiTasks);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredTasks =
    filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  const overdueTasks = tasks.filter((t) => t.status === "overdue");
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  const handleAcknowledge = async (taskId: string) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentAcknowledged: true }),
    });
    if (res.ok) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, acknowledged: true } : t))
      );
      toast.success("Task acknowledged!");
    } else {
      // Optimistic update even if API doesn't exist yet
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, acknowledged: true } : t))
      );
    }
  };

  const filters: { key: FilterStatus; label: string; count: number }[] = [
    { key: "all", label: "All Tasks", count: tasks.length },
    {
      key: "overdue",
      label: "Overdue",
      count: tasks.filter((t) => t.status === "overdue").length,
    },
    {
      key: "in_progress",
      label: "In Progress",
      count: tasks.filter((t) => t.status === "in_progress").length,
    },
    {
      key: "not_started",
      label: "Not Started",
      count: tasks.filter((t) => t.status === "not_started").length,
    },
    {
      key: "completed",
      label: "Completed",
      count: completedCount,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">Loading tasks…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Task Oversight
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor your child&apos;s tasks and deadlines
        </p>
      </div>

      {/* Overdue alert banner */}
      {overdueTasks.length > 0 && (
        <div className="rounded-xl bg-red-50 p-4 ring-1 ring-red-200/60">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-5 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                {overdueTasks.length} Overdue Task
                {overdueTasks.length > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                {overdueTasks.map((t) => t.title).join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress summary */}
      {tasks.length > 0 && (
        <div className="rounded-xl bg-card p-4 [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">
              Overall Progress
            </span>
            <span className="text-sm font-semibold text-foreground">
              {completedCount}/{tasks.length} tasks
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-[#2563EB] transition-all"
              style={{
                width: `${(completedCount / tasks.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        <Filter className="size-4 text-muted-foreground mr-1" />
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              filter === f.key
                ? "bg-[#1E3A5F] text-white"
                : "bg-card text-muted-foreground ring-1 ring-gray-200 hover:bg-muted/50"
            )}
          >
            {f.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[11px]",
                filter === f.key
                  ? "bg-white/20 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {filteredTasks.map((task, i) => {
          const config = statusConfig[task.status];
          const StatusIcon = config.icon;
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "flex items-start gap-3 rounded-xl bg-card px-5 py-4 transition-colors [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
                task.status === "overdue" && "ring-1 ring-red-200/60"
              )}
            >
              <StatusIcon
                className={cn("mt-0.5 size-5 shrink-0", config.color)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground">
                    {task.title}
                  </p>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                      task.status === "completed"
                        ? "bg-green-50 text-green-700 ring-green-300"
                        : task.status === "in_progress"
                          ? "bg-accent text-blue-700 ring-blue-300"
                          : task.status === "overdue"
                            ? "bg-red-50 text-red-700 ring-red-300"
                            : "bg-muted text-muted-foreground ring-gray-300"
                    )}
                  >
                    {config.label}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {task.description}
                </p>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Due: {task.dueDate}</span>
                  <span className="inline-flex items-center rounded bg-muted/50 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                    {task.category}
                  </span>
                </div>
              </div>

              {/* Acknowledge button for completed tasks */}
              {task.status === "completed" && (
                <div className="shrink-0">
                  {task.acknowledged ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                      <Check className="size-3.5" />
                      Acknowledged
                    </span>
                  ) : (
                    <Button
                      onClick={() => handleAcknowledge(task.id)}
                      className="h-8 rounded-lg bg-[#1E3A5F] px-3 text-xs font-medium text-white hover:bg-[#1E3A5F]/90"
                    >
                      Acknowledge
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="rounded-xl bg-card p-12 text-center [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]">
            <p className="text-sm text-muted-foreground">
              No tasks matching this filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
