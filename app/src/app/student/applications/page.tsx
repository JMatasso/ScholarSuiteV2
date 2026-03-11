"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Plus,
  Calendar,
  GripVertical,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  CircleDot,
} from "lucide-react"

interface Application {
  id: number
  name: string
  provider: string
  amount: string
  deadline: string
  status: "not_started" | "in_progress" | "submitted" | "awarded" | "denied"
  progress: number
  essay: string | null
  notes: string
  checklist: { label: string; done: boolean }[]
}

const applications: Application[] = [
  {
    id: 1,
    name: "Gates Millennium Scholars Program",
    provider: "Bill & Melinda Gates Foundation",
    amount: "$72,000",
    deadline: "Apr 15, 2026",
    status: "in_progress",
    progress: 65,
    essay: "Personal Statement - Draft 3",
    notes: "Need to finalize community service hours documentation. Recommendation letter requested from Ms. Chen.",
    checklist: [
      { label: "Complete personal information", done: true },
      { label: "Upload transcript", done: true },
      { label: "Write personal statement", done: true },
      { label: "Get recommendation letter", done: false },
      { label: "Document community service", done: false },
      { label: "Final review and submit", done: false },
    ],
  },
  {
    id: 2,
    name: "Ron Brown Scholar Program",
    provider: "CAP Charitable Foundation",
    amount: "$40,000",
    deadline: "Apr 1, 2026",
    status: "in_progress",
    progress: 40,
    essay: "Leadership Essay",
    notes: "Focus on debate team leadership and tutoring program.",
    checklist: [
      { label: "Personal information", done: true },
      { label: "Academic records", done: true },
      { label: "Leadership essay", done: false },
      { label: "Community involvement", done: false },
      { label: "Submit application", done: false },
    ],
  },
  {
    id: 3,
    name: "QuestBridge National College Match",
    provider: "QuestBridge",
    amount: "Full Tuition",
    deadline: "Mar 27, 2026",
    status: "not_started",
    progress: 0,
    essay: null,
    notes: "Need to start application. Check income eligibility first.",
    checklist: [
      { label: "Verify income eligibility", done: false },
      { label: "Complete biographical section", done: false },
      { label: "Write essays (2 required)", done: false },
      { label: "Upload tax documents", done: false },
      { label: "School report", done: false },
    ],
  },
  {
    id: 4,
    name: "Elks National Foundation",
    provider: "Elks National Foundation",
    amount: "$50,000",
    deadline: "Apr 10, 2026",
    status: "not_started",
    progress: 0,
    essay: null,
    notes: "Check state residency requirement with local lodge.",
    checklist: [
      { label: "Contact local Elks lodge", done: false },
      { label: "Gather financial documents", done: false },
      { label: "Write personal essay", done: false },
      { label: "Get endorsement", done: false },
    ],
  },
  {
    id: 5,
    name: "Coca-Cola Scholars Foundation",
    provider: "Coca-Cola Company",
    amount: "$20,000",
    deadline: "Oct 31, 2026",
    status: "submitted",
    progress: 100,
    essay: "Community Impact Essay",
    notes: "Submitted on Feb 28. Semi-finalist notifications expected in April.",
    checklist: [
      { label: "Online application", done: true },
      { label: "Community impact essay", done: true },
      { label: "Activities list", done: true },
      { label: "School verification", done: true },
    ],
  },
  {
    id: 6,
    name: "Jack Kent Cooke Foundation",
    provider: "Jack Kent Cooke Foundation",
    amount: "$55,000",
    deadline: "Mar 22, 2026",
    status: "submitted",
    progress: 100,
    essay: "Overcoming Adversity Essay",
    notes: "Submitted on Mar 5. Interview may be required.",
    checklist: [
      { label: "Application form", done: true },
      { label: "Financial documents", done: true },
      { label: "Essays (3)", done: true },
      { label: "Recommendations (2)", done: true },
    ],
  },
  {
    id: 7,
    name: "National Merit Scholarship",
    provider: "NMSC",
    amount: "$2,500",
    deadline: "Feb 1, 2026",
    status: "awarded",
    progress: 100,
    essay: null,
    notes: "Awarded! $2,500 one-time scholarship. Ceremony on May 12.",
    checklist: [
      { label: "PSAT qualification", done: true },
      { label: "SAT confirmation", done: true },
      { label: "School endorsement", done: true },
    ],
  },
  {
    id: 8,
    name: "Horatio Alger Scholarship",
    provider: "Horatio Alger Association",
    amount: "$25,000",
    deadline: "Jan 15, 2026",
    status: "denied",
    progress: 100,
    essay: "Resilience Essay",
    notes: "Denied. Consider reapplying next cycle or appealing.",
    checklist: [
      { label: "Application", done: true },
      { label: "Financial verification", done: true },
      { label: "Essay", done: true },
      { label: "Interview", done: true },
    ],
  },
]

const columns: { key: Application["status"]; label: string; color: string; icon: React.ReactNode }[] = [
  { key: "not_started", label: "Not Started", color: "bg-gray-400", icon: <CircleDot className="h-3.5 w-3.5 text-gray-400" /> },
  { key: "in_progress", label: "In Progress", color: "bg-blue-500", icon: <Clock className="h-3.5 w-3.5 text-blue-500" /> },
  { key: "submitted", label: "Submitted", color: "bg-amber-500", icon: <FileText className="h-3.5 w-3.5 text-amber-500" /> },
  { key: "awarded", label: "Awarded", color: "bg-emerald-500", icon: <Award className="h-3.5 w-3.5 text-emerald-500" /> },
  { key: "denied", label: "Denied", color: "bg-rose-500", icon: <XCircle className="h-3.5 w-3.5 text-rose-500" /> },
]

function ApplicationCard({ app }: { app: Application }) {
  return (
    <Sheet>
      <SheetTrigger
        className="w-full text-left"
      >
        <div className="rounded-lg border bg-white p-3 space-y-2.5 hover:shadow-sm transition-shadow cursor-pointer">
          <div className="flex items-start gap-2">
            <GripVertical className="h-4 w-4 mt-0.5 text-muted-foreground/40 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight truncate">{app.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{app.provider}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#1E3A5F]">{app.amount}</span>
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {app.deadline}
            </span>
          </div>
          {app.progress < 100 && app.status !== "not_started" && (
            <Progress value={app.progress} />
          )}
        </div>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{app.name}</SheetTitle>
          <SheetDescription>{app.provider}</SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-4 pb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="text-sm font-semibold text-[#1E3A5F]">{app.amount}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Deadline</p>
              <p className="text-sm font-semibold">{app.deadline}</p>
            </div>
          </div>

          {app.progress > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground">Progress</p>
                <span className="text-xs font-semibold">{app.progress}%</span>
              </div>
              <Progress value={app.progress} />
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3">Checklist</p>
            <div className="space-y-2.5">
              {app.checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Checkbox checked={item.done} disabled />
                  <span className={`text-sm ${item.done ? "line-through text-muted-foreground" : ""}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {app.essay && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Linked Essay</p>
              <div className="flex items-center gap-2 rounded-lg border p-2.5">
                <FileText className="h-4 w-4 text-[#2563EB]" />
                <span className="text-sm">{app.essay}</span>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Notes</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{app.notes}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function ApplicationTracking() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1E3A5F]">Application Tracking</h1>
          <p className="mt-1 text-muted-foreground">
            Track your scholarship applications from start to finish.
          </p>
        </div>
        <Button className="gap-2 bg-[#2563EB] hover:bg-[#2563EB]/90">
          <Plus className="h-4 w-4" />
          Add Application
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colApps = applications.filter((a) => a.status === col.key)
          return (
            <div key={col.key} className="flex w-64 shrink-0 flex-col">
              {/* Column Header */}
              <div className="mb-3 flex items-center gap-2 px-1">
                <span className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                <span className="text-sm font-medium">{col.label}</span>
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {colApps.length}
                </span>
              </div>
              {/* Column Body */}
              <div className="flex-1 space-y-2.5 rounded-xl bg-muted/30 p-2.5 min-h-[200px]">
                {colApps.map((app) => (
                  <ApplicationCard key={app.id} app={app} />
                ))}
                {colApps.length === 0 && (
                  <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                    No applications
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
