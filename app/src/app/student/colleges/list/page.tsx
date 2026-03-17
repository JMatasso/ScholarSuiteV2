"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import {
  GraduationCap,
  Plus,
  Trash2,
  ChevronDown,
  MapPin,
  DollarSign,
  BarChart3,
  Send,
  Calendar,
  ListChecks,
  ClipboardList,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatCard } from "@/components/ui/stat-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { CollegeAutocomplete, type CollegeResult } from "@/components/ui/college-autocomplete"
import {
  classifyCollege,
  formatTuition,
  formatAcceptanceRate,
  getCollegeTypeLabel,
} from "@/lib/college-utils"

/* ---------- Types ---------- */

interface College {
  id: string
  name: string
  city: string | null
  state: string | null
  type: string | null
  acceptanceRate: number | null
  sat25: number | null
  sat75: number | null
  act25: number | null
  act75: number | null
  inStateTuition: number | null
  outOfStateTuition: number | null
}

interface CollegeApp {
  id: string
  universityName: string
  applicationType: string
  status: string
  classification: string | null
  deadline: string | null
  notes: string | null
  collegeId: string | null
  college: College | null
  createdAt: string
  updatedAt: string
}

interface StudentProfile {
  satScore: number | null
  actScore: number | null
  gpa: number | null
}

/* ---------- Constants ---------- */

const CLASSIFICATIONS = ["REACH", "MATCH", "SAFETY", "LIKELY"] as const
type Classification = (typeof CLASSIFICATIONS)[number]

const CLASSIFICATION_CONFIG: Record<
  Classification | "UNCLASSIFIED",
  { label: string; bg: string; text: string; border: string; headerBg: string }
> = {
  REACH: {
    label: "Reach",
    bg: "bg-rose-100",
    text: "text-rose-700",
    border: "border-rose-200",
    headerBg: "bg-rose-50",
  },
  MATCH: {
    label: "Match",
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    headerBg: "bg-amber-50",
  },
  SAFETY: {
    label: "Safety",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
    headerBg: "bg-emerald-50",
  },
  LIKELY: {
    label: "Likely",
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
    headerBg: "bg-blue-50",
  },
  UNCLASSIFIED: {
    label: "Unclassified",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
    headerBg: "bg-gray-50",
  },
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  RESEARCHING: { label: "Researching", className: "bg-gray-100 text-gray-600 border-gray-200" },
  IN_PROGRESS: { label: "In Progress", className: "bg-amber-100 text-amber-700 border-amber-200" },
  SUBMITTED: { label: "Submitted", className: "bg-blue-100 text-blue-700 border-blue-200" },
  ACCEPTED: { label: "Accepted", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  DENIED: { label: "Denied", className: "bg-rose-100 text-rose-700 border-rose-200" },
  WAITLISTED: { label: "Waitlisted", className: "bg-amber-100 text-amber-700 border-amber-200" },
  DEFERRED: { label: "Deferred", className: "bg-amber-100 text-amber-700 border-amber-200" },
  WITHDRAWN: { label: "Withdrawn", className: "bg-gray-100 text-gray-600 border-gray-200" },
}

const APP_TYPE_LABELS: Record<string, string> = {
  REGULAR: "RD",
  EARLY_DECISION: "ED",
  EARLY_DECISION_2: "ED II",
  EARLY_ACTION: "EA",
  RESTRICTIVE_EARLY_ACTION: "REA",
  ROLLING: "Rolling",
}

const APP_TYPES = [
  { value: "REGULAR", label: "Regular Decision" },
  { value: "EARLY_DECISION", label: "Early Decision" },
  { value: "EARLY_DECISION_2", label: "Early Decision II" },
  { value: "EARLY_ACTION", label: "Early Action" },
  { value: "RESTRICTIVE_EARLY_ACTION", label: "Restrictive Early Action" },
  { value: "ROLLING", label: "Rolling" },
]

/* ---------- Page Component ---------- */

export default function CollegeListPage() {
  const [apps, setApps] = useState<CollegeApp[]>([])
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Add form state
  const [selectedCollege, setSelectedCollege] = useState<CollegeResult | null>(null)
  const [formClassification, setFormClassification] = useState<string>("")
  const [formAppType, setFormAppType] = useState("REGULAR")
  const [formDeadline, setFormDeadline] = useState("")
  const [formNotes, setFormNotes] = useState("")
  const [suggestedClassification, setSuggestedClassification] = useState<string | null>(null)

  const fetchApps = useCallback(async () => {
    try {
      const res = await fetch("/api/college-applications")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setApps(data)
    } catch {
      toast.error("Failed to load college list")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/students/profile")
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
      }
    } catch {
      // Non-critical — classification auto-suggest won't work
    }
  }, [])

  useEffect(() => {
    fetchApps()
    fetchProfile()
  }, [fetchApps, fetchProfile])

  // Auto-suggest classification when college is selected and profile has scores
  useEffect(() => {
    if (!selectedCollege || !selectedCollege.id) {
      setSuggestedClassification(null)
      return
    }

    // Fetch college stats for classification
    fetch(`/api/colleges/${selectedCollege.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((college) => {
        if (college && profile) {
          const cls = classifyCollege(
            profile.satScore,
            profile.actScore,
            profile.gpa,
            {
              acceptanceRate: college.acceptanceRate,
              sat25: college.sat25,
              sat75: college.sat75,
              act25: college.act25,
              act75: college.act75,
            }
          )
          setSuggestedClassification(cls)
          if (!formClassification) {
            setFormClassification(cls)
          }
        }
      })
      .catch(() => {})
  }, [selectedCollege, profile, formClassification])

  /* ---------- Actions ---------- */

  const handleAdd = async () => {
    if (!selectedCollege?.name) {
      toast.error("Please select a college")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/college-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityName: selectedCollege.name,
          collegeId: selectedCollege.id || null,
          classification: formClassification || null,
          applicationType: formAppType,
          deadline: formDeadline || null,
          notes: formNotes || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to add")
      }
      toast.success(`${selectedCollege.name} added to your list`)
      resetForm()
      setAddOpen(false)
      fetchApps()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add college")
    } finally {
      setSaving(false)
    }
  }

  const handleClassificationChange = async (appId: string, classification: string) => {
    try {
      const res = await fetch(`/api/college-applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classification }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast.success("Classification updated")
      setApps((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, classification } : a))
      )
    } catch {
      toast.error("Failed to update classification")
    }
  }

  const handleStatusChange = async (appId: string, status: string) => {
    try {
      const res = await fetch(`/api/college-applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast.success("Status updated")
      setApps((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status } : a))
      )
    } catch {
      toast.error("Failed to update status")
    }
  }

  const handleRemove = async (appId: string, name: string) => {
    if (!confirm(`Remove ${name} from your list?`)) return

    try {
      const res = await fetch(`/api/college-applications/${appId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to remove")
      toast.success(`${name} removed from your list`)
      setApps((prev) => prev.filter((a) => a.id !== appId))
    } catch {
      toast.error("Failed to remove college")
    }
  }

  const resetForm = () => {
    setSelectedCollege(null)
    setFormClassification("")
    setFormAppType("REGULAR")
    setFormDeadline("")
    setFormNotes("")
    setSuggestedClassification(null)
  }

  /* ---------- Derived data ---------- */

  const grouped = groupByClassification(apps)
  const submittedCount = apps.filter((a) =>
    ["SUBMITTED", "ACCEPTED", "DENIED", "WAITLISTED", "DEFERRED"].includes(a.status)
  ).length

  /* ---------- Render ---------- */

  if (loading) return <LoadingSkeleton />

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1E3A5F]">My College List</h1>
          <p className="mt-1 text-muted-foreground">
            Your curated college list organized by classification.
          </p>
        </div>
        <Button
          className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2"
          onClick={() => {
            resetForm()
            setAddOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Add College
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Schools"
          value={apps.length}
          icon={GraduationCap}
          index={0}
        />
        <StatCard
          title="Reach"
          value={grouped.REACH.length}
          icon={BarChart3}
          index={1}
        />
        <StatCard
          title="Match"
          value={grouped.MATCH.length}
          icon={ListChecks}
          index={2}
        />
        <StatCard
          title="Safety"
          value={grouped.SAFETY.length}
          icon={ClipboardList}
          index={3}
        />
        <StatCard
          title="Submitted"
          value={submittedCount}
          icon={Send}
          index={4}
        />
      </div>

      {/* Empty state */}
      {apps.length === 0 && (
        <EmptyState
          icon={GraduationCap}
          title="No colleges on your list yet"
          description="Start building your college list by adding schools you're interested in. We'll help you organize them by classification."
          action={
            <Button
              className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2"
              onClick={() => {
                resetForm()
                setAddOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
              Add Your First College
            </Button>
          }
        />
      )}

      {/* Classification groups */}
      {(["REACH", "MATCH", "LIKELY", "SAFETY", "UNCLASSIFIED"] as const).map((cls) => {
        const items = grouped[cls]
        if (items.length === 0) return null
        const config = CLASSIFICATION_CONFIG[cls]

        return (
          <div key={cls} className="space-y-3">
            {/* Group header */}
            <div
              className={`flex items-center justify-between rounded-lg px-4 py-2.5 ${config.headerBg} ${config.border} border`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${config.text}`}>
                  {config.label}
                </span>
                <Badge variant="outline" className={`${config.bg} ${config.text} ${config.border}`}>
                  {items.length}
                </Badge>
              </div>
            </div>

            {/* College cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((app) => (
                <CollegeCard
                  key={app.id}
                  app={app}
                  onClassificationChange={handleClassificationChange}
                  onStatusChange={handleStatusChange}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </div>
        )
      })}

      {/* Add College Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#1E3A5F]">Add College to List</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">College</label>
              <CollegeAutocomplete
                value={selectedCollege?.name || undefined}
                onSelect={(college) => {
                  if (college.id) {
                    setSelectedCollege(college)
                  } else {
                    setSelectedCollege(null)
                    setFormClassification("")
                    setSuggestedClassification(null)
                  }
                }}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Classification
                  {suggestedClassification && (
                    <span className="ml-1 text-[10px] text-[#2563EB]">
                      (suggested: {CLASSIFICATION_CONFIG[suggestedClassification as Classification]?.label})
                    </span>
                  )}
                </label>
                <Select value={formClassification} onValueChange={(v) => v && setFormClassification(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select classification" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASSIFICATIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CLASSIFICATION_CONFIG[c].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Application Type
                </label>
                <Select value={formAppType} onValueChange={(v) => v && setFormAppType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APP_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Deadline</label>
              <Input
                type="date"
                value={formDeadline}
                onChange={(e) => setFormDeadline(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <Textarea
                placeholder="Add any notes about this school..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#2563EB] hover:bg-[#2563EB]/90"
              onClick={handleAdd}
              disabled={saving || !selectedCollege?.name}
            >
              {saving ? "Adding..." : "Add to List"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ---------- CollegeCard ---------- */

function CollegeCard({
  app,
  onClassificationChange,
  onStatusChange,
  onRemove,
}: {
  app: CollegeApp
  onClassificationChange: (id: string, cls: string) => void
  onStatusChange: (id: string, status: string) => void
  onRemove: (id: string, name: string) => void
}) {
  const college = app.college
  const statusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.RESEARCHING
  const appTypeLabel = APP_TYPE_LABELS[app.applicationType] || app.applicationType
  const clsCfg = app.classification
    ? CLASSIFICATION_CONFIG[app.classification as Classification]
    : null

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm truncate">{app.universityName}</CardTitle>
            {(college?.city || college?.state) && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                {[college.city, college.state].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {college?.type && (
              <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700">
                {getCollegeTypeLabel(college.type)}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* College stats */}
        {college && (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Accept</span>
              <p className="font-medium">{formatAcceptanceRate(college.acceptanceRate)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">SAT</span>
              <p className="font-medium">
                {college.sat25 != null && college.sat75 != null
                  ? `${college.sat25}-${college.sat75}`
                  : "N/A"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Tuition</span>
              <p className="font-medium">
                {formatTuition(college.inStateTuition ?? college.outOfStateTuition)}
              </p>
            </div>
          </div>
        )}

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className={statusCfg.className}>
            {statusCfg.label}
          </Badge>
          <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
            {appTypeLabel}
          </Badge>
          {app.deadline && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Calendar className="h-2.5 w-2.5" />
              {new Date(app.deadline).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100">
          {/* Classification dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs px-2">
                {clsCfg ? (
                  <span className={clsCfg.text}>{clsCfg.label}</span>
                ) : (
                  <span className="text-muted-foreground">Classify</span>
                )}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {CLASSIFICATIONS.map((c) => (
                <DropdownMenuItem
                  key={c}
                  onClick={() => onClassificationChange(app.id, c)}
                >
                  <span className={CLASSIFICATION_CONFIG[c].text}>
                    {CLASSIFICATION_CONFIG[c].label}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status dropdown */}
          {app.status === "RESEARCHING" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 text-[#2563EB] hover:text-[#2563EB]"
              onClick={() => onStatusChange(app.id, "IN_PROGRESS")}
            >
              Start Application
            </Button>
          )}

          <div className="flex-1" />

          {/* Remove */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:text-rose-600"
            onClick={() => onRemove(app.id, app.universityName)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/* ---------- Helpers ---------- */

function groupByClassification(apps: CollegeApp[]) {
  const groups: Record<string, CollegeApp[]> = {
    REACH: [],
    MATCH: [],
    SAFETY: [],
    LIKELY: [],
    UNCLASSIFIED: [],
  }

  for (const app of apps) {
    const key = app.classification && groups[app.classification] ? app.classification : "UNCLASSIFIED"
    groups[key].push(app)
  }

  return groups
}

/* ---------- Loading Skeleton ---------- */

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-10 rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
