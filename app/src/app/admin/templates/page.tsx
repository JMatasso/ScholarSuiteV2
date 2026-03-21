"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, CheckSquare, Pencil, Trash2, FolderOpen, Users, Loader2 } from "lucide-react"
import LoaderOne from "@/components/ui/loader-one"
import { ActionMenu } from "@/components/ui/action-menu"
import { toast } from "sonner"
import { DOCUMENT_FOLDERS } from "@/lib/constants"

interface TemplateItem {
  id: string
  title: string
  description: string | null
  phase: string
  track: string
  priority: string
  order: number
  documentFolder: string | null
}

interface Template {
  id: string
  name: string
  items: TemplateItem[]
}

const phaseLabels: Record<string, string> = {
  INTRODUCTION: "Foundation (Intro)",
  PHASE_1: "Phase 1: Foundation",
  PHASE_2: "Phase 2: Testing & Prep",
  ONGOING: "Phase 3: Application Sprint",
  FINAL: "Phase 4: Transition",
}

const phaseColors: Record<string, string> = {
  INTRODUCTION: "bg-purple-100 text-purple-700",
  PHASE_1: "bg-blue-100 text-blue-700",
  PHASE_2: "bg-cyan-100 text-cyan-700",
  ONGOING: "bg-amber-100 text-amber-700",
  FINAL: "bg-emerald-100 text-emerald-700",
}

const priorityColors: Record<string, string> = {
  HIGH: "bg-rose-100 text-rose-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-gray-100 text-gray-600",
}

const emptyForm = {
  title: "", description: "", phase: "INTRODUCTION", track: "SCHOLARSHIP",
  priority: "MEDIUM", documentFolder: "",
}

export default function TemplatesPage() {
  const [template, setTemplate] = React.useState<Template | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [showForm, setShowForm] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<TemplateItem | null>(null)
  const [form, setForm] = React.useState(emptyForm)
  const [assigning, setAssigning] = React.useState(false)

  const loadTemplate = React.useCallback(() => {
    fetch("/api/task-templates")
      .then(res => res.json())
      .then(d => { if (d && d.items) setTemplate(d); setLoading(false) })
      .catch(() => { toast.error("Failed to load template"); setLoading(false) })
  }, [])

  React.useEffect(() => { loadTemplate() }, [loadTemplate])

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
    })
    setShowForm(true)
  }

  const handleAssignToAll = async () => {
    setAssigning(true)
    try {
      const res = await fetch("/api/task-templates/assign", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Pushed to ${data.studentsUpdated} students (${data.tasksCreated} new tasks created)`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign template")
    }
    setAssigning(false)
  }

  // Group items by phase
  const itemsByPhase = React.useMemo(() => {
    if (!template) return {}
    return template.items.reduce((acc, item) => {
      const phase = item.phase || "INTRODUCTION"
      if (!acc[phase]) acc[phase] = []
      acc[phase].push(item)
      return acc
    }, {} as Record<string, TemplateItem[]>)
  }, [template])

  const phaseOrder = ["INTRODUCTION", "PHASE_1", "PHASE_2", "ONGOING", "FINAL"]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Master Task Template"
        description="Manage the standard task list that auto-assigns to every new student."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAssignToAll}
              disabled={assigning}
              className="gap-2"
            >
              {assigning ? <Loader2 className="size-3.5 animate-spin" /> : <Users className="size-3.5" />}
              Push to All Students
            </Button>
            <Button size="sm" className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2" onClick={() => {
              setEditingItem(null)
              setForm(emptyForm)
              setShowForm(true)
            }}>
              <Plus className="size-3.5" /> Add Task
            </Button>
          </div>
        }
      />

      {/* Stats */}
      {template && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CheckSquare className="size-4" />
            {template.items.length} tasks in template
          </span>
          {Object.entries(itemsByPhase).map(([phase, items]) => (
            <span key={phase} className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${phaseColors[phase] || "bg-gray-100 text-gray-600"}`}>
              {phaseLabels[phase]}: {items.length}
            </span>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32"><LoaderOne /></div>
      ) : !template ? (
        <div className="text-sm text-muted-foreground">No template found. Click &quot;Add Task&quot; to start building one.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {phaseOrder.map((phase) => {
            const items = itemsByPhase[phase]
            if (!items || items.length === 0) return null
            return (
              <div key={phase} className="rounded-xl bg-white ring-1 ring-foreground/10 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${phaseColors[phase]}`}>
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
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#1E3A5F]/5 text-xs font-semibold text-[#1E3A5F]">
                          {item.order}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{item.title}</p>
                            <span className={`inline-flex h-4 items-center rounded-full px-1.5 text-[10px] font-medium ${priorityColors[item.priority]}`}>
                              {item.priority}
                            </span>
                            {item.documentFolder && (
                              <span className="inline-flex items-center gap-1 h-4 rounded-full px-1.5 text-[10px] font-medium bg-blue-50 text-blue-600">
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

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingItem(null) } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Template Task" : "Add Template Task"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Title *</label>
              <Input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Phase</label>
                <select value={form.phase} onChange={e => setForm(p => ({ ...p, phase: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                  <option value="INTRODUCTION">Introduction</option>
                  <option value="PHASE_1">Phase 1</option>
                  <option value="PHASE_2">Phase 2</option>
                  <option value="ONGOING">Ongoing</option>
                  <option value="FINAL">Final Tasks</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Priority</label>
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Linked Document Folder</label>
              <select value={form.documentFolder} onChange={e => setForm(p => ({ ...p, documentFolder: e.target.value }))}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                <option value="">None</option>
                {DOCUMENT_FOLDERS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">If set, students can upload documents to this folder directly from the task.</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingItem(null) }}>Cancel</Button>
              <Button type="submit" className="bg-[#2563EB] hover:bg-[#2563EB]/90">
                {editingItem ? "Save Changes" : "Add Task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
