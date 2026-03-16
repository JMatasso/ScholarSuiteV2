"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  PenTool,
  Plus,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { formatDate } from "@/lib/format"

interface EssayVersion {
  id: string
  content: string
  version: number
}

interface EssayReview {
  id: string
  feedback: string | null
  createdAt: string
}

interface EssayPrompt {
  id: string
  text: string
  wordLimit: number | null
}

interface EssayApplication {
  id: string
  scholarship: {
    name: string
  }
}

interface Essay {
  id: string
  title: string
  content: string
  status: "DRAFT" | "UNDER_REVIEW" | "REVISION_NEEDED" | "APPROVED"
  updatedAt: string
  versions: EssayVersion[]
  reviews: EssayReview[]
  prompt: EssayPrompt | null
  application: EssayApplication | null
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Edit3 }> = {
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-700 border-gray-200", icon: Edit3 },
  UNDER_REVIEW: { label: "Under Review", color: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertCircle },
  REVISION_NEEDED: { label: "Revision Needed", color: "bg-rose-100 text-rose-700 border-rose-200", icon: AlertCircle },
  APPROVED: { label: "Approved", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

export default function EssaysPage() {
  const [essays, setEssays] = useState<Essay[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")
  const [editContent, setEditContent] = useState("")
  const [saving, setSaving] = useState(false)

  const handleNewEssay = async () => {
    if (!newTitle.trim()) { toast.error("Title is required"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/essays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, content: newContent }),
      })
      if (res.ok) {
        const essay = await res.json()
        setEssays((prev) => [...prev, essay])
        setSelectedId(essay.id)
        toast.success("Essay created!")
        setNewOpen(false)
        setNewTitle("")
        setNewContent("")
      } else { toast.error("Failed to create essay") }
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  const handleEditEssay = async () => {
    if (!selectedId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/essays/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      })
      if (res.ok) {
        setEssays((prev) => prev.map((e) => e.id === selectedId ? { ...e, content: editContent, updatedAt: new Date().toISOString() } : e))
        toast.success("Essay updated!")
        setEditOpen(false)
      } else { toast.error("Failed to update essay") }
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  useEffect(() => {
    fetch("/api/essays")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setEssays(list)
        if (list.length > 0) setSelectedId(list[0].id)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSubmitForReview = async (essay: Essay) => {
    const res = await fetch(`/api/essays/${essay.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "UNDER_REVIEW" }),
    })
    if (res.ok) {
      setEssays((prev) =>
        prev.map((e) => e.id === essay.id ? { ...e, status: "UNDER_REVIEW" } : e)
      )
      toast.success("Essay submitted for review")
    } else {
      toast.error("Failed to submit essay")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">Loading essays...</p>
      </div>
    )
  }

  const selected = essays.find((e) => e.id === selectedId) ?? essays[0] ?? null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1E3A5F]">Essays</h1>
          <p className="mt-1 text-muted-foreground">Write, review, and manage your scholarship essays.</p>
        </div>
        <Button className="gap-2 bg-[#2563EB] hover:bg-[#2563EB]/90" onClick={() => setNewOpen(true)}>
          <Plus className="h-4 w-4" />
          New Essay
        </Button>

        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Essay</DialogTitle>
              <DialogDescription>Start a new scholarship essay.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g., Personal Statement" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <textarea className="mt-1 w-full rounded-md border px-3 py-2 text-sm resize-none" rows={6} placeholder="Start writing your essay..." value={newContent} onChange={(e) => setNewContent(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
              <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90" onClick={handleNewEssay} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Essay
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Essay</DialogTitle>
              <DialogDescription>Edit your essay content below.</DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <textarea className="w-full rounded-md border px-3 py-2 text-sm resize-none" rows={12} value={editContent} onChange={(e) => setEditContent(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90" onClick={handleEditEssay} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {essays.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">No essays yet. Start writing your first essay.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Left panel - Essay list */}
          <div className="space-y-2">
            {essays.map((essay) => {
              const config = statusConfig[essay.status] ?? statusConfig.DRAFT
              const Icon = config.icon
              const wordCount = countWords(essay.content)
              const targetWords = essay.prompt?.wordLimit ?? 650
              return (
                <button
                  key={essay.id}
                  onClick={() => setSelectedId(essay.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedId === essay.id
                      ? "border-[#2563EB] bg-blue-50/50 ring-1 ring-[#2563EB]/20"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-tight">{essay.title}</p>
                    <Icon className={`h-4 w-4 shrink-0 ${
                      essay.status === "APPROVED" ? "text-emerald-600" :
                      essay.status === "UNDER_REVIEW" ? "text-amber-600" :
                      essay.status === "REVISION_NEEDED" ? "text-rose-600" : "text-gray-400"
                    }`} />
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{wordCount}/{targetWords} words</span>
                    <span>Edited {formatDate(essay.updatedAt)}</span>
                  </div>
                  <span className={`mt-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${config.color}`}>
                    {config.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Right panel - Essay preview */}
          {selected && (() => {
            const config = statusConfig[selected.status] ?? statusConfig.DRAFT
            const StatusIcon = config.icon
            const wordCount = countWords(selected.content)
            const targetWords = selected.prompt?.wordLimit ?? 650
            return (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>{selected.title}</CardTitle>
                      {selected.prompt && (
                        <p className="text-sm text-muted-foreground">{selected.prompt.text}</p>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      {wordCount} / {targetWords} words
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Last edited {formatDate(selected.updatedAt)}
                    </span>
                  </div>

                  {/* Word count progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        wordCount >= targetWords ? "bg-emerald-500" : "bg-[#2563EB]"
                      }`}
                      style={{ width: `${Math.min((wordCount / targetWords) * 100, 100)}%` }}
                    />
                  </div>

                  {/* Linked scholarship */}
                  {selected.application && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Linked Scholarship</p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
                          {selected.application.scholarship.name}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Essay content */}
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <div className="prose prose-sm max-w-none">
                      {selected.content ? (
                        selected.content.split("\n\n").map((paragraph, i) => (
                          <p key={i} className="text-sm leading-relaxed text-foreground/80 mb-3 last:mb-0">
                            {paragraph}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No content yet. Click Edit to start writing.</p>
                      )}
                    </div>
                  </div>

                  {/* Latest review feedback */}
                  {selected.reviews.length > 0 && selected.reviews[0].feedback && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/30 p-3">
                      <p className="text-xs font-medium text-amber-700 mb-1">Counselor Feedback</p>
                      <p className="text-sm text-muted-foreground">{selected.reviews[0].feedback}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button className="gap-2 bg-[#2563EB] hover:bg-[#2563EB]/90" onClick={() => { setEditContent(selected.content); setEditOpen(true) }}>
                      <PenTool className="h-4 w-4" />
                      Edit Essay
                    </Button>
                    {selected.status === "DRAFT" || selected.status === "REVISION_NEEDED" ? (
                      <Button variant="outline" onClick={() => handleSubmitForReview(selected)}>
                        Submit for Review
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )
          })()}
        </div>
      )}
    </div>
  )
}
