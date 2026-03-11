"use client"

import * as React from "react"
import Link from "next/link"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { StatusBadge } from "@/components/ui/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { Plus, Upload, MoreHorizontal, Mail, Eye, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"

type StudentStatus = "NEW" | "ACTIVE" | "AT_RISK" | "INACTIVE" | "GRADUATED"

interface Student {
  id: string
  name: string
  email: string
  role: string
  status?: StudentStatus
  school?: { name: string } | null
  studentProfile?: {
    status?: StudentStatus
    journeyStage?: string
    gradeLevel?: number
  } | null
}

const parseCSV = (text: string) => {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim())
    return headers.reduce((obj, header, i) => ({ ...obj, [header]: values[i] }), {} as Record<string, string>)
  })
}

export default function StudentsPage() {
  const [students, setStudents] = React.useState<Student[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [phaseFilter, setPhaseFilter] = React.useState("")
  const [selectedCount, setSelectedCount] = React.useState(0)
  const [showAddForm, setShowAddForm] = React.useState(false)
  const [newStudent, setNewStudent] = React.useState({ name: "", email: "", school: "", phone: "" })
  const csvInputRef = React.useRef<HTMLInputElement>(null)

  const loadStudents = React.useCallback(() => {
    setLoading(true)
    fetch("/api/students")
      .then(res => res.json())
      .then(d => { setStudents(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { toast.error("Failed to load students"); setLoading(false) })
  }, [])

  React.useEffect(() => { loadStudents() }, [loadStudents])

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent),
      })
      if (!res.ok) throw new Error()
      toast.success("Student added successfully")
      setShowAddForm(false)
      setNewStudent({ name: "", email: "", school: "", phone: "" })
      loadStudents()
    } catch {
      toast.error("Failed to add student")
    }
  }

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const rows = parseCSV(text)
    if (rows.length === 0) { toast.error("No data found in CSV"); return }
    try {
      const res = await fetch("/api/students/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows),
      })
      const result = await res.json()
      if (!res.ok) throw new Error()
      toast.success(`Imported ${result.created} student(s)`)
      if (result.errors?.length) toast.warning(`${result.errors.length} row(s) skipped`)
      loadStudents()
    } catch {
      toast.error("CSV import failed")
    }
    if (csvInputRef.current) csvInputRef.current.value = ""
  }

  const displayStudents = students.map(s => ({
    id: s.id,
    name: s.name || s.email,
    email: s.email,
    status: (s.studentProfile?.status || "NEW") as StudentStatus,
    school: s.school?.name || "—",
    journeyStage: s.studentProfile?.journeyStage || "—",
    phase: s.studentProfile?.gradeLevel ? `Grade ${s.studentProfile.gradeLevel}` : "—",
    initials: (s.name || s.email).substring(0, 2).toUpperCase(),
  }))

  const filtered = displayStudents.filter(s => {
    const matchesStatus = !statusFilter || s.status === statusFilter
    const matchesPhase = !phaseFilter || s.phase.toLowerCase().includes(phaseFilter)
    return matchesStatus && matchesPhase
  })

  const columns: ColumnDef<typeof filtered[0], unknown>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => { table.toggleAllPageRowsSelected(e.target.checked); setSelectedCount(e.target.checked ? filtered.length : 0) }}
          className="size-4 rounded border-input"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => { row.toggleSelected(e.target.checked); setSelectedCount(prev => e.target.checked ? prev + 1 : prev - 1) }}
          className="size-4 rounded border-input"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column}>Student</SortableHeader>,
      cell: ({ row }) => (
        <Link href={`/admin/students/${row.original.id}`} className="flex items-center gap-3 hover:underline">
          <Avatar size="sm">
            <AvatarFallback>{row.original.initials}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground">{row.original.name}</span>
        </Link>
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => <SortableHeader column={column}>Email</SortableHeader>,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "school",
      header: ({ column }) => <SortableHeader column={column}>School</SortableHeader>,
    },
    {
      accessorKey: "journeyStage",
      header: "Journey Stage",
    },
    {
      accessorKey: "phase",
      header: "Phase",
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Link href={`/admin/students/${row.original.id}`}>
            <Button variant="ghost" size="icon-xs"><Eye className="size-3.5" /></Button>
          </Link>
          <Button variant="ghost" size="icon-xs"><Mail className="size-3.5" /></Button>
          <Button variant="ghost" size="icon-xs"><MoreHorizontal className="size-3.5" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Students"
        description="Manage your student roster and track progress."
        actions={
          <>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCSVImport}
            />
            <Button variant="outline" size="sm" onClick={() => csvInputRef.current?.click()}>
              <Upload className="size-3.5" /> Import CSV
            </Button>
            <Button size="sm" onClick={() => setShowAddForm(true)}>
              <Plus className="size-3.5" /> Add Student
            </Button>
          </>
        }
      />

      {showAddForm && (
        <form onSubmit={handleAddStudent} className="rounded-xl bg-white p-5 ring-1 ring-foreground/10">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Add New Student</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Name</label>
              <input
                required
                type="text"
                value={newStudent.name}
                onChange={e => setNewStudent(p => ({ ...p, name: e.target.value }))}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Email</label>
              <input
                required
                type="email"
                value={newStudent.email}
                onChange={e => setNewStudent(p => ({ ...p, email: e.target.value }))}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">School</label>
              <input
                type="text"
                value={newStudent.school}
                onChange={e => setNewStudent(p => ({ ...p, school: e.target.value }))}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Phone</label>
              <input
                type="text"
                value={newStudent.phone}
                onChange={e => setNewStudent(p => ({ ...p, phone: e.target.value }))}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">Add Student</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search students..."
          className="w-72"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="NEW">New</option>
          <option value="AT_RISK">At Risk</option>
          <option value="INACTIVE">Inactive</option>
          <option value="GRADUATED">Graduated</option>
        </select>
        <select
          value={phaseFilter}
          onChange={e => setPhaseFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All Phases</option>
          <option value="sophomore">Sophomore Year</option>
          <option value="junior">Junior Year</option>
          <option value="senior">Senior Year</option>
          <option value="alumni">Alumni</option>
        </select>
      </div>

      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-[#1E3A5F]/5 p-3">
          <span className="text-sm font-medium text-[#1E3A5F]">{selectedCount} selected</span>
          <Button variant="outline" size="xs">Send Message</Button>
          <Button variant="outline" size="xs">Assign Task</Button>
          <Button variant="outline" size="xs">Export</Button>
          <Button variant="destructive" size="xs"><Trash2 className="size-3" /> Remove</Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Loading students...</div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          searchKey="name"
          searchValue={search}
        />
      )}
    </div>
  )
}
