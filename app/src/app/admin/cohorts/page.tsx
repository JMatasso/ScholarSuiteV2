"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Users, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface CohortMember {
  id: string
  user: { id: string; name?: string | null; image?: string | null }
}

interface Cohort {
  id: string
  name: string
  color?: string | null
  description?: string | null
  createdAt: string
  members: CohortMember[]
}

const colorOptions = [
  { label: "Blue", value: "bg-blue-500" },
  { label: "Purple", value: "bg-purple-500" },
  { label: "Green", value: "bg-green-500" },
  { label: "Amber", value: "bg-amber-500" },
  { label: "Red", value: "bg-red-500" },
  { label: "Pink", value: "bg-pink-500" },
]

export default function CohortsPage() {
  const [cohorts, setCohorts] = React.useState<Cohort[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showForm, setShowForm] = React.useState(false)
  const [form, setForm] = React.useState({ name: "", description: "", color: "bg-blue-500" })

  const loadCohorts = React.useCallback(() => {
    fetch("/api/cohorts")
      .then(res => res.json())
      .then(d => { setCohorts(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { toast.error("Failed to load cohorts"); setLoading(false) })
  }, [])

  React.useEffect(() => { loadCohorts() }, [loadCohorts])

  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null)

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/cohorts/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Cohort deleted")
      loadCohorts()
    } catch {
      toast.error("Failed to delete cohort")
    }
    setOpenMenuId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/cohorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success("Cohort created")
      setShowForm(false)
      setForm({ name: "", description: "", color: "bg-blue-500" })
      loadCohorts()
    } catch {
      toast.error("Failed to create cohort")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cohorts"
        description="Organize students into groups for targeted communication and task assignment."
        actions={
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="size-3.5" /> Create Cohort
          </Button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl bg-white p-5 ring-1 ring-foreground/10">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Create Cohort</h3>
          <div className="flex flex-col gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Name *</label>
              <input required type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Description</label>
              <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Color</label>
              <div className="flex gap-2">
                {colorOptions.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, color: c.value }))}
                    className={`size-6 rounded-full ${c.value} ${form.color === c.value ? "ring-2 ring-offset-2 ring-foreground/50" : ""}`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">Create Cohort</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Loading cohorts...</div>
      ) : cohorts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No cohorts yet. Create one to get started.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {cohorts.map((cohort) => (
            <div key={cohort.id} className="rounded-xl bg-white p-5 ring-1 ring-foreground/10 transition-shadow hover:shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`size-3 rounded-full ${cohort.color || "bg-gray-400"}`} />
                  <h3 className="text-sm font-semibold text-foreground">{cohort.name}</h3>
                </div>
                <div className="relative">
                  <Button variant="ghost" size="icon-xs" onClick={() => setOpenMenuId(openMenuId === cohort.id ? null : cohort.id)}>
                    <MoreHorizontal className="size-3.5" />
                  </Button>
                  {openMenuId === cohort.id && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-lg border border-border bg-white py-1 shadow-lg">
                      <button
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-muted"
                        onClick={() => { toast.info("Edit cohort coming soon"); setOpenMenuId(null) }}
                      >
                        <Pencil className="size-3.5" /> Edit
                      </button>
                      <button
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-muted"
                        onClick={() => handleDelete(cohort.id)}
                      >
                        <Trash2 className="size-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{cohort.description || "No description"}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    {cohort.members.slice(0, 4).map((member) => {
                      const initials = (member.user.name || "?").substring(0, 2).toUpperCase()
                      return (
                        <Avatar key={member.id} size="sm" className="ring-2 ring-white">
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                      )
                    })}
                  </div>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="size-3" /> {cohort.members.length} members
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">Created {new Date(cohort.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
