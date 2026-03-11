"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  CheckSquare,
  FileText,
  DollarSign,
  Clock,
  AlertTriangle,
  ChevronDown,
  GraduationCap,
  TrendingUp,
} from "lucide-react";

// Mock data
const students = [
  {
    id: "1",
    name: "Alex Johnson",
    school: "Lincoln High School",
    grade: "11th Grade",
    gpa: 3.7,
    stage: "Active Prep",
    status: "ACTIVE" as const,
    avatar: "AJ",
    tasksCompleted: 12,
    totalTasks: 18,
    applicationsSubmitted: 5,
    scholarshipsWon: 2500,
    upcomingDeadlines: 3,
  },
];

const applicationsByStatus = [
  { status: "Submitted", count: 5, color: "bg-purple-500" },
  { status: "In Progress", count: 3, color: "bg-blue-500" },
  { status: "Awarded", count: 2, color: "bg-green-500" },
  { status: "Not Started", count: 4, color: "bg-gray-300" },
];

const alerts = [
  {
    id: "1",
    type: "overdue" as const,
    title: "FAFSA Application",
    description: "Was due March 1, 2026",
    daysOverdue: 10,
  },
  {
    id: "2",
    type: "overdue" as const,
    title: "Lincoln High Transcript Request",
    description: "Was due March 5, 2026",
    daysOverdue: 6,
  },
  {
    id: "3",
    type: "upcoming" as const,
    title: "Gates Scholarship Essay",
    description: "Due March 15, 2026",
    daysUntil: 4,
  },
  {
    id: "4",
    type: "upcoming" as const,
    title: "SAT Registration Deadline",
    description: "Due March 20, 2026",
    daysUntil: 9,
  },
  {
    id: "5",
    type: "upcoming" as const,
    title: "College Fair Prep Checklist",
    description: "Due March 25, 2026",
    daysUntil: 14,
  },
];

const financialSummary = {
  totalAwarded: 2500,
  totalApplied: 15000,
  potentialRemaining: 12500,
};

export default function ParentDashboard() {
  const [selectedStudent, setSelectedStudent] = useState(students[0]);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const completionPercent = Math.round(
    (selectedStudent.tasksCompleted / selectedStudent.totalTasks) * 100
  );

  return (
    <div className="space-y-6">
      {/* Page header + student selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Parent Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor your child&apos;s college preparation progress
          </p>
        </div>

        {/* Student selector */}
        <div className="relative">
          <button
            onClick={() => setSelectorOpen(!selectorOpen)}
            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 shadow-sm hover:border-gray-300 transition-colors"
          >
            <Avatar size="sm">
              <AvatarFallback className="bg-[#2563EB]/10 text-[#2563EB] text-xs font-semibold">
                {selectedStudent.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-700">
                {selectedStudent.name}
              </p>
              <p className="text-[11px] text-gray-400">
                {selectedStudent.school}
              </p>
            </div>
            <ChevronDown className="size-4 text-gray-400" />
          </button>
          {selectorOpen && students.length > 1 && (
            <div className="absolute right-0 top-full mt-1 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-50">
              {students.map((student) => (
                <button
                  key={student.id}
                  onClick={() => {
                    setSelectedStudent(student);
                    setSelectorOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  <Avatar size="sm">
                    <AvatarFallback className="bg-[#2563EB]/10 text-[#2563EB] text-xs font-semibold">
                      {student.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-gray-700">
                    {student.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Student profile card */}
      <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200/60 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          <Avatar size="lg" className="size-14">
            <AvatarFallback className="bg-[#1E3A5F] text-white text-lg font-semibold">
              {selectedStudent.avatar}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedStudent.name}
              </h2>
              <StatusBadge status={selectedStudent.status} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="size-3.5" />
                {selectedStudent.school}
              </span>
              <span>{selectedStudent.grade}</span>
              <span>GPA: {selectedStudent.gpa}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-[#2563EB]/5 px-4 py-2.5">
            <TrendingUp className="size-4 text-[#2563EB]" />
            <div>
              <p className="text-xs text-gray-500">Journey Stage</p>
              <p className="text-sm font-semibold text-[#1E3A5F]">
                {selectedStudent.stage}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tasks Completed"
          value={`${selectedStudent.tasksCompleted}/${selectedStudent.totalTasks}`}
          description={`${completionPercent}% complete`}
          icon={CheckSquare}
        />
        <StatCard
          title="Applications Submitted"
          value={selectedStudent.applicationsSubmitted}
          description="5 scholarships, 0 colleges"
          icon={FileText}
        />
        <StatCard
          title="Scholarships Won"
          value={`$${selectedStudent.scholarshipsWon.toLocaleString()}`}
          description="2 awards received"
          icon={DollarSign}
        />
        <StatCard
          title="Upcoming Deadlines"
          value={selectedStudent.upcomingDeadlines}
          description="Next: March 15"
          icon={Clock}
        />
      </div>

      {/* Progress overview row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Task completion */}
        <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200/60 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700">
            Overall Task Completion
          </h3>
          <div className="mt-4 flex items-center justify-center">
            <div className="relative size-32">
              <svg className="size-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#f0f0f0"
                  strokeWidth="10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${completionPercent * 3.14} ${314 - completionPercent * 3.14}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">
                  {completionPercent}%
                </span>
                <span className="text-[11px] text-gray-400">Complete</span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-gray-500">
            {selectedStudent.totalTasks - selectedStudent.tasksCompleted} tasks
            remaining
          </p>
        </div>

        {/* Applications by status */}
        <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200/60 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700">
            Applications by Status
          </h3>
          <div className="mt-4 space-y-3">
            {applicationsByStatus.map((item) => (
              <div key={item.status} className="flex items-center gap-3">
                <div className={cn("size-2.5 rounded-full", item.color)} />
                <span className="flex-1 text-sm text-gray-600">
                  {item.status}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 h-2.5 flex rounded-full overflow-hidden bg-gray-100">
            {applicationsByStatus.map((item) => (
              <div
                key={item.status}
                className={cn("h-full", item.color)}
                style={{
                  width: `${(item.count / applicationsByStatus.reduce((s, i) => s + i.count, 0)) * 100}%`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Financial summary */}
        <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200/60 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700">
            Financial Summary
          </h3>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs text-gray-400">Total Awarded</p>
              <p className="text-xl font-bold text-green-600">
                ${financialSummary.totalAwarded.toLocaleString()}
              </p>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-gray-400">Applied For</p>
                <p className="text-sm font-semibold text-gray-700">
                  ${financialSummary.totalApplied.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Pending</p>
                <p className="text-sm font-semibold text-gray-700">
                  ${financialSummary.potentialRemaining.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts section */}
      <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200/60 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Alerts & Deadlines
        </h3>
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "flex items-start gap-3 rounded-lg px-4 py-3",
                alert.type === "overdue"
                  ? "bg-red-50 ring-1 ring-red-200/60"
                  : "bg-amber-50 ring-1 ring-amber-200/60"
              )}
            >
              <AlertTriangle
                className={cn(
                  "mt-0.5 size-4 shrink-0",
                  alert.type === "overdue"
                    ? "text-red-500"
                    : "text-amber-500"
                )}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium",
                    alert.type === "overdue"
                      ? "text-red-800"
                      : "text-amber-800"
                  )}
                >
                  {alert.title}
                </p>
                <p
                  className={cn(
                    "text-xs mt-0.5",
                    alert.type === "overdue"
                      ? "text-red-600"
                      : "text-amber-600"
                  )}
                >
                  {alert.description}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  alert.type === "overdue"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
                )}
              >
                {alert.type === "overdue"
                  ? `${alert.daysOverdue}d overdue`
                  : `${alert.daysUntil}d left`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
