"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, GripVertical, BookOpen, Pencil, Trash2, ChevronDown, ChevronRight, FileText, Video, Link as LinkIcon } from "@/lib/icons"
import { ActionMenu } from "@/components/ui/action-menu"
import { motion, AnimatePresence } from "motion/react"
import { toast } from "sonner"
import LoaderOne from "@/components/ui/loader-one"
import { CustomCheckbox } from "@/components/ui/custom-checkbox"

interface Lesson {
  id: string
  title: string
  content: string | null
  videoUrl: string | null
  externalUrl: string | null
  type: string
  order: number
}

interface LearningModule {
  id: string
  title: string
  category?: string | null
  subject?: string | null
  imageUrl?: string | null
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

const subjectColors: Record<string, string> = {
  COLLEGE_PREP: "bg-purple-100 text-purple-700",
  SCHOLARSHIP: "bg-blue-100 text-blue-700",
}

const subjectLabels: Record<string, string> = {
  COLLEGE_PREP: "College Prep",
  SCHOLARSHIP: "Scholarship",
}

const lessonTypeIcons: Record<string, React.ReactNode> = {
  TEXT: <FileText className="size-3" />,
  VIDEO: <Video className="size-3" />,
  LINK: <LinkIcon className="size-3" />,
}

const lessonTypeColors: Record<string, string> = {
  TEXT: "bg-muted text-foreground",
  VIDEO: "bg-rose-100 text-rose-700",
  LINK: "bg-sky-100 text-sky-700",
}

const selectClassName = "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export default function LearningPage() {
  const [modules, setModules] = React.useState<LearningModule[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showForm, setShowForm] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editForm, setEditForm] = React.useState({ title: "", description: "", category: "", isPublished: false })
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    category: "",
    subject: "COLLEGE_PREP",
    imageUrl: "",
    order: "",
    isPublished: false,
  })

  // Lesson management state
  const [expandedModuleId, setExpandedModuleId] = React.useState<string | null>(null)
  const [moduleLessons, setModuleLessons] = React.useState<Record<string, Lesson[]>>({})
  const [lessonForm, setLessonForm] = React.useState({ title: "", type: "TEXT", videoUrl: "", content: "", externalUrl: "" })
  const [showLessonForm, setShowLessonForm] = React.useState(false)
  const [editingLessonId, setEditingLessonId] = React.useState<string | null>(null)
  const [subjectFilter, setSubjectFilter] = React.useState("ALL")

  const loadModules = React.useCallback(() => {
    fetch("/api/learning")
      .then(res => res.json())
      .then(d => { setModules(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { toast.error("Failed to load modules"); setLoading(false) })
  }, [])

  React.useEffect(() => { loadModules() }, [loadModules])

  const loadLessons = async (moduleId: string) => {
    try {
      const res = await fetch(`/api/learning/${moduleId}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const lessons = Array.isArray(data.lessons) ? data.lessons : []
      setModuleLessons(prev => ({ ...prev, [moduleId]: lessons }))
    } catch {
      toast.error("Failed to load lessons")
    }
  }

  const handleToggleExpand = (moduleId: string) => {
    if (expandedModuleId === moduleId) {
      setExpandedModuleId(null)
      setShowLessonForm(false)
      setEditingLessonId(null)
    } else {
      setExpandedModuleId(moduleId)
      setShowLessonForm(false)
      setEditingLessonId(null)
      loadLessons(moduleId)
    }
  }

  const handleDeleteModule = async (id: string) => {
    try {
      const res = await fetch(`/api/learning/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Module deleted")
      if (expandedModuleId === id) setExpandedModuleId(null)
      loadModules()
    } catch {
      toast.error("Failed to delete module")
    }
  }

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
      setForm({ title: "", description: "", category: "", subject: "COLLEGE_PREP", imageUrl: "", order: "", isPublished: false })
      loadModules()
    } catch {
      toast.error("Failed to create module")
    }
  }

  const handleAddLesson = async (moduleId: string) => {
    if (!lessonForm.title.trim()) { toast.error("Lesson title is required"); return }
    try {
      const res = await fetch("/api/learning/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, ...lessonForm }),
      })
      if (!res.ok) throw new Error()
      toast.success("Lesson added")
      setLessonForm({ title: "", type: "TEXT", videoUrl: "", content: "", externalUrl: "" })
      setShowLessonForm(false)
      loadLessons(moduleId)
      loadModules()
    } catch {
      toast.error("Failed to add lesson")
    }
  }

  const handleUpdateLesson = async (lessonId: string, moduleId: string) => {
    if (!lessonForm.title.trim()) { toast.error("Lesson title is required"); return }
    try {
      const res = await fetch("/api/learning/lessons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lessonId, ...lessonForm }),
      })
      if (!res.ok) throw new Error()
      toast.success("Lesson updated")
      setEditingLessonId(null)
      setLessonForm({ title: "", type: "TEXT", videoUrl: "", content: "", externalUrl: "" })
      loadLessons(moduleId)
    } catch {
      toast.error("Failed to update lesson")
    }
  }

  const handleDeleteLesson = async (lessonId: string, moduleId: string) => {
    try {
      const res = await fetch("/api/learning/lessons", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lessonId }),
      })
      if (!res.ok) throw new Error()
      toast.success("Lesson deleted")
      loadLessons(moduleId)
      loadModules()
    } catch {
      toast.error("Failed to delete lesson")
    }
  }

  const filteredModules = subjectFilter === "ALL"
    ? modules
    : modules.filter(m => m.subject === subjectFilter)

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

      {/* Subject Filter */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-muted-foreground">Filter by subject:</label>
        <select
          value={subjectFilter}
          onChange={e => setSubjectFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="ALL">All Subjects</option>
          <option value="COLLEGE_PREP">College Prep</option>
          <option value="SCHOLARSHIP">Scholarship</option>
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Create Module</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-foreground mb-1">Title *</label>
              <Input required type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="h-9" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-foreground mb-1">Description</label>
              <Input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="h-9" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-foreground mb-1">Image URL</label>
              <Input type="text" value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))}
                className="h-9" placeholder="https://example.com/image.jpg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className={selectClassName}>
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
              <label className="block text-xs font-medium text-foreground mb-1">Subject</label>
              <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                className={selectClassName}>
                <option value="COLLEGE_PREP">College Prep</option>
                <option value="SCHOLARSHIP">Scholarship</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Order</label>
              <Input type="number" value={form.order} onChange={e => setForm(p => ({ ...p, order: e.target.value }))}
                className="h-9" />
            </div>
            <div className="flex items-center gap-2">
              <CustomCheckbox id="isPublished" checked={form.isPublished} onChange={e => setForm(p => ({ ...p, isPublished: e.target.checked }))}
                className="h-5 w-5" />
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
        <div className="flex items-center justify-center h-32"><LoaderOne /></div>
      ) : filteredModules.length === 0 ? (
        <p className="text-sm text-muted-foreground">No modules yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredModules.map((mod, index) => (
            <div key={mod.id}>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-shadow hover:shadow-sm cursor-pointer"
                onClick={() => handleToggleExpand(mod.id)}
              >
                <span className="text-muted-foreground">
                  {expandedModuleId === mod.id ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </span>
                <span className="cursor-grab text-muted-foreground hover:text-foreground" title="Drag to reorder" onClick={e => e.stopPropagation()}>
                  <GripVertical className="size-4" />
                </span>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-xs font-semibold text-secondary-foreground">
                  {mod.order}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-medium text-foreground">{mod.title}</h3>
                    {mod.category && (
                      <span className={`inline-flex h-4 items-center rounded-full px-1.5 text-[10px] font-medium ${categoryColors[mod.category] || "bg-muted text-muted-foreground"}`}>
                        {mod.category}
                      </span>
                    )}
                    {mod.subject && (
                      <span className={`inline-flex h-4 items-center rounded-full px-1.5 text-[10px] font-medium ${subjectColors[mod.subject] || "bg-muted text-muted-foreground"}`}>
                        {subjectLabels[mod.subject] || mod.subject}
                      </span>
                    )}
                    {mod.isPublished ? (
                      <span className="inline-flex h-4 items-center rounded-full bg-green-50 px-1.5 text-[10px] font-medium text-green-700 ring-1 ring-inset ring-green-300">
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex h-4 items-center rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground ring-1 ring-inset ring-gray-300">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{mod.description}</p>
                  {editingId === mod.id && (
                    <div className="mt-2 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <Input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} className="h-7 text-xs w-40" placeholder="Title" />
                      <Input value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} className="h-7 text-xs w-48" placeholder="Description" />
                      <Button size="xs" onClick={async () => {
                        try {
                          const res = await fetch(`/api/learning/${mod.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(editForm),
                          })
                          if (!res.ok) throw new Error()
                          toast.success("Module updated")
                          setEditingId(null)
                          loadModules()
                        } catch { toast.error("Failed to update") }
                      }}>Save</Button>
                      <Button size="xs" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <BookOpen className="size-3" /> {mod.lessons?.length || 0} lessons
                  </span>
                  <ActionMenu items={[
                    { label: "Edit", icon: <Pencil className="size-3.5" />, onClick: () => {
                      setEditingId(mod.id)
                      setEditForm({ title: mod.title, description: mod.description || "", category: mod.category || "", isPublished: mod.isPublished })
                    }},
                    { label: "Delete", icon: <Trash2 className="size-3.5" />, destructive: true, onClick: () => handleDeleteModule(mod.id) },
                  ]} />
                </div>
              </motion.div>

              {/* Expanded Lesson Section */}
              <AnimatePresence>
                {expandedModuleId === mod.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="ml-12 mr-2 mt-1 mb-2 rounded-lg border border-border bg-muted/50/50 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold text-secondary-foreground uppercase tracking-wide">Lessons</h4>
                        <Button size="xs" variant="outline" onClick={() => {
                          setShowLessonForm(true)
                          setEditingLessonId(null)
                          setLessonForm({ title: "", type: "TEXT", videoUrl: "", content: "", externalUrl: "" })
                        }}>
                          <Plus className="size-3" /> Add Lesson
                        </Button>
                      </div>

                      {/* Lesson List */}
                      {(!moduleLessons[mod.id] || moduleLessons[mod.id].length === 0) && !showLessonForm && (
                        <p className="text-xs text-muted-foreground py-2">No lessons yet. Click &quot;Add Lesson&quot; to create one.</p>
                      )}

                      {moduleLessons[mod.id]?.sort((a, b) => a.order - b.order).map(lesson => (
                        <div key={lesson.id}>
                          {editingLessonId === lesson.id ? (
                            <div className="rounded-lg border border-border bg-card p-3 mb-2">
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="col-span-2">
                                  <label className="block text-xs font-medium text-foreground mb-1">Title *</label>
                                  <Input value={lessonForm.title} onChange={e => setLessonForm(p => ({ ...p, title: e.target.value }))} className="h-8 text-xs" />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-foreground mb-1">Type</label>
                                  <select value={lessonForm.type} onChange={e => setLessonForm(p => ({ ...p, type: e.target.value }))}
                                    className="h-8 w-full rounded-lg border border-input bg-transparent px-3 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                                    <option value="TEXT">Text</option>
                                    <option value="VIDEO">Video</option>
                                    <option value="LINK">Link</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-foreground mb-1">Video URL</label>
                                  <Input value={lessonForm.videoUrl} onChange={e => setLessonForm(p => ({ ...p, videoUrl: e.target.value }))} className="h-8 text-xs" placeholder="https://..." />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-foreground mb-1">External URL</label>
                                  <Input value={lessonForm.externalUrl} onChange={e => setLessonForm(p => ({ ...p, externalUrl: e.target.value }))} className="h-8 text-xs" placeholder="https://..." />
                                </div>
                                <div className="col-span-2">
                                  <label className="block text-xs font-medium text-foreground mb-1">Content</label>
                                  <textarea value={lessonForm.content} onChange={e => setLessonForm(p => ({ ...p, content: e.target.value }))}
                                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 min-h-[60px] resize-y" />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="xs" onClick={() => handleUpdateLesson(lesson.id, mod.id)}>Save</Button>
                                <Button size="xs" variant="outline" onClick={() => { setEditingLessonId(null); setLessonForm({ title: "", type: "TEXT", videoUrl: "", content: "", externalUrl: "" }) }}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-card transition-colors mb-1">
                              <span className="flex size-5 shrink-0 items-center justify-center rounded bg-accent text-[9px] font-semibold text-secondary-foreground">
                                {lesson.order}
                              </span>
                              <span className="text-sm text-foreground flex-1">{lesson.title}</span>
                              <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${lessonTypeColors[lesson.type] || "bg-muted text-muted-foreground"}`}>
                                {lessonTypeIcons[lesson.type]} {lesson.type}
                              </span>
                              <ActionMenu items={[
                                { label: "Edit", icon: <Pencil className="size-3.5" />, onClick: () => {
                                  setEditingLessonId(lesson.id)
                                  setShowLessonForm(false)
                                  setLessonForm({
                                    title: lesson.title,
                                    type: lesson.type,
                                    videoUrl: lesson.videoUrl || "",
                                    content: lesson.content || "",
                                    externalUrl: lesson.externalUrl || "",
                                  })
                                }},
                                { label: "Delete", icon: <Trash2 className="size-3.5" />, destructive: true, onClick: () => handleDeleteLesson(lesson.id, mod.id) },
                              ]} />
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Add Lesson Form */}
                      {showLessonForm && !editingLessonId && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-lg border border-border bg-card p-3 mt-2"
                        >
                          <h5 className="text-xs font-semibold text-foreground mb-3">New Lesson</h5>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="col-span-2">
                              <label className="block text-xs font-medium text-foreground mb-1">Title *</label>
                              <Input value={lessonForm.title} onChange={e => setLessonForm(p => ({ ...p, title: e.target.value }))} className="h-8 text-xs" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-foreground mb-1">Type</label>
                              <select value={lessonForm.type} onChange={e => setLessonForm(p => ({ ...p, type: e.target.value }))}
                                className="h-8 w-full rounded-lg border border-input bg-transparent px-3 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                                <option value="TEXT">Text</option>
                                <option value="VIDEO">Video</option>
                                <option value="LINK">Link</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-foreground mb-1">Video URL</label>
                              <Input value={lessonForm.videoUrl} onChange={e => setLessonForm(p => ({ ...p, videoUrl: e.target.value }))} className="h-8 text-xs" placeholder="https://..." />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-foreground mb-1">External URL</label>
                              <Input value={lessonForm.externalUrl} onChange={e => setLessonForm(p => ({ ...p, externalUrl: e.target.value }))} className="h-8 text-xs" placeholder="https://..." />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs font-medium text-foreground mb-1">Content</label>
                              <textarea value={lessonForm.content} onChange={e => setLessonForm(p => ({ ...p, content: e.target.value }))}
                                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 min-h-[60px] resize-y" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="xs" onClick={() => handleAddLesson(mod.id)}>Add Lesson</Button>
                            <Button size="xs" variant="outline" onClick={() => { setShowLessonForm(false); setLessonForm({ title: "", type: "TEXT", videoUrl: "", content: "", externalUrl: "" }) }}>Cancel</Button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
