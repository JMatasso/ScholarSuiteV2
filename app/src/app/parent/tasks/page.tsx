"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  Filter,
  Check,
} from "lucide-react";

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

const mockTasks: Task[] = [
  {
    id: "1",
    title: "Complete FAFSA Application",
    description: "Submit the Free Application for Federal Student Aid",
    status: "overdue",
    dueDate: "Mar 1, 2026",
    category: "Financial Aid",
    acknowledged: false,
  },
  {
    id: "2",
    title: "Request High School Transcript",
    description: "Contact Lincoln High School registrar for official transcript",
    status: "overdue",
    dueDate: "Mar 5, 2026",
    category: "Documents",
    acknowledged: false,
  },
  {
    id: "3",
    title: "Write Gates Scholarship Essay",
    description: "Draft and revise the personal statement essay",
    status: "in_progress",
    dueDate: "Mar 15, 2026",
    category: "Scholarships",
    acknowledged: false,
  },
  {
    id: "4",
    title: "Register for SAT",
    description: "Sign up for the upcoming SAT exam date",
    status: "in_progress",
    dueDate: "Mar 20, 2026",
    category: "Testing",
    acknowledged: false,
  },
  {
    id: "5",
    title: "College Fair Prep Checklist",
    description: "Prepare questions and materials for the college fair",
    status: "not_started",
    dueDate: "Mar 25, 2026",
    category: "College Prep",
    acknowledged: false,
  },
  {
    id: "6",
    title: "Submit Community Foundation Grant",
    description: "Complete and submit scholarship application",
    status: "completed",
    dueDate: "Jan 31, 2026",
    category: "Scholarships",
    acknowledged: false,
  },
  {
    id: "7",
    title: "Complete Student Profile",
    description: "Fill out all sections of the student intake form",
    status: "completed",
    dueDate: "Jan 10, 2026",
    category: "Onboarding",
    acknowledged: true,
  },
  {
    id: "8",
    title: "Meet with College Consultant",
    description: "Initial meeting to discuss college goals and timeline",
    status: "completed",
    dueDate: "Jan 15, 2026",
    category: "Meetings",
    acknowledged: true,
  },
  {
    id: "9",
    title: "Research Target Schools",
    description: "Research and shortlist target colleges",
    status: "completed",
    dueDate: "Feb 1, 2026",
    category: "College Prep",
    acknowledged: false,
  },
  {
    id: "10",
    title: "First Generation College Fund Application",
    description: "Submit application for the FGCF scholarship",
    status: "completed",
    dueDate: "Feb 15, 2026",
    category: "Scholarships",
    acknowledged: true,
  },
  {
    id: "11",
    title: "SAT Prep Module 1",
    description: "Complete the first SAT preparation module",
    status: "completed",
    dueDate: "Feb 20, 2026",
    category: "Testing",
    acknowledged: true,
  },
  {
    id: "12",
    title: "SAT Prep Module 2",
    description: "Complete the second SAT preparation module",
    status: "completed",
    dueDate: "Feb 28, 2026",
    category: "Testing",
    acknowledged: false,
  },
  {
    id: "13",
    title: "Submit STEM Leaders Scholarship",
    description: "Complete and submit the STEM Leaders Scholarship application",
    status: "completed",
    dueDate: "Mar 1, 2026",
    category: "Scholarships",
    acknowledged: false,
  },
  {
    id: "14",
    title: "UI Application Draft",
    description: "Draft the University of Illinois application essays",
    status: "completed",
    dueDate: "Jan 10, 2026",
    category: "College Prep",
    acknowledged: true,
  },
  {
    id: "15",
    title: "Submit UI Application",
    description: "Finalize and submit the University of Illinois application",
    status: "completed",
    dueDate: "Jan 15, 2026",
    category: "College Prep",
    acknowledged: true,
  },
  {
    id: "16",
    title: "Prepare Purdue Application",
    description: "Start working on Purdue University application materials",
    status: "in_progress",
    dueDate: "Apr 1, 2026",
    category: "College Prep",
    acknowledged: false,
  },
  {
    id: "17",
    title: "Diversity in Tech Award Essay",
    description: "Write essay for the Diversity in Tech scholarship",
    status: "not_started",
    dueDate: "Apr 15, 2026",
    category: "Scholarships",
    acknowledged: false,
  },
  {
    id: "18",
    title: "Northwestern University Research",
    description: "Research programs and requirements for Northwestern",
    status: "not_started",
    dueDate: "Apr 30, 2026",
    category: "College Prep",
    acknowledged: false,
  },
];

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
  not_started: { label: "Not Started", icon: Circle, color: "text-gray-400" },
};

type FilterStatus = "all" | TaskStatus;

export default function TasksPage() {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [tasks, setTasks] = useState<Task[]>(mockTasks);

  const filteredTasks =
    filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  const overdueTasks = tasks.filter((t) => t.status === "overdue");
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  const handleAcknowledge = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, acknowledged: true } : t))
    );
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

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Task Oversight
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor Alex&apos;s tasks and deadlines
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
      <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200/60 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">
            Overall Progress
          </span>
          <span className="text-sm font-semibold text-gray-900">
            {completedCount}/{tasks.length} tasks
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#2563EB] transition-all"
            style={{
              width: `${(completedCount / tasks.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        <Filter className="size-4 text-gray-400 mr-1" />
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              filter === f.key
                ? "bg-[#1E3A5F] text-white"
                : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
            )}
          >
            {f.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[11px]",
                filter === f.key
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-500"
              )}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {filteredTasks.map((task) => {
          const config = statusConfig[task.status];
          const StatusIcon = config.icon;
          return (
            <div
              key={task.id}
              className={cn(
                "flex items-start gap-3 rounded-xl bg-white px-5 py-4 ring-1 shadow-sm transition-colors",
                task.status === "overdue"
                  ? "ring-red-200/60"
                  : "ring-gray-200/60"
              )}
            >
              <StatusIcon
                className={cn("mt-0.5 size-5 shrink-0", config.color)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900">
                    {task.title}
                  </p>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                      task.status === "completed"
                        ? "bg-green-50 text-green-700 ring-green-300"
                        : task.status === "in_progress"
                          ? "bg-blue-50 text-blue-700 ring-blue-300"
                          : task.status === "overdue"
                            ? "bg-red-50 text-red-700 ring-red-300"
                            : "bg-gray-100 text-gray-600 ring-gray-300"
                    )}
                  >
                    {config.label}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  {task.description}
                </p>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
                  <span>Due: {task.dueDate}</span>
                  <span className="inline-flex items-center rounded bg-gray-50 px-1.5 py-0.5 text-[11px] text-gray-500">
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
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="rounded-xl bg-white p-12 text-center ring-1 ring-gray-200/60">
            <p className="text-sm text-gray-500">
              No tasks matching this filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
