"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ActionMenu } from "@/components/ui/action-menu"
import { Plus, Users, Pencil, Trash2, UserPlus, ListTodo, Megaphone, X, Search } from "lucide-react"
import { motion } from "motion/react"
import { toast } from "sonner"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CohortMember {
  id: string
  user: { id: string; name?: string | null; email?: string | null; image?: string | null }
}

interface Cohort {
  id: string
  name: string
  color?: string | null
  description?: string | null
  createdAt: string
  members: CohortMember[]
}

interface Student {
  id: string
  name: string | null
  email: string | null
  image?: string | null
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const colorOptions = [
  { label: "Blue", value: "bg-blue-500" },
  { label: "Purple", value: "bg-purple-500" },
  { label: "Green", value: "bg-green-500" },
  { label: "Amber", value: "bg-amber-500" },
  { label: "Red", value: "bg-red-500" },
  { label: "Pink", value: "bg-pink-500" },
]

const defaultForm = { name: "", description: "", color: "bg-blue-500" }

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getInitials(name?: string | null) {
  if (!name) return "?"
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CohortsPage() {
  const [cohorts, setCohorts] = React.useState<Cohort[]>([])
  const [loading, setLoading] = React.useState(true)

  // Expanded cohort
  const [expandedId, setExpandedId] = React.useState<string | null>(null)

  // Create / Edit dialog
  const [cohortDialogOpen, setCohortDialogOpen] = React.useState(false)
  const [editingCohort, setEditingCohort] = React.useState<Cohort | null>(null)
  const [form, setForm] = React.useState(defaultForm)
  const [saving, setSaving] = React.useState(false)

  // Add Members dialog
  const [membersDialogOpen, setMembersDialogOpen] = React.useState(false)
  const [membersCohort, setMembersCohort] = React.useState<Cohort | null>(null)
  const [allStudents, setAllStudents] = React.useState<Student[]>([])
  const [studentsLoading, setStudentsLoading] = React.useState(false)
  const [memberSearch, setMemberSearch] = React.useState("")
  const [selectedUserIds, setSelectedUserIds] = React.useState<Set<string>>(new Set())
  const [addingMembers, setAddingMembers] = React.useState(false)

  // Assign Task dialog
  const [taskDialogOpen, setTaskDialogOpen] = React.useState(false)
  const [taskCohort, setTaskCohort] = React.useState<Cohort | null>(null)
  const [taskForm, setTaskForm] = React.useState({ title: "", description: "", priority: "MEDIUM", dueDate: "" })
  const [assigningTask, setAssigningTask] = React.useState(false)

  // Announce dialog
  const [announceDialogOpen, setAnnounceDialogOpen] = React.useState(false)
  const [announceCohort, setAnnounceCohort] = React.useState<Cohort | null>(null)
  const [announceForm, setAnnounceForm] = React.useState({ title: "", content: "" })
  const [sending, setSending] = React.useState(false)

  /* ---------------------------------------------------------------- */
  /*  Data loading                                                     */
  /* ---------------------------------------------------------------- */

  const loadCohorts = React.useCallback(() => {
    fetch("/api/cohorts")
      .then((res) => res.json())
      .then((d) => {
        setCohorts(Array.isArray(d) ? d : [])
        setLoading(false)
      })
      .catch(() => {
        toast.error("Failed to load cohorts")
        setLoading(false)
      })
  }, [])

  React.useEffect(() => {
    loadCohorts()
  }, [loadCohorts])

  /* ---------------------------------------------------------------- */
  /*  Create / Edit cohort                                             */
  /* ---------------------------------------------------------------- */

  function openCreateDialog() {
    setEditingCohort(null)
    setForm(defaultForm)
    setCohortDialogOpen(true)
  }

  function openEditDialog(cohort: Cohort) {
    setEditingCohort(cohort)
    setForm({
      name: cohort.name,
      description: cohort.description || "",
      color: cohort.color || "bg-blue-500",
    })
    setCohortDialogOpen(true)
  }

  async function handleCohortSubmit() {
    if (!form.name.trim()) {
      toast.error("Name is required")
      return
    }
    setSaving(true)
    try {
      const isEdit = !!editingCohort
      const url = isEdit ? `/api/cohorts/${editingCohort!.id}` : "/api/cohorts"
      const method = isEdit ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success(isEdit ? "Cohort updated" : "Cohort created")
      setCohortDialogOpen(false)
      loadCohorts()
    } catch {
      toast.error(editingCohort ? "Failed to update cohort" : "Failed to create cohort")
    } finally {
      setSaving(false)
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Delete cohort                                                    */
  /* ---------------------------------------------------------------- */

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/cohorts/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Cohort deleted")
      if (expandedId === id) setExpandedId(null)
      loadCohorts()
    } catch {
      toast.error("Failed to delete cohort")
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Add Members                                                      */
  /* ---------------------------------------------------------------- */

  function openMembersDialog(cohort: Cohort) {
    setMembersCohort(cohort)
    setSelectedUserIds(new Set())
    setMemberSearch("")
    setMembersDialogOpen(true)
    setStudentsLoading(true)
    fetch("/api/students")
      .then((res) => res.json())
      .then((d) => {
        setAllStudents(Array.isArray(d) ? d : [])
        setStudentsLoading(false)
      })
      .catch(() => {
        toast.error("Failed to load students")
        setStudentsLoading(false)
      })
  }

  function toggleStudentSelection(userId: string) {
    setSelectedUserIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  async function handleAddMembers() {
    if (!membersCohort || selectedUserIds.size === 0) return
    setAddingMembers(true)
    try {
      const res = await fetch(`/api/cohorts/${membersCohort.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: Array.from(selectedUserIds) }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Added ${selectedUserIds.size} member(s)`)
      setMembersDialogOpen(false)
      loadCohorts()
    } catch {
      toast.error("Failed to add members")
    } finally {
      setAddingMembers(false)
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Remove Member                                                    */
  /* ---------------------------------------------------------------- */

  async function handleRemoveMember(cohortId: string, userId: string) {
    try {
      const res = await fetch(`/api/cohorts/${cohortId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) throw new Error()
      toast.success("Member removed")
      loadCohorts()
    } catch {
      toast.error("Failed to remove member")
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Assign Task                                                      */
  /* ---------------------------------------------------------------- */

  function openTaskDialog(cohort: Cohort) {
    setTaskCohort(cohort)
    setTaskForm({ title: "", description: "", priority: "MEDIUM", dueDate: "" })
    setTaskDialogOpen(true)
  }

  async function handleAssignTask() {
    if (!taskCohort || !taskForm.title.trim()) {
      toast.error("Title is required")
      return
    }
    setAssigningTask(true)
    try {
      const body: Record<string, string> = { title: taskForm.title, priority: taskForm.priority }
      if (taskForm.description) body.description = taskForm.description
      if (taskForm.dueDate) body.dueDate = taskForm.dueDate
      const res = await fetch(`/api/cohorts/${taskCohort.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      toast.success(`Task assigned to ${taskCohort.members.length} member(s)`)
      setTaskDialogOpen(false)
    } catch {
      toast.error("Failed to assign task")
    } finally {
      setAssigningTask(false)
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Send Announcement                                                */
  /* ---------------------------------------------------------------- */

  function openAnnounceDialog(cohort: Cohort) {
    setAnnounceCohort(cohort)
    setAnnounceForm({ title: "", content: "" })
    setAnnounceDialogOpen(true)
  }

  async function handleSendAnnouncement() {
    if (!announceCohort || !announceForm.title.trim() || !announceForm.content.trim()) {
      toast.error("Title and content are required")
      return
    }
    setSending(true)
    try {
      const res = await fetch(`/api/cohorts/${announceCohort.id}/announce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(announceForm),
      })
      if (!res.ok) throw new Error()
      toast.success(`Announcement sent to ${announceCohort.members.length} member(s)`)
      setAnnounceDialogOpen(false)
    } catch {
      toast.error("Failed to send announcement")
    } finally {
      setSending(false)
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Filtered students for member picker                              */
  /* ---------------------------------------------------------------- */

  const existingMemberIds = React.useMemo(() => {
    if (!membersCohort) return new Set<string>()
    return new Set(membersCohort.members.map((m) => m.user.id))
  }, [membersCohort])

  const filteredStudents = React.useMemo(() => {
    const q = memberSearch.toLowerCase()
    return allStudents.filter((s) => {
      if (existingMemberIds.has(s.id)) return false
      if (!q) return true
      return (s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q))
    })
  }, [allStudents, memberSearch, existingMemberIds])

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cohorts"
        description="Organize students into groups for targeted communication and task assignment."
        actions={
          <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2" size="sm" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" /> Create Cohort
          </Button>
        }
      />

      {/* Cohort grid */}
      {loading ? (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Loading cohorts...</div>
      ) : cohorts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No cohorts yet. Create one to get started.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cohorts.map((cohort, index) => {
            const isExpanded = expandedId === cohort.id
            return (
              <motion.div
                key={cohort.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col"
              >
                <Card
                  className="cursor-pointer hover:shadow-sm transition-shadow"
                  onClick={() => setExpandedId(isExpanded ? null : cohort.id)}
                >
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-3">
                      <span className={`size-3 rounded-full shrink-0 ${cohort.color || "bg-gray-400"}`} />
                      <CardTitle className="text-sm">{cohort.name}</CardTitle>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <ActionMenu
                        items={[
                          { label: "Edit", icon: <Pencil className="size-3.5" />, onClick: () => openEditDialog(cohort) },
                          { label: "Add Members", icon: <UserPlus className="size-3.5" />, onClick: () => openMembersDialog(cohort) },
                          { label: "Assign Task", icon: <ListTodo className="size-3.5" />, onClick: () => openTaskDialog(cohort) },
                          { label: "Send Announcement", icon: <Megaphone className="size-3.5" />, onClick: () => openAnnounceDialog(cohort) },
                          { label: "Delete", icon: <Trash2 className="size-3.5" />, destructive: true, onClick: () => handleDelete(cohort.id) },
                        ]}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{cohort.description || "No description"}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1.5">
                          {cohort.members.slice(0, 4).map((member) => (
                            <Avatar key={member.id} size="sm" className="ring-2 ring-white">
                              {member.user.image && <AvatarImage src={member.user.image} alt={member.user.name || "Member"} />}
                              <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                            </Avatar>
                          ))}
                          {cohort.members.length > 4 && (
                            <div className="flex size-6 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground ring-2 ring-white">
                              +{cohort.members.length - 4}
                            </div>
                          )}
                        </div>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="size-3" /> {cohort.members.length} members
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Created {new Date(cohort.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Expanded member list */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.25 }}
                    className="mt-2 rounded-xl bg-white ring-1 ring-foreground/10 p-4 overflow-hidden"
                  >
                    <h4 className="text-xs font-semibold text-[#1E3A5F] uppercase tracking-wide mb-3">
                      Members ({cohort.members.length})
                    </h4>
                    {cohort.members.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No members yet. Add students to this cohort.</p>
                    ) : (
                      <div className="space-y-2">
                        {cohort.members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar size="sm">
                                {member.user.image && <AvatarImage src={member.user.image} alt={member.user.name || "Member"} />}
                                <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{member.user.name || "Unknown"}</p>
                                {member.user.email && (
                                  <p className="text-xs text-muted-foreground">{member.user.email}</p>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="hover:text-rose-600"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveMember(cohort.id, member.user.id)
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/*  Create / Edit Cohort Dialog                                  */}
      {/* ------------------------------------------------------------ */}
      <Dialog open={cohortDialogOpen} onOpenChange={setCohortDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCohort ? "Edit Cohort" : "Create Cohort"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Name *</label>
              <Input
                placeholder="e.g. Spring 2026 Cohort"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Textarea
                placeholder="Brief description of this cohort..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Color</label>
              <div className="flex gap-2">
                {colorOptions.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, color: c.value }))}
                    className={`size-7 rounded-full ${c.value} transition-all ${
                      form.color === c.value ? "ring-2 ring-offset-2 ring-[#2563EB]" : "hover:scale-110"
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCohortDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90" onClick={handleCohortSubmit} disabled={saving}>
              {saving ? "Saving..." : editingCohort ? "Save Changes" : "Create Cohort"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------ */}
      {/*  Add Members Dialog                                           */}
      {/* ------------------------------------------------------------ */}
      <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Members to {membersCohort?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students by name or email..."
                className="pl-9"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1 rounded-lg border border-gray-200 p-2">
              {studentsLoading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Loading students...</p>
              ) : filteredStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {memberSearch ? "No matching students found" : "All students are already in this cohort"}
                </p>
              ) : (
                filteredStudents.map((student) => (
                  <label
                    key={student.id}
                    className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedUserIds.has(student.id)}
                      onCheckedChange={() => toggleStudentSelection(student.id)}
                    />
                    <Avatar size="sm">
                      {student.image && <AvatarImage src={student.image} alt={student.name || "Student"} />}
                      <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{student.name || "Unknown"}</p>
                      {student.email && (
                        <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>
            {selectedUserIds.size > 0 && (
              <p className="text-xs text-muted-foreground">{selectedUserIds.size} student(s) selected</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMembersDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2"
              onClick={handleAddMembers}
              disabled={addingMembers || selectedUserIds.size === 0}
            >
              <UserPlus className="h-4 w-4" />
              {addingMembers ? "Adding..." : `Add Selected (${selectedUserIds.size})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------ */}
      {/*  Assign Task Dialog                                           */}
      {/* ------------------------------------------------------------ */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Task to {taskCohort?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Title *</label>
              <Input
                placeholder="Task title"
                value={taskForm.title}
                onChange={(e) => setTaskForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Textarea
                placeholder="Optional description..."
                rows={3}
                value={taskForm.description}
                onChange={(e) => setTaskForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Priority</label>
                <Select value={taskForm.priority} onValueChange={(v) => setTaskForm((p) => ({ ...p, priority: v || "MEDIUM" }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Due Date</label>
                <Input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm((p) => ({ ...p, dueDate: e.target.value }))}
                />
              </div>
            </div>
            {taskCohort && (
              <p className="text-xs text-muted-foreground">
                This task will be assigned to all {taskCohort.members.length} member(s) in this cohort.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2"
              onClick={handleAssignTask}
              disabled={assigningTask}
            >
              <ListTodo className="h-4 w-4" />
              {assigningTask ? "Assigning..." : "Assign to All Members"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------ */}
      {/*  Send Announcement Dialog                                     */}
      {/* ------------------------------------------------------------ */}
      <Dialog open={announceDialogOpen} onOpenChange={setAnnounceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Announcement to {announceCohort?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Title *</label>
              <Input
                placeholder="Announcement title"
                value={announceForm.title}
                onChange={(e) => setAnnounceForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Content *</label>
              <Textarea
                placeholder="Write your announcement..."
                rows={5}
                value={announceForm.content}
                onChange={(e) => setAnnounceForm((p) => ({ ...p, content: e.target.value }))}
              />
            </div>
            {announceCohort && (
              <p className="text-xs text-muted-foreground">
                This announcement will be sent to all {announceCohort.members.length} member(s) in this cohort.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnounceDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2"
              onClick={handleSendAnnouncement}
              disabled={sending}
            >
              <Megaphone className="h-4 w-4" />
              {sending ? "Sending..." : "Send to All Members"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
