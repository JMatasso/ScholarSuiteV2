"use client"

import { useState, useEffect } from "react"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
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
  Loader2,
  Search,
} from "lucide-react"
import { toast } from "sonner"

interface ChecklistItem {
  id: string
  label: string
  completed: boolean
}

interface Essay {
  id: string
  title: string
}

interface Scholarship {
  id: string
  name: string
  provider: string
  amount: number | null
  amountMax: number | null
  deadline: string | null
}

interface Application {
  id: string
  scholarshipId: string
  status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "AWARDED" | "DENIED"
  notes: string | null
  scholarship: Scholarship
  checklists: ChecklistItem[]
  essays: Essay[]
}

const STATUS_MAP: Record<Application["status"], string> = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  SUBMITTED: "submitted",
  AWARDED: "awarded",
  DENIED: "denied",
}

const columns: { key: string; label: string; color: string; icon: React.ReactNode }[] = [
  { key: "not_started", label: "Not Started", color: "bg-gray-400", icon: <CircleDot className="h-3.5 w-3.5 text-gray-400" /> },
  { key: "in_progress", label: "In Progress", color: "bg-blue-500", icon: <Clock className="h-3.5 w-3.5 text-blue-500" /> },
  { key: "submitted", label: "Submitted", color: "bg-amber-500", icon: <FileText className="h-3.5 w-3.5 text-amber-500" /> },
  { key: "awarded", label: "Awarded", color: "bg-emerald-500", icon: <Award className="h-3.5 w-3.5 text-emerald-500" /> },
  { key: "denied", label: "Denied", color: "bg-rose-500", icon: <XCircle className="h-3.5 w-3.5 text-rose-500" /> },
]

function formatAmount(app: Application): string {
  const s = app.scholarship
  if (!s.amount) return "Varies"
  if (s.amountMax && s.amountMax !== s.amount) {
    return `$${s.amount.toLocaleString()} - $${s.amountMax.toLocaleString()}`
  }
  return `$${s.amount.toLocaleString()}`
}

function formatDeadline(deadline: string | null): string {
  if (!deadline) return "No deadline"
  return new Date(deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function getProgress(app: Application): number {
  if (app.status === "NOT_STARTED") return 0
  if (app.status === "SUBMITTED" || app.status === "AWARDED" || app.status === "DENIED") return 100
  if (app.checklists.length === 0) return 0
  const done = app.checklists.filter((c) => c.completed).length
  return Math.round((done / app.checklists.length) * 100)
}

function ApplicationCard({ app }: { app: Application }) {
  const progress = getProgress(app)

  return (
    <Sheet>
      <SheetTrigger className="w-full text-left">
        <div className="rounded-lg border bg-white p-3 space-y-2.5 hover:shadow-sm transition-shadow cursor-pointer">
          <div className="flex items-start gap-2">
            <GripVertical className="h-4 w-4 mt-0.5 text-muted-foreground/40 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight truncate">{app.scholarship.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{app.scholarship.provider}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#1E3A5F]">{formatAmount(app)}</span>
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDeadline(app.scholarship.deadline)}
            </span>
          </div>
          {progress > 0 && progress < 100 && (
            <Progress value={progress} />
          )}
        </div>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{app.scholarship.name}</SheetTitle>
          <SheetDescription>{app.scholarship.provider}</SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-4 pb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="text-sm font-semibold text-[#1E3A5F]">{formatAmount(app)}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Deadline</p>
              <p className="text-sm font-semibold">{formatDeadline(app.scholarship.deadline)}</p>
            </div>
          </div>

          {progress > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground">Progress</p>
                <span className="text-xs font-semibold">{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {app.checklists.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3">Checklist</p>
              <div className="space-y-2.5">
                {app.checklists.map((item) => (
                  <div key={item.id} className="flex items-center gap-2.5">
                    <Checkbox checked={item.completed} disabled />
                    <span className={`text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {app.essays.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Linked Essays</p>
              {app.essays.map((essay) => (
                <div key={essay.id} className="flex items-center gap-2 rounded-lg border p-2.5">
                  <FileText className="h-4 w-4 text-[#2563EB]" />
                  <span className="text-sm">{essay.title}</span>
                </div>
              ))}
            </div>
          )}

          {app.notes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Notes</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{app.notes}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function ApplicationTracking() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [scholarships, setScholarships] = useState<Scholarship[]>([])
  const [selectedScholarshipId, setSelectedScholarshipId] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [saving, setSaving] = useState(false)

  const handleAddApplication = async () => {
    if (!selectedScholarshipId) { toast.error("Select a scholarship"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scholarshipId: selectedScholarshipId }),
      })
      if (res.ok) {
        const newApp = await res.json()
        setApplications((prev) => [...prev, newApp])
        toast.success("Application added!")
        setAddOpen(false)
        setSelectedScholarshipId("")
        setSearchQuery("")
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Failed to add application")
      }
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  useEffect(() => {
    fetch("/api/scholarships").then(r => r.json()).then(d => setScholarships(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  useEffect(() => {
    fetch("/api/applications")
      .then((res) => res.json())
      .then((data) => {
        setApplications(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">Loading applications...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1E3A5F]">Application Tracking</h1>
          <p className="mt-1 text-muted-foreground">
            Track your scholarship applications from start to finish.
          </p>
        </div>
        <Button className="gap-2 bg-[#2563EB] hover:bg-[#2563EB]/90" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Application
        </Button>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Application</DialogTitle>
              <DialogDescription>Select a scholarship to start tracking an application.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input className="w-full rounded-md border pl-9 pr-3 py-2 text-sm" placeholder="Search scholarships..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <div className="max-h-[250px] overflow-y-auto space-y-1.5">
                {scholarships.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(s => (
                  <button key={s.id} onClick={() => setSelectedScholarshipId(s.id)} className={`w-full text-left rounded-lg border p-3 transition-colors ${selectedScholarshipId === s.id ? "border-[#2563EB] bg-blue-50/50 ring-1 ring-[#2563EB]/20" : "hover:bg-muted/50"}`}>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.provider} · {s.amount ? `$${s.amount.toLocaleString()}` : "Varies"}</p>
                  </button>
                ))}
                {scholarships.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No scholarships found.</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90" onClick={handleAddApplication} disabled={saving || !selectedScholarshipId}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Add Application
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colApps = applications.filter((a) => STATUS_MAP[a.status] === col.key)
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
