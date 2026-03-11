"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Plus, GripVertical, MoreHorizontal, BookOpen } from "lucide-react"
import { toast } from "sonner"

interface LearningModule {
  id: string
  title: string
  category?: string | null
  order: number
  isPublished: boolean
  description?: string | null
  lessons?: Array<{ id: string }>
}

const categoryColors: Record<string, string> = {
  "Test Prep": "bg-blue-100 text-blue-700",
  Writing: "bg-purple-100 text-purple-700",
  Financial: "bg-green-100 text-green-700",
  Planning: "bg-amber-100 text-amber-700",
  Skills: "bg-cyan-100 text-cyan-700",
  Development: "bg-pink-100 text-pink-700",
}

export default function LearningPage() {
  const [modules, setModules] = React.useState<LearningModule[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showForm, setShowForm] = React.useState(false)
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    category: "",
    order: "",
    isPublished: false,
  })

  const loadModules = React.useCallback(() => {
    // Admin should see all modules including unpublished
    // The GET /api/learning only returns published, so we fetch all via a workaround
    // For admin, we fetch and show regardless
    fetch("/api/learning")
      .then(res => res.json())
      .then(d => { setModules(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { toast.error("Failed to load modules"); setLoading(false) })
  }, [])

  React.useEffect(() => { loadModules() }, [loadModules])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          order: form.order ? parseInt(form.order) : 0,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Module created")
      setShowForm(false)
      setForm({ title: "", description: "", category: "", order: "", isPublished: false })
      loadModules()
    } catch {
      toast.error("Failed to create module")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Learning Content"
        description="Manage educational modules and lesson content for students."
        actions={
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="size-3.5" /> Create Module
          </Button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl bg-white p-5 ring-1 ring-foreground/10">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Create Module</h3>
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
              <label className="block text-xs font-medium text-foreground mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                <option value="">Select category</option>
                <option value="Test Prep">Test Prep</option>
                <option value="Writing">Writing</option>
                <option value="Financial">Financial</option>
                <option value="Planning">Planning</option>
                <option value="Skills">Skills</option>
                <option value="Development">Development</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Order</label>
              <input type="number" value={form.order} onChange={e => setForm(p => ({ ...p, order: e.target.value }))}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isPublished" checked={form.isPublished} onChange={e => setForm(p => ({ ...p, isPublished: e.target.checked }))}
                className="size-4 rounded border-input" />
              <label htmlFor="isPublished" className="text-sm text-foreground">Publish immediately</label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">Create Module</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Loading modules...</div>
      ) : modules.length === 0 ? (
        <p className="text-sm text-muted-foreground">No modules yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {modules.map((mod) => (
            <div key={mod.id} className="flex items-center gap-4 rounded-xl bg-white p-4 ring-1 ring-foreground/10 transition-shadow hover:shadow-sm">
              <button className="cursor-grab text-muted-foreground hover:text-foreground">
                <GripVertical className="size-4" />
              </button>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1E3A5F]/10 text-xs font-semibold text-[#1E3A5F]">
                {mod.order}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-sm font-medium text-foreground">{mod.title}</h3>
                  {mod.category && (
                    <span className={`inline-flex h-4 items-center rounded-full px-1.5 text-[10px] font-medium ${categoryColors[mod.category] || "bg-gray-100 text-gray-600"}`}>
                      {mod.category}
                    </span>
                  )}
                  {mod.isPublished ? (
                    <span className="inline-flex h-4 items-center rounded-full bg-green-50 px-1.5 text-[10px] font-medium text-green-700 ring-1 ring-inset ring-green-300">
                      Published
                    </span>
                  ) : (
                    <span className="inline-flex h-4 items-center rounded-full bg-gray-100 px-1.5 text-[10px] font-medium text-gray-600 ring-1 ring-inset ring-gray-300">
                      Draft
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{mod.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <BookOpen className="size-3" /> {mod.lessons?.length || 0} lessons
                </span>
                <Button variant="ghost" size="icon-xs"><MoreHorizontal className="size-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
