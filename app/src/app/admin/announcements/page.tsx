"use client"

import * as React from "react"
import { motion } from "motion/react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Pin, Clock, Users, UserPlus, Shield } from "@/lib/icons"
import { toast } from "sonner"
import LoaderOne from "@/components/ui/loader-one"
import { CustomCheckbox } from "@/components/ui/custom-checkbox"

interface Announcement {
  id: string
  title: string
  content: string
  targetRole?: string | null
  isPinned: boolean
  isActive: boolean
  createdAt: string
  expiresAt?: string | null
}

const statusConfig: Record<string, { bg: string; text: string; icon?: React.ElementType }> = {
  Active: { bg: "bg-green-50 ring-green-300", text: "text-green-700" },
  Expired: { bg: "bg-muted ring-gray-300", text: "text-muted-foreground" },
  Pinned: { bg: "bg-accent ring-blue-300", text: "text-blue-700", icon: Pin },
}

const getTargetIcon = (role?: string | null) => {
  if (role === "STUDENT") return Users
  if (role === "PARENT") return UserPlus
  return Shield
}

const getStatusLabel = (ann: Announcement) => {
  if (ann.isPinned) return "Pinned"
  if (ann.expiresAt && new Date(ann.expiresAt) < new Date()) return "Expired"
  return "Active"
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showForm, setShowForm] = React.useState(false)
  const [form, setForm] = React.useState({
    title: "",
    content: "",
    targetRole: "",
    isPinned: false,
    expiresAt: "",
  })
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editForm, setEditForm] = React.useState({
    title: "",
    content: "",
    targetRole: "",
    isPinned: false,
    expiresAt: "",
  })

  const loadAnnouncements = React.useCallback(() => {
    fetch("/api/announcements")
      .then(res => res.json())
      .then(d => { setAnnouncements(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { toast.error("Failed to load announcements"); setLoading(false) })
  }, [])

  React.useEffect(() => { loadAnnouncements() }, [loadAnnouncements])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          targetRole: form.targetRole || null,
          isPinned: form.isPinned,
          expiresAt: form.expiresAt || null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Announcement created")
      setShowForm(false)
      setForm({ title: "", content: "", targetRole: "", isPinned: false, expiresAt: "" })
      loadAnnouncements()
    } catch {
      toast.error("Failed to create announcement")
    }
  }

  const handleEditStart = (ann: Announcement) => {
    setEditingId(ann.id)
    setEditForm({
      title: ann.title,
      content: ann.content,
      targetRole: ann.targetRole || "",
      isPinned: ann.isPinned,
      expiresAt: ann.expiresAt ? ann.expiresAt.substring(0, 10) : "",
    })
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    try {
      const res = await fetch(`/api/announcements/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          content: editForm.content,
          targetRole: editForm.targetRole || null,
          isPinned: editForm.isPinned,
          expiresAt: editForm.expiresAt || null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Announcement updated")
      setEditingId(null)
      loadAnnouncements()
    } catch {
      toast.error("Failed to update announcement")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Announcements"
        description="Create and manage announcements for students and parents."
        actions={
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="size-3.5" /> New Announcement
          </Button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
          <h3 className="mb-4 text-sm font-semibold text-foreground">New Announcement</h3>
          <div className="flex flex-col gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Title *</label>
              <Input
                required
                type="text"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="h-9"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Content *</label>
              <Textarea
                required
                value={form.content}
                onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Target Audience</label>
                <select
                  value={form.targetRole}
                  onChange={e => setForm(p => ({ ...p, targetRole: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">All Users</option>
                  <option value="STUDENT">Students</option>
                  <option value="PARENT">Parents</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Expires At</label>
                <Input
                  type="date"
                  value={form.expiresAt}
                  onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                  className="h-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CustomCheckbox
                id="isPinned"
                checked={form.isPinned}
                onChange={e => setForm(p => ({ ...p, isPinned: e.target.checked }))}
                className="h-5 w-5"
              />
              <label htmlFor="isPinned" className="text-sm text-foreground">Pin this announcement</label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">Create Announcement</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="flex items-center justify-center h-32"><LoaderOne /></div>
        ) : announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground">No announcements yet.</p>
        ) : announcements.map((ann, index) => {
          const statusLabel = getStatusLabel(ann)
          const sc = statusConfig[statusLabel]
          const TargetIcon = getTargetIcon(ann.targetRole)
          const targetRoleLabel = ann.targetRole === "STUDENT" ? "Students" : ann.targetRole === "PARENT" ? "Parents" : "All Users"
          return (
            <motion.div
              key={ann.id}
              className="rounded-xl bg-card p-5 ring-1 ring-foreground/10 transition-shadow hover:shadow-sm"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-foreground">{ann.title}</h3>
                    <span className={`inline-flex h-5 items-center gap-1 rounded-full px-2 text-xs font-medium ring-1 ring-inset ${sc.bg} ${sc.text}`}>
                      {sc.icon && <Pin className="size-3" />}
                      {statusLabel}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{ann.content}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TargetIcon className="size-3" /> {targetRoleLabel}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" /> {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleEditStart(ann)}>Edit</Button>
              </div>
              {editingId === ann.id && (
                <form onSubmit={handleEditSubmit} className="mt-4 border-t border-border/50 pt-4">
                  <div className="flex flex-col gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Title *</label>
                      <Input required type="text" value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                        className="h-9" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Content *</label>
                      <Textarea required value={editForm.content} onChange={e => setEditForm(p => ({ ...p, content: e.target.value }))} rows={2} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Target Audience</label>
                        <select value={editForm.targetRole} onChange={e => setEditForm(p => ({ ...p, targetRole: e.target.value }))}
                          className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                          <option value="">All Users</option>
                          <option value="STUDENT">Students</option>
                          <option value="PARENT">Parents</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Expires At</label>
                        <Input type="date" value={editForm.expiresAt} onChange={e => setEditForm(p => ({ ...p, expiresAt: e.target.value }))}
                          className="h-9" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CustomCheckbox checked={editForm.isPinned} onChange={e => setEditForm(p => ({ ...p, isPinned: e.target.checked }))} className="h-5 w-5" />
                      <label className="text-sm text-foreground">Pinned</label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">Save Changes</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </form>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
