"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select"
import { EditLinksDialog } from "@/components/ui/edit-links-dialog"
import {
  Plus,
  MoreHorizontal,
  Mail,
  Pencil,
  Trash2,
  Link2,
} from "lucide-react"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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
  const [allStudents, setAllStudents] = React.useState<MultiSelectOption[]>([])

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
            | Array<{ id: string; name?: string | null; email: string }>
            | { error: string }
        ) => {
          if (Array.isArray(data)) {
            setAllStudents(
              data.map((s) => ({
                id: s.id,
                label: s.name || s.email,
                sublabel: s.email,
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
      const user = await res.json()

      // Send invite email
      try {
        await fetch("/api/invites/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        })
        toast.success("Parent added and invite email sent!")
      } catch {
        toast.success("Parent added, but invite email failed to send.")
      }

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
                    setEditLinksParent(row.original)
                    setOpenMenuId(null)
                  }}
                >
                  <Pencil className="size-3.5" /> Edit Links
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-muted"
                  onClick={async () => {
                    if (!confirm(`Remove ${row.original.name}? This cannot be undone.`)) { setOpenMenuId(null); return }
                    try {
                      const res = await fetch(`/api/parents/${row.original.id}`, { method: "DELETE" })
                      if (!res.ok) throw new Error()
                      toast.success("Parent removed")
                      fetchParents()
                    } catch { toast.error("Failed to remove parent") }
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
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">
                Name *
              </label>
              <Input
                required
                type="text"
                value={newParent.name}
                onChange={(e) =>
                  setNewParent((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">
                Email *
              </label>
              <Input
                required
                type="email"
                value={newParent.email}
                onChange={(e) =>
                  setNewParent((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">
                Phone
              </label>
              <Input
                type="text"
                value={newParent.phone}
                onChange={(e) =>
                  setNewParent((p) => ({ ...p, phone: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">
                Relationship
              </label>
              <select
                value={newParent.relationship}
                onChange={(e) =>
                  setNewParent((p) => ({ ...p, relationship: e.target.value }))
                }
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">Select...</option>
                <option value="Mother">Mother</option>
                <option value="Father">Father</option>
                <option value="Guardian">Guardian</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-foreground">
                Link Students
              </label>
              <MultiSelect
                options={allStudents}
                selectedIds={newParent.studentIds}
                onChange={(ids) =>
                  setNewParent((p) => ({ ...p, studentIds: ids }))
                }
                placeholder="Select students..."
                searchPlaceholder="Search students..."
                emptyMessage="No students found."
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
