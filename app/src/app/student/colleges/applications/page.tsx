"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { Plus, Star, Shield, GraduationCap, Send, CheckCircle2, Clock } from "lucide-react"
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
  type CollegeApp, type AppType, type AppStatus,
} from "@/components/college-kanban"

export default function CollegeApplicationsPage() {
  const [apps, setApps] = useState<CollegeApp[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("ALL")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    universityName: "",
    applicationType: "REGULAR" as AppType,
    deadline: "",
    cost: "",
    isDream: false,
    isSafety: false,
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

  const filtered = filter === "ALL" ? apps : apps.filter((a) => a.applicationType === filter)

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
          ...form,
          cost: form.cost ? parseFloat(form.cost) : null,
          deadline: form.deadline || null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("College added!")
      setDialogOpen(false)
      setForm({ universityName: "", applicationType: "REGULAR", deadline: "", cost: "", isDream: false, isSafety: false, notes: "" })
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
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <p className="text-sm">Loading...</p>
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
              />
            )
          })}
        </div>
      )}

      {/* add dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add College</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">University Name *</label>
              <Input
                placeholder="e.g. Stanford University"
                value={form.universityName}
                onChange={(e) => setForm((f) => ({ ...f, universityName: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Application Type</label>
                <Select value={form.applicationType} onValueChange={(v) => v && setForm((f) => ({ ...f, applicationType: v as AppType }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REGULAR">Regular</SelectItem>
                    <SelectItem value="EARLY_DECISION">Early Decision</SelectItem>
                    <SelectItem value="EARLY_ACTION">Early Action</SelectItem>
                    <SelectItem value="ROLLING">Rolling</SelectItem>
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
                <label className="text-xs font-medium text-muted-foreground">Estimated Cost</label>
                <Input type="number" placeholder="e.g. 55000" value={form.cost} onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))} />
              </div>
              <div className="flex items-end gap-4 pb-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isDream} onChange={(e) => setForm((f) => ({ ...f, isDream: e.target.checked, isSafety: e.target.checked ? false : f.isSafety }))} className="rounded border-gray-300" />
                  <Star className="h-4 w-4 text-amber-500" /> Dream
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isSafety} onChange={(e) => setForm((f) => ({ ...f, isSafety: e.target.checked, isDream: e.target.checked ? false : f.isDream }))} className="rounded border-gray-300" />
                  <Shield className="h-4 w-4 text-blue-500" /> Safety
                </label>
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
