"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  GraduationCap,
  Plus,
  Search,
  Star,
  Shield,
  Calendar,
  Trash2,
  Edit,
  Building2,
  CheckCircle2,
  Clock,
  Send,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { EmptyState } from "@/components/ui/empty-state"
import { StatCard } from "@/components/ui/stat-card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDate } from "@/lib/format"

/* ---------- types ---------- */

interface CollegeApp {
  id: string
  universityName: string
  applicationType: string
  status: string
  deadline: string | null
  cost: number | null
  isDream: boolean
  isSafety: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

const APP_TYPES = [
  { value: "REGULAR", label: "Regular Decision" },
  { value: "EARLY_DECISION", label: "Early Decision" },
  { value: "EARLY_ACTION", label: "Early Action" },
  { value: "ROLLING", label: "Rolling" },
]

const STATUSES = [
  { value: "RESEARCHING", label: "Researching" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "DENIED", label: "Denied" },
  { value: "WAITLISTED", label: "Waitlisted" },
  { value: "DEFERRED", label: "Deferred" },
]

const STATUS_COLORS: Record<string, string> = {
  RESEARCHING: "bg-blue-100 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-amber-100 text-amber-700 border-amber-200",
  SUBMITTED: "bg-purple-100 text-purple-700 border-purple-200",
  ACCEPTED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  DENIED: "bg-rose-100 text-rose-700 border-rose-200",
  WAITLISTED: "bg-amber-100 text-amber-700 border-amber-200",
  DEFERRED: "bg-gray-100 text-gray-600 border-gray-200",
}

const STATUS_ICONS: Record<string, typeof Search> = {
  RESEARCHING: Search,
  IN_PROGRESS: Clock,
  SUBMITTED: Send,
  ACCEPTED: CheckCircle2,
  DENIED: XCircle,
  WAITLISTED: Clock,
  DEFERRED: Clock,
}

const FILTER_TABS = [
  { value: "ALL", label: "All" },
  { value: "RESEARCHING", label: "Researching" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "DECIDED", label: "Decided" },
]

/* ---------- component ---------- */

export default function CollegesPage() {
  const [apps, setApps] = useState<CollegeApp[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<CollegeApp | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formName, setFormName] = useState("")
  const [formType, setFormType] = useState("REGULAR")
  const [formDeadline, setFormDeadline] = useState("")
  const [formDream, setFormDream] = useState(false)
  const [formSafety, setFormSafety] = useState(false)
  const [formNotes, setFormNotes] = useState("")

  const fetchApps = useCallback(async () => {
    try {
      const res = await fetch("/api/college-applications")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setApps(data)
    } catch {
      toast.error("Failed to load college applications")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApps()
  }, [fetchApps])

  function resetForm() {
    setFormName("")
    setFormType("REGULAR")
    setFormDeadline("")
    setFormDream(false)
    setFormSafety(false)
    setFormNotes("")
  }

  async function handleAdd() {
    if (!formName.trim()) {
      toast.error("University name is required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/college-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityName: formName,
          applicationType: formType,
          deadline: formDeadline || null,
          isDream: formDream,
          isSafety: formSafety,
          notes: formNotes || null,
        }),
      })
      if (!res.ok) throw new Error("Failed to create")
      const newApp = await res.json()
      setApps((prev) => [newApp, ...prev])
      setAddOpen(false)
      resetForm()
      toast.success(`${newApp.universityName} added to your list`)
    } catch {
      toast.error("Failed to add college")
    } finally {
      setSaving(false)
    }
  }

  function openEdit(app: CollegeApp) {
    setEditingApp(app)
    setFormName(app.universityName)
    setFormType(app.applicationType)
    setFormDeadline(app.deadline ? app.deadline.split("T")[0] : "")
    setFormDream(app.isDream)
    setFormSafety(app.isSafety)
    setFormNotes(app.notes || "")
    setEditOpen(true)
  }

  async function handleUpdate() {
    if (!editingApp) return
    setSaving(true)
    try {
      const res = await fetch(`/api/college-applications/${editingApp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityName: formName,
          applicationType: formType,
          status: editingApp.status,
          deadline: formDeadline || null,
          isDream: formDream,
          isSafety: formSafety,
          notes: formNotes || null,
        }),
      })
      if (!res.ok) throw new Error("Failed to update")
      const updated = await res.json()
      setApps((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
      setEditOpen(false)
      resetForm()
      setEditingApp(null)
      toast.success("College application updated")
    } catch {
      toast.error("Failed to update")
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(app: CollegeApp, newStatus: string) {
    try {
      const res = await fetch(`/api/college-applications/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      const updated = await res.json()
      setApps((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
      toast.success(`Status updated to ${STATUSES.find((s) => s.value === newStatus)?.label}`)
    } catch {
      toast.error("Failed to update status")
    }
  }

  async function handleDelete(app: CollegeApp) {
    try {
      const res = await fetch(`/api/college-applications/${app.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete")
      setApps((prev) => prev.filter((a) => a.id !== app.id))
      toast.success(`${app.universityName} removed`)
    } catch {
      toast.error("Failed to remove college")
    }
  }

  // Filtering
  const filtered = apps.filter((app) => {
    const matchesSearch = app.universityName
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false

    if (filter === "ALL") return true
    if (filter === "DECIDED")
      return ["ACCEPTED", "DENIED", "WAITLISTED", "DEFERRED"].includes(
        app.status
      )
    return app.status === filter
  })

  // Stats
  const totalTracked = apps.length
  const applied = apps.filter((a) =>
    ["SUBMITTED", "ACCEPTED", "DENIED", "WAITLISTED", "DEFERRED"].includes(
      a.status
    )
  ).length
  const accepted = apps.filter((a) => a.status === "ACCEPTED").length
  const waitlisted = apps.filter((a) => a.status === "WAITLISTED").length

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1E3A5F]">
            College Search
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track and manage your college applications in one place.
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger
            render={
              <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2" />
            }
          >
            <Plus className="h-4 w-4" />
            Add College
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add College</DialogTitle>
              <DialogDescription>
                Add a college to your tracking list.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  University Name *
                </label>
                <Input
                  placeholder="e.g. Stanford University"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Application Type
                </label>
                <Select value={formType} onValueChange={(v) => { if (v) setFormType(v) }}>
                  <SelectTrigger className="w-full">
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
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Deadline
                </label>
                <Input
                  type="date"
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={formDream}
                    onCheckedChange={setFormDream}
                  />
                  Dream School
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={formSafety}
                    onCheckedChange={setFormSafety}
                  />
                  Safety School
                </label>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Notes
                </label>
                <Textarea
                  placeholder="Any notes about this school..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAddOpen(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#2563EB] hover:bg-[#2563EB]/90"
                onClick={handleAdd}
                disabled={saving}
              >
                {saving ? "Adding..." : "Add College"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Tracked"
          value={totalTracked}
          icon={Building2}
          index={0}
        />
        <StatCard
          title="Applied"
          value={applied}
          icon={Send}
          index={1}
        />
        <StatCard
          title="Accepted"
          value={accepted}
          icon={CheckCircle2}
          index={2}
        />
        <StatCard
          title="Waitlisted"
          value={waitlisted}
          icon={Clock}
          index={3}
        />
      </div>

      {/* Search & filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search colleges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === tab.value
                  ? "bg-[#1E3A5F] text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* College cards grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <p className="text-sm">Loading...</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={
            apps.length === 0
              ? "No colleges tracked yet"
              : "No colleges match your filters"
          }
          description={
            apps.length === 0
              ? "Start building your college list by adding schools you're interested in."
              : "Try adjusting your search or filter criteria."
          }
          action={
            apps.length === 0 ? (
              <Button
                className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Your First College
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((app, i) => {
              const StatusIcon = STATUS_ICONS[app.status] || Search
              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    duration: 0.3,
                    delay: i * 0.05,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <Card className="hover:shadow-sm transition-shadow group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1E3A5F]/10 text-[#1E3A5F]">
                            <GraduationCap className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-sm truncate">
                              {app.universityName}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {APP_TYPES.find(
                                (t) => t.value === app.applicationType
                              )?.label || app.applicationType}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {app.isDream && (
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          )}
                          {app.isSafety && (
                            <Shield className="h-4 w-4 text-emerald-500" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Status + deadline */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                            STATUS_COLORS[app.status] || STATUS_COLORS.DEFERRED
                          }`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {STATUSES.find((s) => s.value === app.status)
                            ?.label || app.status}
                        </span>
                        {app.deadline && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(app.deadline)}
                          </span>
                        )}
                      </div>

                      {/* Notes preview */}
                      {app.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {app.notes}
                        </p>
                      )}

                      {/* Status update + actions */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                        <Select
                          value={app.status}
                          onValueChange={(val) => {
                            if (val) handleStatusChange(app, val)
                          }}
                        >
                          <SelectTrigger size="sm" className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEdit(app)}
                            className="text-muted-foreground hover:text-[#2563EB]"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(app)}
                            className="text-muted-foreground hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Edit dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) {
            resetForm()
            setEditingApp(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit College</DialogTitle>
            <DialogDescription>
              Update details for {editingApp?.universityName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                University Name *
              </label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Application Type
              </label>
              <Select value={formType} onValueChange={(v) => { if (v) setFormType(v) }}>
                <SelectTrigger className="w-full">
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
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Deadline
              </label>
              <Input
                type="date"
                value={formDeadline}
                onChange={(e) => setFormDeadline(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={formDream}
                  onCheckedChange={setFormDream}
                />
                Dream School
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={formSafety}
                  onCheckedChange={setFormSafety}
                />
                Safety School
              </label>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Notes
              </label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditOpen(false)
                resetForm()
                setEditingApp(null)
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#2563EB] hover:bg-[#2563EB]/90"
              onClick={handleUpdate}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
