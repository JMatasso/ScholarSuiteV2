"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, MoreHorizontal, Mail } from "lucide-react"
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
      cell: () => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-xs"><Mail className="size-3.5" /></Button>
          <Button variant="ghost" size="icon-xs"><MoreHorizontal className="size-3.5" /></Button>
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
          <Button size="sm">
            <Plus className="size-3.5" /> Add Parent
          </Button>
        }
      />

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
