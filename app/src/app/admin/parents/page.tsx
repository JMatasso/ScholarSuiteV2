"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  MoreHorizontal,
  Mail,
  Pencil,
  Trash2,
  Link2,
  X,
  Check,
  ChevronDown,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StudentOption {
  id: string
  name: string
  email: string
}

interface ParentUser {
  id: string
  name?: string | null
  email: string
  createdAt: string
  parentProfile?: { phone?: string | null; relationship?: string | null } | null
  linkedStudents?: Array<{
    student: { id: string; name?: string | null; email: string }
  }>
}

interface ParentRow {
  id: string
  name: string
  email: string
  phone: string
  relationship: string
  initials: string
  linkedStudents: { id: string; name: string; initials: string }[]
  lastActive: string
}

/* ------------------------------------------------------------------ */
/*  Multi-select student dropdown                                      */
/* ------------------------------------------------------------------ */

function StudentMultiSelect({
  students,
  selectedIds,
  onChange,
}: {
  students: StudentOption[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.email.toLowerCase().includes(query.toLowerCase())
  )

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    )
  }

  const selectedStudents = students.filter((s) => selectedIds.includes(s.id))

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        )}
      >
        <span className="truncate text-muted-foreground">
          {selectedIds.length === 0
            ? "Select students..."
            : `${selectedIds.length} student${selectedIds.length > 1 ? "s" : ""} selected`}
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search students..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-6 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                No students found.
              </p>
            ) : (
              filtered.map((s) => {
                const checked = selectedIds.includes(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggle(s.id)}
                    className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-muted"
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded border",
                        checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-transparent"
                      )}
                    >
                      {checked && <Check className="size-3" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {s.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {s.email}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Selected chips */}
      {selectedStudents.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedStudents.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
            >
              {s.name}
              <button
                type="button"
                onClick={() => toggle(s.id)}
                className="rounded-full p-0.5 hover:bg-foreground/10"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Edit Links mini-form                                               */
/* ------------------------------------------------------------------ */

function EditLinksDialog({
  parent,
  students,
  onClose,
  onSaved,
}: {
  parent: ParentRow
  students: StudentOption[]
  onClose: () => void
  onSaved: () => void
}) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>(
    parent.linkedStudents.map((s) => s.id)
  )
  const [saving, setSaving] = React.useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/parents/${parent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: selectedIds }),
      })
      if (!res.ok) throw new Error()
      toast.success("Student links updated")
      onSaved()
      onClose()
    } catch {
      toast.error("Failed to update student links")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Edit Student Links for {parent.name}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>
        <StudentMultiSelect
          students={students}
          selectedIds={selectedIds}
          onChange={setSelectedIds}
        />
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function ParentsPage() {
  const [parents, setParents] = React.useState<ParentRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [showAddForm, setShowAddForm] = React.useState(false)
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null)
  const [editLinksParent, setEditLinksParent] = React.useState<ParentRow | null>(null)

  // All students for linking
  const [allStudents, setAllStudents] = React.useState<StudentOption[]>([])

  // Add-parent form state
  const [newParent, setNewParent] = React.useState({
    name: "",
    email: "",
    phone: "",
    relationship: "",
    studentIds: [] as string[],
  })

  const mapParents = (data: ParentUser[]): ParentRow[] =>
    data.map((u) => ({
      id: u.id,
      name: u.name || u.email,
      email: u.email,
      phone: u.parentProfile?.phone || "\u2014",
      relationship: u.parentProfile?.relationship || "\u2014",
      initials: (u.name || u.email).substring(0, 2).toUpperCase(),
      linkedStudents: (u.linkedStudents || []).map((ls) => ({
        id: ls.student.id,
        name: ls.student.name || ls.student.email,
        initials: (ls.student.name || ls.student.email)
          .substring(0, 2)
          .toUpperCase(),
      })),
      lastActive: new Date(u.createdAt).toLocaleDateString(),
    }))

  const fetchParents = React.useCallback(() => {
    setLoading(true)
    fetch("/api/parents")
      .then((res) => res.json())
      .then((data: ParentUser[] | { error: string }) => {
        if (Array.isArray(data)) setParents(mapParents(data))
        setLoading(false)
      })
      .catch(() => {
        toast.error("Failed to load parents")
        setLoading(false)
      })
  }, [])

  React.useEffect(() => {
    fetchParents()

    // Load students for linking
    fetch("/api/students")
      .then((res) => res.json())
      .then(
        (
          data:
            | Array<{
                id: string
                name?: string | null
                email: string
              }>
            | { error: string }
        ) => {
          if (Array.isArray(data)) {
            setAllStudents(
              data.map((s) => ({
                id: s.id,
                name: s.name || s.email,
                email: s.email,
              }))
            )
          }
        }
      )
      .catch(() => {})
  }, [fetchParents])

  /* ---- Add parent ---- */

  const handleAddParent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/parents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newParent.name,
          email: newParent.email,
          phone: newParent.phone || undefined,
          relationship: newParent.relationship || undefined,
          studentIds: newParent.studentIds,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed")
      }
      toast.success("Parent added successfully")
      setShowAddForm(false)
      setNewParent({ name: "", email: "", phone: "", relationship: "", studentIds: [] })
      fetchParents()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add parent"
      toast.error(message)
    }
  }

  /* ---- Columns ---- */

  const columns: ColumnDef<ParentRow, unknown>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableHeader column={column}>Parent</SortableHeader>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback>{row.original.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <span className="block truncate text-sm font-medium text-foreground">
              {row.original.name}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {row.original.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.phone}
        </span>
      ),
    },
    {
      accessorKey: "relationship",
      header: "Relationship",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.relationship}</Badge>
      ),
    },
    {
      id: "linkedStudents",
      header: "Linked Students",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {row.original.linkedStudents.length === 0 ? (
            <span className="text-xs text-muted-foreground">None</span>
          ) : (
            row.original.linkedStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center gap-1.5 rounded-full bg-muted py-0.5 pl-0.5 pr-2"
              >
                <Avatar size="sm">
                  <AvatarFallback>{student.initials}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-foreground">
                  {student.name}
                </span>
              </div>
            ))
          )}
        </div>
      ),
    },
    {
      accessorKey: "lastActive",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.lastActive}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              window.location.href = `mailto:${row.original.email}`
            }}
          >
            <Mail className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setEditLinksParent(row.original)}
            title="Edit student links"
          >
            <Link2 className="size-3.5" />
          </Button>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() =>
                setOpenMenuId(
                  openMenuId === row.original.id ? null : row.original.id
                )
              }
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
            {openMenuId === row.original.id && (
              <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-lg border border-border bg-card py-1 shadow-lg">
                <button
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-muted"
                  onClick={() => {
                    toast.info("Edit parent coming soon")
                    setOpenMenuId(null)
                  }}
                >
                  <Pencil className="size-3.5" /> Edit
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-muted"
                  onClick={() => {
                    toast.info("Remove parent coming soon")
                    setOpenMenuId(null)
                  }}
                >
                  <Trash2 className="size-3.5" /> Remove
                </button>
              </div>
            )}
          </div>
        </div>
      ),
    },
  ]

  /* ---- Render ---- */

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Parents"
        description="Manage parent accounts and their linked students."
        actions={
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="size-3.5" /> Add Parent
          </Button>
        }
      />

      {/* Add Parent Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddParent}
          className="rounded-xl border border-border bg-card p-5"
        >
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Add Parent
          </h3>
          <div className="mb-4 grid grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">
                Name *
              </label>
              <input
                required
                type="text"
                value={newParent.name}
                onChange={(e) =>
                  setNewParent((p) => ({ ...p, name: e.target.value }))
                }
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            {/* Email */}
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">
                Email *
              </label>
              <input
                required
                type="email"
                value={newParent.email}
                onChange={(e) =>
                  setNewParent((p) => ({ ...p, email: e.target.value }))
                }
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            {/* Phone */}
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">
                Phone
              </label>
              <input
                type="text"
                value={newParent.phone}
                onChange={(e) =>
                  setNewParent((p) => ({ ...p, phone: e.target.value }))
                }
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            {/* Relationship */}
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">
                Relationship
              </label>
              <select
                value={newParent.relationship}
                onChange={(e) =>
                  setNewParent((p) => ({ ...p, relationship: e.target.value }))
                }
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">Select...</option>
                <option value="Mother">Mother</option>
                <option value="Father">Father</option>
                <option value="Guardian">Guardian</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {/* Student Linking */}
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-foreground">
                Link Students
              </label>
              <StudentMultiSelect
                students={allStudents}
                selectedIds={newParent.studentIds}
                onChange={(ids) =>
                  setNewParent((p) => ({ ...p, studentIds: ids }))
                }
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Add Parent
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="flex items-center gap-3">
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search parents..."
          className="w-72"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          Loading parents...
        </div>
      ) : parents.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No parent accounts found.
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={parents}
          searchKey="name"
          searchValue={search}
        />
      )}

      {/* Edit Links Dialog */}
      {editLinksParent && (
        <EditLinksDialog
          parent={editLinksParent}
          students={allStudents}
          onClose={() => setEditLinksParent(null)}
          onSaved={fetchParents}
        />
      )}
    </div>
  )
}
