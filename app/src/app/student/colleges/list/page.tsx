"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
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
  Search,
  SlidersHorizontal,
} from "@/lib/icons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
import { MultiSelect } from "@/components/ui/multi-select"
import { StatCard } from "@/components/ui/stat-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { CollegeAutocomplete, type CollegeResult } from "@/components/ui/college-autocomplete"
import {
  CollegeCard as SearchCollegeCard,
  CollegeDetailDialog,
  ComparisonPanel,
} from "@/components/college-search"
import type { College as SearchCollege } from "@/components/college-search"
import { US_STATES, STATE_NAMES, COLLEGE_TYPES } from "@/components/college-search"
import {
  classifyCollege,
  formatTuition,
  formatAcceptanceRate,
  getCollegeTypeLabel,
} from "@/lib/college-utils"
import { formatDate } from "@/lib/format"
import { Tabs as VercelTabs } from "@/components/ui/vercel-tabs"
import { cn } from "@/lib/utils"
import LoaderOne from "@/components/ui/loader-one"

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
  college: CollegeAppCollege | null
  createdAt: string
  updatedAt: string
}

interface CollegeAppCollege {
  id?: string
  name: string
  city: string | null
  state: string | null
  type: string | null
  locale?: string | null
  enrollment?: number | null
  acceptanceRate: number | null
  satAvg?: number | null
  sat25: number | null
  sat75: number | null
  actAvg?: number | null
  act25: number | null
  act75: number | null
  testOptional?: boolean
  inStateTuition: number | null
  outOfStateTuition: number | null
  roomAndBoard?: number | null
  pellPct?: number | null
  fedLoanPct?: number | null
  medianDebt?: number | null
  gradRate4yr?: number | null
  gradRate6yr?: number | null
  retentionRate?: number | null
  medianEarnings6yr?: number | null
  medianEarnings10yr?: number | null
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
    headerBg: "bg-accent",
  },
  UNCLASSIFIED: {
    label: "Unclassified",
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
    headerBg: "bg-muted/50",
  },
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  RESEARCHING: { label: "Researching", className: "bg-muted text-muted-foreground border-border" },
  IN_PROGRESS: { label: "In Progress", className: "bg-amber-100 text-amber-700 border-amber-200" },
  SUBMITTED: { label: "Submitted", className: "bg-blue-100 text-blue-700 border-blue-200" },
  ACCEPTED: { label: "Accepted", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  DENIED: { label: "Denied", className: "bg-rose-100 text-rose-700 border-rose-200" },
  WAITLISTED: { label: "Waitlisted", className: "bg-amber-100 text-amber-700 border-amber-200" },
  DEFERRED: { label: "Deferred", className: "bg-amber-100 text-amber-700 border-amber-200" },
  WITHDRAWN: { label: "Withdrawn", className: "bg-muted text-muted-foreground border-border" },
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

type TabId = "list" | "search" | "compare"

/* ---------- Compare table config ---------- */

type Getter = (a: CollegeApp) => number | null
type Direction = "high" | "low"

const fmtPct = (v: number | null) => (v != null ? `${Math.round(v * 100)}%` : "\u2014")
const fmtMoney = (v: number | null) =>
  v != null ? `$${v.toLocaleString("en-US")}` : "\u2014"
const fmtNum = (v: number | null) => (v != null ? v.toLocaleString("en-US") : "\u2014")
const fmtStr = (v: string | null | undefined) => v || "\u2014"
const fmtBool = (v: boolean | undefined) => (v === true ? "Yes" : v === false ? "No" : "\u2014")
const fmtRange = (lo: number | null, hi: number | null) =>
  lo != null && hi != null ? `${lo}\u2013${hi}` : lo != null ? `${lo}+` : "\u2014"

interface CompareRow {
  label: string
  value: (a: CollegeApp) => string
  rank?: { get: Getter; dir: Direction }
}

const compareSections: { title: string; rows: CompareRow[] }[] = [
  {
    title: "Overview",
    rows: [
      { label: "Name", value: (a) => a.college?.name ?? a.universityName },
      { label: "City / State", value: (a) => a.college ? fmtStr([a.college.city, a.college.state].filter(Boolean).join(", ") || null) : "\u2014" },
      { label: "Type", value: (a) => fmtStr(a.college?.type) },
      { label: "Enrollment", value: (a) => fmtNum(a.college?.enrollment ?? null), rank: { get: (a) => a.college?.enrollment ?? null, dir: "high" } },
      { label: "Locale", value: (a) => fmtStr(a.college?.locale) },
    ],
  },
  {
    title: "Admissions",
    rows: [
      { label: "Acceptance Rate", value: (a) => fmtPct(a.college?.acceptanceRate ?? null), rank: { get: (a) => a.college?.acceptanceRate ?? null, dir: "high" } },
      { label: "SAT Avg", value: (a) => fmtNum(a.college?.satAvg ?? null), rank: { get: (a) => a.college?.satAvg ?? null, dir: "high" } },
      { label: "SAT Range (25th\u201375th)", value: (a) => fmtRange(a.college?.sat25 ?? null, a.college?.sat75 ?? null) },
      { label: "ACT Avg", value: (a) => fmtNum(a.college?.actAvg ?? null), rank: { get: (a) => a.college?.actAvg ?? null, dir: "high" } },
      { label: "ACT Range (25th\u201375th)", value: (a) => fmtRange(a.college?.act25 ?? null, a.college?.act75 ?? null) },
      { label: "Test Optional", value: (a) => fmtBool(a.college?.testOptional) },
    ],
  },
  {
    title: "Cost",
    rows: [
      { label: "In-State Tuition", value: (a) => fmtMoney(a.college?.inStateTuition ?? null), rank: { get: (a) => a.college?.inStateTuition ?? null, dir: "low" } },
      { label: "Out-of-State Tuition", value: (a) => fmtMoney(a.college?.outOfStateTuition ?? null), rank: { get: (a) => a.college?.outOfStateTuition ?? null, dir: "low" } },
      { label: "Room & Board", value: (a) => fmtMoney(a.college?.roomAndBoard ?? null), rank: { get: (a) => a.college?.roomAndBoard ?? null, dir: "low" } },
    ],
  },
  {
    title: "Financial Aid",
    rows: [
      { label: "Pell Grant %", value: (a) => fmtPct(a.college?.pellPct ?? null), rank: { get: (a) => a.college?.pellPct ?? null, dir: "high" } },
      { label: "Federal Loan %", value: (a) => fmtPct(a.college?.fedLoanPct ?? null), rank: { get: (a) => a.college?.fedLoanPct ?? null, dir: "low" } },
      { label: "Median Debt", value: (a) => fmtMoney(a.college?.medianDebt ?? null), rank: { get: (a) => a.college?.medianDebt ?? null, dir: "low" } },
    ],
  },
  {
    title: "Outcomes",
    rows: [
      { label: "4-Year Grad Rate", value: (a) => fmtPct(a.college?.gradRate4yr ?? null), rank: { get: (a) => a.college?.gradRate4yr ?? null, dir: "high" } },
      { label: "6-Year Grad Rate", value: (a) => fmtPct(a.college?.gradRate6yr ?? null), rank: { get: (a) => a.college?.gradRate6yr ?? null, dir: "high" } },
      { label: "Retention Rate", value: (a) => fmtPct(a.college?.retentionRate ?? null), rank: { get: (a) => a.college?.retentionRate ?? null, dir: "high" } },
      { label: "Median Earnings (6yr)", value: (a) => fmtMoney(a.college?.medianEarnings6yr ?? null), rank: { get: (a) => a.college?.medianEarnings6yr ?? null, dir: "high" } },
      { label: "Median Earnings (10yr)", value: (a) => fmtMoney(a.college?.medianEarnings10yr ?? null), rank: { get: (a) => a.college?.medianEarnings10yr ?? null, dir: "high" } },
    ],
  },
  {
    title: "Your Application",
    rows: [
      { label: "Application Type", value: (a) => fmtStr(a.applicationType) },
      { label: "Status", value: (a) => fmtStr(a.status) },
      { label: "Classification", value: (a) => fmtStr(a.classification) },
      { label: "Deadline", value: (a) => formatDate(a.deadline) },
    ],
  },
]

function rankValues(apps: CollegeApp[], get: Getter, dir: Direction) {
  const vals = apps.map((a) => get(a))
  const valid = vals.filter((v): v is number => v != null)
  if (valid.length < 2) return apps.map(() => "neutral" as const)
  const best = dir === "high" ? Math.max(...valid) : Math.min(...valid)
  const worst = dir === "high" ? Math.min(...valid) : Math.max(...valid)
  return vals.map((v) => {
    if (v == null) return "neutral" as const
    if (v === best) return "best" as const
    if (v === worst) return "worst" as const
    return "neutral" as const
  })
}

const cellColor = { best: "bg-emerald-50", worst: "bg-rose-50", neutral: "" }

/* ---------- Page Component ---------- */

export default function CollegeListPage() {
  const [activeTab, setActiveTab] = useState<TabId>("list")
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
      // Non-critical -- classification auto-suggest won't work
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

  const tabs: { id: TabId; label: string }[] = [
    { id: "list", label: "My List" },
    { id: "search", label: "Search & Add" },
    { id: "compare", label: "Compare" },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-secondary-foreground">My Colleges</h1>
          <p className="mt-1 text-muted-foreground">
            Search, track, and compare your college list.
          </p>
        </div>
        <Button
          className="gap-2"
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

      {/* Tab bar */}
      <VercelTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Tab content */}
      {activeTab === "list" && (
        <MyListTab
          apps={apps}
          grouped={grouped}
          onClassificationChange={handleClassificationChange}
          onStatusChange={handleStatusChange}
          onRemove={handleRemove}
          onAddOpen={() => { resetForm(); setAddOpen(true) }}
        />
      )}
      {activeTab === "search" && (
        <SearchAddTab onAddedToList={fetchApps} />
      )}
      {activeTab === "compare" && (
        <CompareTab apps={apps} />
      )}

      {/* Add College Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-secondary-foreground">Add College to List</DialogTitle>
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

/* ================================================================
   Tab 1: My List
   ================================================================ */

function MyListTab({
  apps,
  grouped,
  onClassificationChange,
  onStatusChange,
  onRemove,
  onAddOpen,
}: {
  apps: CollegeApp[]
  grouped: Record<string, CollegeApp[]>
  onClassificationChange: (id: string, cls: string) => void
  onStatusChange: (id: string, status: string) => void
  onRemove: (id: string, name: string) => void
  onAddOpen: () => void
}) {
  if (apps.length === 0) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="No colleges on your list yet"
        description="Start building your college list by adding schools you're interested in. We'll help you organize them by classification."
        action={
          <Button className="gap-2" onClick={onAddOpen}>
            <Plus className="h-4 w-4" />
            Add Your First College
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-5">
      {(["REACH", "MATCH", "LIKELY", "SAFETY", "UNCLASSIFIED"] as const).map((cls) => {
        const items = grouped[cls]
        if (items.length === 0) return null
        const config = CLASSIFICATION_CONFIG[cls]

        return (
          <div key={cls} className="space-y-3">
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

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((app) => (
                <ListCollegeCard
                  key={app.id}
                  app={app}
                  onClassificationChange={onClassificationChange}
                  onStatusChange={onStatusChange}
                  onRemove={onRemove}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ---------- ListCollegeCard ---------- */

function ListCollegeCard({
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
    <Card variant="bento">
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
              <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-accent text-blue-700">
                {getCollegeTypeLabel(college.type)}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
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

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className={statusCfg.className}>
            {statusCfg.label}
          </Badge>
          <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
            {appTypeLabel}
          </Badge>
          {app.deadline && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Calendar className="h-2.5 w-2.5" />
              {new Date(app.deadline).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 pt-1 border-t border-border">
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

/* ================================================================
   Tab 2: Search & Add
   ================================================================ */

function SearchAddTab({ onAddedToList }: { onAddedToList: () => void }) {
  const [colleges, setColleges] = useState<SearchCollege[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [offset, setOffset] = useState(0)
  const limit = 20

  // Search/filter state
  const [query, setQuery] = useState("")
  const [stateFilter, setStateFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [hbcuOnly, setHbcuOnly] = useState(false)
  const [testOptionalOnly, setTestOptionalOnly] = useState(false)

  // Advanced filters
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [maxAcceptance, setMaxAcceptance] = useState("")
  const [maxTuition, setMaxTuition] = useState("")

  // Compare
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set())
  const [compareColleges, setCompareColleges] = useState<SearchCollege[]>([])

  // Detail dialog
  const [detailCollege, setDetailCollege] = useState<SearchCollege | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const fetchColleges = useCallback(async (newOffset = 0) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.set("q", query)
      if (stateFilter) params.set("state", stateFilter)
      if (typeFilter) params.set("type", typeFilter)
      if (hbcuOnly) params.set("hbcu", "true")
      if (testOptionalOnly) params.set("testOptional", "true")
      if (maxAcceptance) params.set("maxAcceptance", maxAcceptance)
      if (maxTuition) params.set("maxTuition", maxTuition)
      params.set("limit", String(limit))
      params.set("offset", String(newOffset))

      const res = await fetch(`/api/colleges?${params}`)
      if (!res.ok) throw new Error("Failed to fetch colleges")
      const data = await res.json()
      setColleges(data.colleges)
      setTotal(data.total)
      setOffset(newOffset)
    } catch {
      toast.error("Failed to load colleges")
    } finally {
      setLoading(false)
    }
  }, [query, stateFilter, typeFilter, hbcuOnly, testOptionalOnly, maxAcceptance, maxTuition])

  // Initial load + search on filter change
  useEffect(() => {
    const timer = setTimeout(() => fetchColleges(0), 300)
    return () => clearTimeout(timer)
  }, [fetchColleges])

  // Fetch compare data when IDs change
  useEffect(() => {
    if (compareIds.size < 2) {
      setCompareColleges([])
      return
    }
    async function fetchCompare() {
      try {
        const res = await fetch("/api/colleges/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: Array.from(compareIds) }),
        })
        if (!res.ok) throw new Error("Failed to compare")
        const data = await res.json()
        setCompareColleges(data)
      } catch {
        toast.error("Failed to load comparison data")
      }
    }
    fetchCompare()
  }, [compareIds])

  function toggleCompare(id: string) {
    setCompareIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 4) next.add(id)
      return next
    })
  }

  async function addToList(college: SearchCollege, classification = "MATCH") {
    try {
      const res = await fetch("/api/college-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityName: college.name,
          collegeId: college.id,
          status: "RESEARCHING",
          classification,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to add")
      }
      toast.success(`${college.name} added to your list`)
      onAddedToList()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add college")
    }
  }

  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.floor(offset / limit) + 1

  return (
    <div className="space-y-5">
      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by college name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Badge variant="secondary" className="self-center whitespace-nowrap">
            {total.toLocaleString()} result{total !== 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={stateFilter} onValueChange={(v) => { if (v) setStateFilter(v === "ALL" ? "" : v) }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All States</SelectItem>
              {US_STATES.map((s) => (
                <SelectItem key={s} value={s}>{STATE_NAMES[s] || s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(v) => { if (v) setTypeFilter(v === "ALL" ? "" : v) }}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {COLLEGE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="flex items-center gap-1.5 text-xs">
            <Checkbox checked={hbcuOnly} onCheckedChange={(v) => setHbcuOnly(v === true)} />
            HBCU
          </label>

          <label className="flex items-center gap-1.5 text-xs">
            <Checkbox checked={testOptionalOnly} onCheckedChange={(v) => setTestOptionalOnly(v === true)} />
            Test Optional
          </label>

          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <SlidersHorizontal className="h-3 w-3" />
            Advanced
            <ChevronDown className={`h-3 w-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
          </Button>
        </div>

        {/* Advanced filters */}
        {showAdvanced && (
          <div className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-card p-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Max Acceptance Rate (%)</label>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="e.g. 30"
                value={maxAcceptance}
                onChange={(e) => setMaxAcceptance(e.target.value)}
                className="w-32"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Max Tuition ($)</label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 40000"
                value={maxTuition}
                onChange={(e) => setMaxTuition(e.target.value)}
                className="w-32"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => { setMaxAcceptance(""); setMaxTuition("") }}
            >
              Reset
            </Button>
          </div>
        )}
      </div>

      {/* Comparison Panel */}
      <ComparisonPanel
        colleges={compareColleges}
        onRemove={(id) => toggleCompare(id)}
        onAddToList={(c) => addToList(c)}
        onClearAll={() => setCompareIds(new Set())}
      />

      {/* Results Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <LoaderOne />
        </div>
      ) : colleges.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No colleges found"
          description="Try adjusting your search or filter criteria."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {colleges.map((college) => (
              <SearchCollegeCard
                key={college.id}
                college={college}
                isComparing={compareIds.has(college.id)}
                compareCount={compareIds.size}
                onToggleCompare={toggleCompare}
                onViewDetail={(c) => { setDetailCollege(c); setDetailOpen(true) }}
                onAddToList={(c) => addToList(c)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => fetchColleges(offset - limit)}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => fetchColleges(offset + limit)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Detail Dialog */}
      <CollegeDetailDialog
        college={detailCollege}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onAddToList={(college, classification) => {
          addToList(college, classification)
          setDetailOpen(false)
        }}
      />
    </div>
  )
}

/* ================================================================
   Tab 3: Compare
   ================================================================ */

function CompareTab({ apps }: { apps: CollegeApp[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const options = useMemo(
    () => apps.map((a) => ({ id: a.id, label: a.universityName })),
    [apps]
  )

  const selected = useMemo(
    () => apps.filter((a) => selectedIds.includes(a.id)),
    [apps, selectedIds]
  )

  const handleChange = (ids: string[]) => setSelectedIds(ids.slice(0, 4))

  return (
    <div className="space-y-5">
      <div className="max-w-md">
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Select 2-4 colleges to compare
        </label>
        <MultiSelect
          options={options}
          selectedIds={selectedIds}
          onChange={handleChange}
          placeholder="Choose colleges..."
          searchPlaceholder="Search your college list..."
          emptyMessage="No colleges in your list yet."
        />
      </div>

      {selected.length < 2 ? (
        <Card variant="bento">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-secondary-foreground mb-3">
              <GraduationCap className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-secondary-foreground">Select at least 2 colleges</p>
            <p className="text-xs text-muted-foreground mt-1">Pick colleges from your list above to see a side-by-side comparison.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[600px] text-sm">
            {compareSections.map((section) => (
              <tbody key={section.title}>
                <tr>
                  <td
                    colSpan={selected.length + 1}
                    className="bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-secondary-foreground"
                  >
                    {section.title}
                  </td>
                </tr>
                {section.rows.map((row) => {
                  const ranks = row.rank
                    ? rankValues(selected, row.rank.get, row.rank.dir)
                    : selected.map(() => "neutral" as const)
                  return (
                    <tr key={row.label} className="border-t border-border">
                      <td className="whitespace-nowrap px-4 py-2 font-medium text-muted-foreground w-48">
                        {row.label}
                      </td>
                      {selected.map((app, i) => (
                        <td
                          key={app.id}
                          className={cn("px-4 py-2 text-center", cellColor[ranks[i]])}
                        >
                          {row.value(app)}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            ))}
          </table>
        </div>
      )}
    </div>
  )
}

/* ================================================================
   Helpers
   ================================================================ */

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
