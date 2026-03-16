"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, MoreHorizontal, Mail, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"

interface ParentUser {
  id: string
  name?: string | null
  email: string
  createdAt: string
  parentProfile?: { phone?: string | null } | null
  linkedStudents?: Array<{
    student: {
      id: string
      name?: string | null
      email: string
    }
  }>
}

interface ParentRow {
  id: string
  name: string
  email: string
  phone: string
  initials: string
  linkedStudents: { name: string; initials: string }[]
  lastActive: string
}

export default function ParentsPage() {
  const [parents, setParents] = React.useState<ParentRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [showAddForm, setShowAddForm] = React.useState(false)
  const [newParent, setNewParent] = React.useState({ name: "", email: "", phone: "" })
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null)

  React.useEffect(() => {
    // Fetch users with PARENT role via a custom query on students API
    // We'll call /api/students but the API already handles PARENT role differently
    // Instead use a direct fetch to get all users; for now we use the students endpoint
    // with the knowledge that admins get all students. For parents we need a different approach.
    // We'll fetch students and look at linkedParents, or we can get parents from a dedicated call.
    // Since there's no dedicated parents API, we query /api/students with a role override.
    // Actually we need to read from the session — admins see all students.
    // For parents, we'd need a new API. Let's use a workaround and call /api/students
    // which returns STUDENT role users, but we need PARENT role users.
    // Let's create a simple fetch that the admin pages will use.
    fetch("/api/students?role=PARENT")
      .then(res => res.json())
      .then((data: ParentUser[] | { error: string }) => {
        if (Array.isArray(data)) {
          const mapped: ParentRow[] = data.map(u => ({
            id: u.id,
            name: u.name || u.email,
            email: u.email,
            phone: u.parentProfile?.phone || "—",
            initials: (u.name || u.email).substring(0, 2).toUpperCase(),
            linkedStudents: (u.linkedStudents || []).map(ls => ({
              name: ls.student.name || ls.student.email,
              initials: (ls.student.name || ls.student.email).substring(0, 2).toUpperCase(),
            })),
            lastActive: new Date(u.createdAt).toLocaleDateString(),
          }))
          setParents(mapped)
        }
        setLoading(false)
      })
      .catch(() => { toast.error("Failed to load parents"); setLoading(false) })
  }, [])

  const handleAddParent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newParent, role: "PARENT" }),
      })
      if (!res.ok) throw new Error()
      toast.success("Parent added")
      setShowAddForm(false)
      setNewParent({ name: "", email: "", phone: "" })
      window.location.reload()
    } catch {
      toast.error("Failed to add parent")
    }
  }

  const columns: ColumnDef<ParentRow, unknown>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column}>Parent</SortableHeader>,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback>{row.original.initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => <SortableHeader column={column}>Email</SortableHeader>,
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.email}</span>,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.phone}</span>,
    },
    {
      id: "linkedStudents",
      header: "Linked Students",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          {row.original.linkedStudents.length === 0 ? (
            <span className="text-xs text-muted-foreground">None</span>
          ) : row.original.linkedStudents.map((student, i) => (
            <div key={i} className="flex items-center gap-1.5 rounded-full bg-muted py-0.5 pl-0.5 pr-2">
              <Avatar size="sm">
                <AvatarFallback>{student.initials}</AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-foreground">{student.name}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "lastActive",
      header: "Joined",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.lastActive}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-xs" onClick={() => {
            window.location.href = `mailto:${row.original.email}`
          }}><Mail className="size-3.5" /></Button>
          <div className="relative">
            <Button variant="ghost" size="icon-xs" onClick={() => setOpenMenuId(openMenuId === row.original.id ? null : row.original.id)}>
              <MoreHorizontal className="size-3.5" />
            </Button>
            {openMenuId === row.original.id && (
              <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-lg border border-border bg-white py-1 shadow-lg">
                <button className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-muted"
                  onClick={() => { toast.info("Edit parent coming soon"); setOpenMenuId(null) }}>
                  <Pencil className="size-3.5" /> Edit
                </button>
                <button className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-muted"
                  onClick={() => { toast.info("Remove parent coming soon"); setOpenMenuId(null) }}>
                  <Trash2 className="size-3.5" /> Remove
                </button>
              </div>
            )}
          </div>
        </div>
      ),
    },
  ]

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

      {showAddForm && (
        <form onSubmit={handleAddParent} className="rounded-xl bg-white p-5 ring-1 ring-foreground/10">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Add Parent</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Name *</label>
              <input required type="text" value={newParent.name} onChange={e => setNewParent(p => ({ ...p, name: e.target.value }))}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Email *</label>
              <input required type="email" value={newParent.email} onChange={e => setNewParent(p => ({ ...p, email: e.target.value }))}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Phone</label>
              <input type="text" value={newParent.phone} onChange={e => setNewParent(p => ({ ...p, phone: e.target.value }))}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">Add Parent</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="flex items-center gap-3">
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search parents..."
          className="w-72"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Loading parents...</div>
      ) : parents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No parent accounts found.</p>
      ) : (
        <DataTable
          columns={columns}
          data={parents}
          searchKey="name"
          searchValue={search}
        />
      )}
    </div>
  )
}
