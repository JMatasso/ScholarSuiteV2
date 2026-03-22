"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, FolderOpen, Users, Loader2, Send, UserCheck } from "@/lib/icons"
import LoaderOne from "@/components/ui/loader-one"
import { ActionMenu } from "@/components/ui/action-menu"
import { Tabs } from "@/components/ui/vercel-tabs"
import { toast } from "sonner"
import { DOCUMENT_FOLDERS, JOURNEY_STAGE_LABELS, JOURNEY_STAGE_TO_TASK_PHASES, JOURNEY_STAGES_ORDERED } from "@/lib/constants"

interface TemplateItem {
  id: string
  title: string
  description: string | null
  phase: string
  track: string
  priority: string
  order: number
  documentFolder: string | null
  requiresUpload: boolean
}

interface Template {
  id: string
  name: string
  items: TemplateItem[]
}

interface StudentOption {
  id: string
  name: string
  email: string
  journeyStage: string | null
}

const stageColors: Record<string, string> = {
  EARLY_EXPLORATION: "bg-blue-100 text-blue-700",
  ACTIVE_PREP: "bg-cyan-100 text-cyan-700",
  APPLICATION_PHASE: "bg-amber-100 text-amber-700",
  POST_ACCEPTANCE: "bg-emerald-100 text-emerald-700",
}

const phaseLabels: Record<string, string> = {
  INTRODUCTION: "Introduction",
  PHASE_1: "Phase 1",
  PHASE_2: "Phase 2",
  ONGOING: "Ongoing",
  FINAL: "Final",
}

const priorityColors: Record<string, string> = {
  HIGH: "bg-rose-100 text-rose-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-muted text-muted-foreground",
}

const trackLabels: Record<string, string> = {
  SCHOLARSHIP: "Scholarship",
  COLLEGE_PREP: "College Prep",
  COLLEGE_APP: "College App",
  FINANCIAL: "Financial",
  ACADEMIC: "Academic",
  GENERAL: "General",
}

const emptyForm = {
  title: "", description: "", phase: "INTRODUCTION", track: "SCHOLARSHIP",
  priority: "MEDIUM", documentFolder: "", requiresUpload: false,
}

export default function TemplatesPage() {
  const [template, setTemplate] = React.useState<Template | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [activeStage, setActiveStage] = React.useState<string>("EARLY_EXPLORATION")
  const [showForm, setShowForm] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<TemplateItem | null>(null)
  const [form, setForm] = React.useState(emptyForm)

  // Push controls
  const [pushing, setPushing] = React.useState(false)
  const [showPushDialog, setShowPushDialog] = React.useState(false)
  const [pushMode, setPushMode] = React.useState<"stage" | "selected" | "all">("stage")
  const [students, setStudents] = React.useState<StudentOption[]>([])
  const [selectedStudentIds, setSelectedStudentIds] = React.useState<string[]>([])
  const [studentSearch, setStudentSearch] = React.useState("")
  const [studentsLoaded, setStudentsLoaded] = React.useState(false)

  const stageTabs = JOURNEY_STAGES_ORDERED.map(stage => ({
    id: stage,
    label: JOURNEY_STAGE_LABELS[stage].shortLabel,
  }))

  const loadTemplate = React.useCallback(() => {
    fetch("/api/task-templates")
      .then(res => res.json())
      .then(d => { if (d && d.items) setTemplate(d); setLoading(false) })
      .catch(() => { toast.error("Failed to load template"); setLoading(false) })
  }, [])

  React.useEffect(() => { loadTemplate() }, [loadTemplate])

  // Load students when push dialog opens
  const loadStudents = React.useCallback(() => {
    if (studentsLoaded) return
    fetch("/api/students?minimal=true")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStudents(data.map((s: { id: string; name: string; email: string; studentProfile?: { journeyStage: string | null } }) => ({
            id: s.id,
            name: s.name,
            email: s.email,
            journeyStage: s.studentProfile?.journeyStage || null,
          })))
        }
        setStudentsLoaded(true)
      })
      .catch(() => toast.error("Failed to load students"))
  }, [studentsLoaded])

  // Get items for the active journey stage
  const stagePhases = JOURNEY_STAGE_TO_TASK_PHASES[activeStage] || []
  const stageItems = React.useMemo(() => {
    if (!template) return []
    return template.items
      .filter(item => stagePhases.includes(item.phase))
      .sort((a, b) => a.order - b.order)
  }, [template, stagePhases])

  // Group by phase within stage
  const itemsByPhase = React.useMemo(() => {
    const grouped: Record<string, TemplateItem[]> = {}
    for (const item of stageItems) {
      if (!grouped[item.phase]) grouped[item.phase] = []
      grouped[item.phase].push(item)
    }
    return grouped
  }, [stageItems])

  // Students in the active stage
  const studentsInStage = React.useMemo(() => {
    return students.filter(s => s.journeyStage === activeStage)
  }, [students, activeStage])

  // Filtered students for search
  const filteredStudents = React.useMemo(() => {
    const q = studentSearch.toLowerCase()
    const base = pushMode === "stage" ? studentsInStage : students
    if (!q) return base
    return base.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
  }, [students, studentsInStage, studentSearch, pushMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingItem) {
        const res = await fetch(`/api/task-templates/${editingItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, documentFolder: form.documentFolder || null }),
        })
        if (!res.ok) throw new Error()
        toast.success("Template item updated")
      } else {
        const res = await fetch("/api/task-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, documentFolder: form.documentFolder || null }),
        })
        if (!res.ok) throw new Error()
        toast.success("Template item added")
      }
      setShowForm(false)
      setEditingItem(null)
      setForm(emptyForm)
      loadTemplate()
    } catch {
      toast.error("Failed to save template item")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template item?")) return
    try {
      const res = await fetch(`/api/task-templates/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Item deleted")
      loadTemplate()
    } catch {
      toast.error("Failed to delete item")
    }
  }

  const handleEdit = (item: TemplateItem) => {
    setEditingItem(item)
    setForm({
      title: item.title,
      description: item.description || "",
      phase: item.phase,
      track: item.track,
      priority: item.priority,
      documentFolder: item.documentFolder || "",
      requiresUpload: item.requiresUpload,
    })
    setShowForm(true)
  }

  const openPushDialog = (mode: "stage" | "selected" | "all") => {
    setPushMode(mode)
    setSelectedStudentIds([])
    setStudentSearch("")
    setShowPushDialog(true)
    loadStudents()
  }

  const handlePush = async () => {
    setPushing(true)
    try {
      if (pushMode === "all") {
        const res = await fetch("/api/task-templates/assign", { method: "POST" })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        toast.success(`Pushed to ${data.studentsUpdated} students (${data.tasksCreated} new tasks)`)
        setShowPushDialog(false)
        setPushing(false)
        return
      }

      let body: Record<string, unknown> = { stage: activeStage }

      if (pushMode === "stage") {
        body = { stage: activeStage, allInStage: true }
      } else if (pushMode === "selected") {
        if (selectedStudentIds.length === 0) {
          toast.error("Select at least one student")
          setPushing(false)
          return
        }
        body = { stage: activeStage, studentIds: selectedStudentIds }
      }

      const res = await fetch("/api/task-templates/assign-phase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${data.tasksCreated} tasks pushed to ${data.studentsUpdated} students`)
      setShowPushDialog(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to push tasks")
    }
    setPushing(false)
  }

  const toggleStudent = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const stageLabel = JOURNEY_STAGE_LABELS[activeStage]?.label || activeStage

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Task Templates"
        description="Manage task lists per journey stage and push them to students on demand."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openPushDialog("all")}
              className="gap-2"
            >
              <Users className="size-3.5" />
              Push All to Everyone
            </Button>
            <Button size="sm" className="gap-2" onClick={() => {
              setEditingItem(null)
              const defaultPhase = stagePhases[0] || "INTRODUCTION"
              setForm({ ...emptyForm, phase: defaultPhase })
              setShowForm(true)
            }}>
              <Plus className="size-3.5" /> Add Task
            </Button>
          </div>
        }
      />

      {/* Journey Stage Tabs */}
      <div className="flex flex-col gap-4">
        <Tabs
          tabs={stageTabs}
          activeTab={activeStage}
          onTabChange={setActiveStage}
        />

        {/* Stage info bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${stageColors[activeStage] || "bg-muted text-muted-foreground"}`}>
              {stageLabel}
            </span>
            <span className="text-xs text-muted-foreground">
              {JOURNEY_STAGE_LABELS[activeStage]?.gradeRange} — {stageItems.length} tasks
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openPushDialog("stage")}
              className="gap-2"
            >
              <Send className="size-3.5" />
              Push to {JOURNEY_STAGE_LABELS[activeStage]?.shortLabel} Students
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openPushDialog("selected")}
              className="gap-2"
            >
              <UserCheck className="size-3.5" />
              Push to Selected
            </Button>
          </div>
        </div>
      </div>

      {/* Task list for active stage */}
      {loading ? (
        <div className="flex items-center justify-center h-32"><LoaderOne /></div>
      ) : stageItems.length === 0 ? (
        <div className="rounded-xl bg-card ring-1 ring-foreground/10 p-8 text-center">
          <p className="text-sm text-muted-foreground">No tasks for this stage yet.</p>
          <Button size="sm" className="mt-3 gap-2" onClick={() => {
            setEditingItem(null)
            const defaultPhase = stagePhases[0] || "INTRODUCTION"
            setForm({ ...emptyForm, phase: defaultPhase })
            setShowForm(true)
          }}>
            <Plus className="size-3.5" /> Add First Task
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {stagePhases.map(phase => {
            const items = itemsByPhase[phase]
            if (!items || items.length === 0) return null
            return (
              <div key={phase} className="rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${stageColors[activeStage]}`}>
                      {phaseLabels[phase] || phase}
                    </span>
                    <span className="text-xs text-muted-foreground">{items.length} tasks</span>
                  </div>
                </div>
                <div className="divide-y divide-border/30">
                  <AnimatePresence initial={false}>
                    {items.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.03 }}
                        className="flex items-center gap-4 px-5 py-3 hover:bg-muted/20 transition-colors"
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent text-xs font-semibold text-secondary-foreground">
                          {item.order}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{item.title}</p>
                            <span className={`inline-flex h-4 items-center rounded-full px-1.5 text-[10px] font-medium ${priorityColors[item.priority]}`}>
                              {item.priority}
                            </span>
                            <span className="inline-flex h-4 items-center rounded-full px-1.5 text-[10px] font-medium bg-muted text-muted-foreground">
                              {trackLabels[item.track] || item.track}
                            </span>
                            {item.documentFolder && (
                              <span className="inline-flex items-center gap-1 h-4 rounded-full px-1.5 text-[10px] font-medium bg-accent text-blue-600">
                                <FolderOpen className="size-2.5" />
                                {item.documentFolder}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
                          )}
                        </div>
                        <ActionMenu items={[
                          { label: "Edit", icon: <Pencil className="size-3.5" />, onClick: () => handleEdit(item) },
                          { label: "Delete", icon: <Trash2 className="size-3.5" />, destructive: true, onClick: () => handleDelete(item.id) },
                        ]} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Task Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingItem(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Template Task" : "Add Template Task"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Title *</label>
              <Input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Phase</label>
                <select value={form.phase} onChange={e => setForm(p => ({ ...p, phase: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                  <option value="INTRODUCTION">Introduction</option>
                  <option value="PHASE_1">Phase 1</option>
                  <option value="PHASE_2">Phase 2</option>
                  <option value="ONGOING">Ongoing</option>
                  <option value="FINAL">Final</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Track</label>
                <select value={form.track} onChange={e => setForm(p => ({ ...p, track: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                  {Object.entries(trackLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Priority</label>
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Linked Document Folder</label>
                <select value={form.documentFolder} onChange={e => setForm(p => ({ ...p, documentFolder: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                  <option value="">None</option>
                  {DOCUMENT_FOLDERS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2 pb-0.5">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requiresUpload}
                    onChange={e => setForm(p => ({ ...p, requiresUpload: e.target.checked }))}
                    className="rounded border-input"
                  />
                  Requires Upload
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingItem(null) }}>Cancel</Button>
              <Button type="submit">
                {editingItem ? "Save Changes" : "Add Task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Push Tasks Dialog */}
      <Dialog open={showPushDialog} onOpenChange={setShowPushDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {pushMode === "all"
                ? "Push All Template Tasks"
                : pushMode === "stage"
                  ? `Push ${stageLabel} Tasks`
                  : `Push ${stageLabel} Tasks to Selected Students`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {pushMode === "all" ? (
              <p className="text-sm text-muted-foreground">
                This will push <strong>all template tasks</strong> (across all stages) to <strong>every active student</strong>.
                Students who already have a task will be skipped (no duplicates).
              </p>
            ) : pushMode === "stage" ? (
              <p className="text-sm text-muted-foreground">
                This will push the <strong>{stageItems.length} tasks</strong> from {stageLabel} to{" "}
                <strong>{studentsInStage.length} students</strong> currently in this stage.
                Duplicates are automatically skipped.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Select students to receive the <strong>{stageItems.length} tasks</strong> from {stageLabel}.
                </p>
                <Input
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                />
                <div className="max-h-64 overflow-y-auto rounded-lg border border-border divide-y divide-border/50">
                  {filteredStudents.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-3">No students found.</p>
                  ) : filteredStudents.map(s => (
                    <label key={s.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/30 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(s.id)}
                        onChange={() => toggleStudent(s.id)}
                        className="rounded border-input"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                      </div>
                      {s.journeyStage && (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${stageColors[s.journeyStage] || "bg-muted text-muted-foreground"}`}>
                          {JOURNEY_STAGE_LABELS[s.journeyStage]?.shortLabel || s.journeyStage}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                {selectedStudentIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">{selectedStudentIds.length} student{selectedStudentIds.length > 1 ? "s" : ""} selected</p>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPushDialog(false)}>Cancel</Button>
            <Button onClick={handlePush} disabled={pushing} className="gap-2">
              {pushing ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              {pushing ? "Pushing..." : "Push Tasks"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
