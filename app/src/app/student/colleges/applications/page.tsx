"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import LoaderOne from "@/components/ui/loader-one"
import { Plus, GraduationCap, Send, CheckCircle2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { StatCard } from "@/components/ui/stat-card"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import {
  KanbanColumn, COLUMNS, FILTER_OPTIONS,
  APP_TYPE_LABELS, CLASSIFICATION_LABELS, PLATFORM_LABELS,
  type CollegeApp, type AppType, type AppStatus, type AppClassification, type AppPlatform,
} from "@/components/college-kanban"
import { CollegeAppDetail } from "@/components/college-app-detail"
import { CollegeAutocomplete, type CollegeResult } from "@/components/ui/college-autocomplete"

export default function CollegeApplicationsPage() {
  const [apps, setApps] = useState<CollegeApp[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("ALL")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedApp, setSelectedApp] = useState<CollegeApp | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [form, setForm] = useState({
    universityName: "",
    collegeId: null as string | null,
    applicationType: "REGULAR" as AppType,
    classification: "" as string,
    platform: "" as string,
    deadline: "",
    notes: "",
  })

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

  useEffect(() => { fetchApps() }, [fetchApps])

  // Keep selectedApp in sync with fetched data
  useEffect(() => {
    if (selectedApp) {
      const updated = apps.find((a) => a.id === selectedApp.id)
      if (updated) setSelectedApp(updated)
    }
  }, [apps, selectedApp])

  const filtered = filter === "ALL" ? apps : apps.filter((a) => a.applicationType === filter)

  const handleCollegeSelect = (college: CollegeResult) => {
    if (!college.id) {
      setForm((f) => ({ ...f, universityName: "", collegeId: null }))
      return
    }
    setForm((f) => ({ ...f, universityName: college.name, collegeId: college.id }))
  }

  const handleCreate = async () => {
    if (!form.universityName.trim()) {
      toast.error("University name is required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/college-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityName: form.universityName,
          collegeId: form.collegeId,
          applicationType: form.applicationType,
          classification: form.classification || null,
          platform: form.platform || null,
          deadline: form.deadline || null,
          notes: form.notes || null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("College added!")
      setDialogOpen(false)
      setForm({ universityName: "", collegeId: null, applicationType: "REGULAR", classification: "", platform: "", deadline: "", notes: "" })
      fetchApps()
    } catch {
      toast.error("Failed to add college")
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

  const handleCardClick = (app: CollegeApp) => {
    setSelectedApp(app)
    setDetailOpen(true)
  }

  const total = apps.length
  const submitted = apps.filter((a) => a.status === "SUBMITTED").length
  const accepted = apps.filter((a) => a.status === "ACCEPTED").length
  const waitlisted = apps.filter((a) => ["WAITLISTED", "DEFERRED"].includes(a.status)).length

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1E3A5F]">College Applications</h1>
          <p className="mt-1 text-muted-foreground">Track your applications from research to decision.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => v && setFilter(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILTER_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Add College
          </Button>
        </div>
      </div>

      {/* stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total" value={total} icon={GraduationCap} index={0} />
        <StatCard title="Submitted" value={submitted} icon={Send} index={1} />
        <StatCard title="Accepted" value={accepted} icon={CheckCircle2} index={2} />
        <StatCard title="Waitlisted" value={waitlisted} icon={Clock} index={3} />
      </div>

      {/* kanban */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <LoaderOne />
        </div>
      ) : apps.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No colleges yet"
          description="Start adding colleges you're interested in to track your applications."
          action={
            <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Add College
            </Button>
          }
        />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colApps = filtered.filter((a) =>
              col.key === "WAITLISTED"
                ? a.status === "WAITLISTED" || a.status === "DEFERRED"
                : a.status === col.key
            )
            return (
              <KanbanColumn
                key={col.key}
                column={col}
                apps={colApps}
                onStatusChange={handleStatusChange}
                onCardClick={handleCardClick}
              />
            )
          })}
        </div>
      )}

      {/* detail panel */}
      {selectedApp && (
        <CollegeAppDetail
          app={selectedApp}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onRefresh={fetchApps}
        />
      )}

      {/* add dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add College</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">College *</label>
              <CollegeAutocomplete
                value={form.universityName || undefined}
                onSelect={handleCollegeSelect}
                placeholder="Search for a college..."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Application Type</label>
                <Select value={form.applicationType} onValueChange={(v) => v && setForm((f) => ({ ...f, applicationType: v as AppType }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(APP_TYPE_LABELS) as AppType[]).map((t) => (
                      <SelectItem key={t} value={t}>{APP_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Deadline</label>
                <Input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Classification</label>
                <Select value={form.classification || "NONE"} onValueChange={(v) => setForm((f) => ({ ...f, classification: v === "NONE" ? "" : (v ?? "") }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Not set</SelectItem>
                    {(Object.keys(CLASSIFICATION_LABELS) as AppClassification[]).map((c) => (
                      <SelectItem key={c} value={c}>{CLASSIFICATION_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Platform</label>
                <Select value={form.platform || "NONE"} onValueChange={(v) => setForm((f) => ({ ...f, platform: v === "NONE" ? "" : (v ?? "") }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Not set</SelectItem>
                    {(Object.keys(PLATFORM_LABELS) as AppPlatform[]).map((p) => (
                      <SelectItem key={p} value={p}>{PLATFORM_LABELS[p]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <Textarea placeholder="Any notes about this school..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90" onClick={handleCreate} disabled={saving}>
              {saving ? "Adding..." : "Add College"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
