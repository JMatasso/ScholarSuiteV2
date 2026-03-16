"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal, CheckSquare, Copy, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Task {
  id: string
  title: string
  status: string
  priority: string
  phase: string
  user?: { name?: string | null; email: string }
  dueDate?: string | null
  createdAt: string
  description?: string | null
  templateId?: string | null
}

export default function TemplatesPage() {
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showForm, setShowForm] = React.useState(false)
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    phase: "INTRODUCTION",
    track: "SCHOLARSHIP",
    priority: "MEDIUM",
    dueDate: "",
  })

  const loadTasks = React.useCallback(() => {
    fetch("/api/tasks")
      .then(res => res.json())
      .then(d => { setTasks(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { toast.error("Failed to load tasks"); setLoading(false) })
  }, [])

  React.useEffect(() => { loadTasks() }, [loadTasks])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          dueDate: form.dueDate || null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Task created")
      setShowForm(false)
      setForm({ title: "", description: "", phase: "INTRODUCTION", track: "SCHOLARSHIP", priority: "MEDIUM", dueDate: "" })
      loadTasks()
    } catch {
      toast.error("Failed to create task")
    }
  }

  const [openMenuPhase, setOpenMenuPhase] = React.useState<string | null>(null)

  // Group tasks by phase
  const tasksByPhase = tasks.reduce((acc, task) => {
    const phase = task.phase || "INTRODUCTION"
    if (!acc[phase]) acc[phase] = []
    acc[phase].push(task)
    return acc
  }, {} as Record<string, Task[]>)

  const phaseLabels: Record<string, string> = {
    INTRODUCTION: "Introduction",
    PHASE_1: "Phase 1",
    PHASE_2: "Phase 2",
    ONGOING: "Ongoing",
    FINAL: "Final",
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Task Templates"
        description="Create reusable task templates to assign to students."
        actions={
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="size-3.5" /> Create Template
          </Button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl bg-white p-5 ring-1 ring-foreground/10">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Create Task Template</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-foreground mb-1">Title *</label>
              <input required type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-foreground mb-1">Description</label>
              <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Phase</label>
              <select value={form.phase} onChange={e => setForm(p => ({ ...p, phase: e.target.value }))}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                <option value="INTRODUCTION">Introduction</option>
                <option value="PHASE_1">Phase 1</option>
                <option value="PHASE_2">Phase 2</option>
                <option value="ONGOING">Ongoing</option>
                <option value="FINAL">Final</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Track</label>
              <select value={form.track} onChange={e => setForm(p => ({ ...p, track: e.target.value }))}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                <option value="SCHOLARSHIP">Scholarship</option>
                <option value="COLLEGE_PREP">College Prep</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">Create Task</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tasks yet. Create one to get started.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(tasksByPhase).map(([phase, phaseTasks]) => (
            <div key={phase} className="rounded-xl bg-white p-5 ring-1 ring-foreground/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{phaseLabels[phase] || phase}</h3>
                  <span className="inline-flex h-5 items-center rounded-full bg-[#1E3A5F]/10 px-2 text-[11px] font-medium text-[#1E3A5F]">
                    {phaseTasks.length} tasks
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-xs" onClick={() => {
                    const taskNames = phaseTasks.map(t => t.title).join(", ")
                    navigator.clipboard.writeText(taskNames)
                    toast.success("Task names copied to clipboard")
                  }}><Copy className="size-3.5" /></Button>
                  <div className="relative">
                    <Button variant="ghost" size="icon-xs" onClick={() => setOpenMenuPhase(openMenuPhase === phase ? null : phase)}>
                      <MoreHorizontal className="size-3.5" />
                    </Button>
                    {openMenuPhase === phase && (
                      <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-lg border border-border bg-white py-1 shadow-lg">
                        <button className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-muted"
                          onClick={() => { toast.info("Edit phase coming soon"); setOpenMenuPhase(null) }}>
                          <Pencil className="size-3.5" /> Edit Phase
                        </button>
                        <button className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-muted"
                          onClick={() => { toast.info("Delete phase coming soon"); setOpenMenuPhase(null) }}>
                          <Trash2 className="size-3.5" /> Delete Phase
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {phaseTasks.map((task) => (
                  <span key={task.id} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                    <CheckSquare className="size-3" /> {task.title}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
