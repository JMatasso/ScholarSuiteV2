"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import {
  GraduationCap, Plus, Send, CheckCircle2, Clock, XCircle,
} from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { StatCard } from "@/components/ui/stat-card"
import { Skeleton } from "@/components/ui/skeleton"
import { CollegeAutocomplete, type CollegeResult } from "@/components/ui/college-autocomplete"
import { Tabs as VercelTabs } from "@/components/ui/vercel-tabs"
import { classifyCollege } from "@/lib/college-utils"
import {
  type CollegeApp, type AppType, type AppStatus,
  APP_TYPE_LABELS, CLASSIFICATION_LABELS,
  type AppClassification,
} from "@/components/college-kanban"
import { DiscoverTab } from "@/components/colleges/discover-tab"
import { ApplicationsTab } from "@/components/colleges/applications-tab"
import { DecisionsTab } from "@/components/colleges/decisions-tab"
import LoaderOne from "@/components/ui/loader-one"

/* ────── constants ────── */

const CLASSIFICATIONS = ["REACH", "MATCH", "SAFETY", "LIKELY"] as const

const CLASSIFICATION_CONFIG: Record<string, { label: string }> = {
  REACH: { label: "Reach" },
  MATCH: { label: "Match" },
  SAFETY: { label: "Safety" },
  LIKELY: { label: "Likely" },
}

const APP_TYPES = [
  { value: "REGULAR", label: "Regular Decision" },
  { value: "EARLY_DECISION", label: "Early Decision" },
  { value: "EARLY_DECISION_2", label: "Early Decision II" },
  { value: "EARLY_ACTION", label: "Early Action" },
  { value: "RESTRICTIVE_EARLY_ACTION", label: "Restrictive Early Action" },
  { value: "ROLLING", label: "Rolling" },
]

const DECISION_STATUSES = ["ACCEPTED", "WAITLISTED", "DENIED", "DEFERRED"]

type TabId = "discover" | "applications" | "decisions"

interface StudentProfile {
  satScore: number | null
  actScore: number | null
  gpa: number | null
}

/* ────── page ────── */

export default function CollegesPage() {
  const [activeTab, setActiveTab] = useState<TabId>("applications")
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
      if (!res.ok) throw new Error()
      setApps(await res.json())
    } catch {
      toast.error("Failed to load college applications")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/students/profile")
      if (res.ok) setProfile(await res.json())
    } catch { /* non-critical */ }
  }, [])

  useEffect(() => {
    fetchApps()
    fetchProfile()
  }, [fetchApps, fetchProfile])

  // Auto-suggest classification
  useEffect(() => {
    if (!selectedCollege?.id) {
      setSuggestedClassification(null)
      return
    }
    fetch(`/api/colleges/${selectedCollege.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((college) => {
        if (college && profile) {
          const cls = classifyCollege(
            profile.satScore, profile.actScore, profile.gpa,
            { acceptanceRate: college.acceptanceRate, sat25: college.sat25, sat75: college.sat75, act25: college.act25, act75: college.act75 }
          )
          setSuggestedClassification(cls)
          if (!formClassification) setFormClassification(cls)
        }
      })
      .catch(() => {})
  }, [selectedCollege, profile, formClassification])

  /* ────── handlers ────── */

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
      toast.success(`${selectedCollege.name} added!`)
      resetForm()
      setAddOpen(false)
      fetchApps()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add college")
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (id: string, status: AppStatus) => {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    try {
      const res = await fetch(`/api/college-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
    } catch {
      toast.error("Failed to update status")
      fetchApps()
    }
  }

  const handleUpdate = async (id: string, data: Partial<CollegeApp>) => {
    try {
      const res = await fetch(`/api/college-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      await fetchApps()
    } catch {
      toast.error("Failed to update application")
      throw new Error()
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/college-applications/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Application deleted")
      fetchApps()
    } catch {
      toast.error("Failed to delete application")
    }
  }

  const handleCommit = async (id: string) => {
    try {
      const currentCommitted = apps.find((a) => a.committed)
      if (currentCommitted && currentCommitted.id !== id) {
        await fetch(`/api/college-applications/${currentCommitted.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ committed: false }),
        })
      }
      const res = await fetch(`/api/college-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ committed: true }),
      })
      if (!res.ok) throw new Error()
      toast.success("School commitment updated!")
      await fetchApps()
    } catch {
      toast.error("Failed to update commitment")
    }
  }

  const handleUncommit = async (id: string) => {
    try {
      const res = await fetch(`/api/college-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ committed: false }),
      })
      if (!res.ok) throw new Error()
      toast.success("Commitment removed")
      await fetchApps()
    } catch {
      toast.error("Failed to remove commitment")
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

  /* ────── derived stats ────── */

  const total = apps.length
  const submitted = apps.filter((a) => a.status === "SUBMITTED").length
  const acceptedCount = apps.filter((a) => a.status === "ACCEPTED").length
  const decisionCount = apps.filter((a) => DECISION_STATUSES.includes(a.status)).length

  /* ────── render ────── */

  if (loading) return <LoadingSkeleton />

  const tabs: { id: TabId; label: string }[] = [
    { id: "discover", label: "Discover" },
    { id: "applications", label: "Applications" },
    { id: "decisions", label: "Decisions" },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-secondary-foreground">Colleges</h1>
          <p className="mt-1 text-muted-foreground">
            Discover, track, and manage your college applications.
          </p>
        </div>
        <Button className="gap-2" onClick={() => { resetForm(); setAddOpen(true) }}>
          <Plus className="h-4 w-4" /> Add College
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Schools" value={total} icon={GraduationCap} index={0} />
        <StatCard title="Submitted" value={submitted} icon={Send} index={1} />
        <StatCard title="Accepted" value={acceptedCount} icon={CheckCircle2} index={2} />
        <StatCard title="Decisions" value={decisionCount} icon={Clock} index={3} />
      </div>

      {/* Tab bar */}
      <VercelTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Tab content */}
      {activeTab === "discover" && (
        <DiscoverTab apps={apps} onAddedToList={fetchApps} />
      )}
      {activeTab === "applications" && (
        <ApplicationsTab
          apps={apps}
          onStatusChange={handleStatusChange}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onRefresh={fetchApps}
          onAddOpen={() => { resetForm(); setAddOpen(true) }}
        />
      )}
      {activeTab === "decisions" && (
        <DecisionsTab
          apps={apps}
          onCommit={handleCommit}
          onUncommit={handleUncommit}
        />
      )}

      {/* Add College Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-secondary-foreground">Add College</DialogTitle>
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
                      (suggested: {CLASSIFICATION_CONFIG[suggestedClassification]?.label})
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
                <label className="text-xs font-medium text-muted-foreground">Application Type</label>
                <Select value={formAppType} onValueChange={(v) => v && setFormAppType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APP_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Deadline</label>
              <Input type="date" value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)} />
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
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving || !selectedCollege?.name}>
              {saving ? "Adding..." : "Add College"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ────── loading skeleton ────── */

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-10 rounded-lg" />
      <div className="flex items-center justify-center py-16">
        <LoaderOne />
      </div>
    </div>
  )
}
