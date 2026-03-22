"use client"

import * as React from "react"
import Link from "next/link"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { StatusBadge } from "@/components/ui/status-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import { SchoolAutocomplete } from "@/components/ui/school-autocomplete"
import { Plus, Upload, Mail, Eye, Trash2, Pencil } from "lucide-react"
import { ActionMenu } from "@/components/ui/action-menu"
import { toast } from "sonner"
import LoaderOne from "@/components/ui/loader-one"
import { useRouter } from "next/navigation"
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
    serviceTier?: string | null
    assignedAdmin?: { id: string; name: string | null; image: string | null } | null
  } | null
}

import { parseCSV } from "@/lib/csv-parser"
import { SERVICE_TIER_LABELS, JOURNEY_STAGE_LABELS } from "@/lib/constants"

export default function StudentsPage() {
  const [students, setStudents] = React.useState<Student[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [phaseFilter, setPhaseFilter] = React.useState("")
  const [tierFilter, setTierFilter] = React.useState<string>("ALL")
  const [selectedCount, setSelectedCount] = React.useState(0)
  const [showAddForm, setShowAddForm] = React.useState(false)
  const [newStudent, setNewStudent] = React.useState({ name: "", email: "", school: "", phone: "", tempPassword: "" })
  const csvInputRef = React.useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())

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
      const user = await res.json()

      if (newStudent.tempPassword) {
        // Temp password set — no invite email needed
        toast.success("Student added with temporary password. They will be prompted to change it on first login.")
      } else {
        // No temp password — send invite email
        try {
          await fetch("/api/invites/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id }),
          })
          toast.success("Student added and invite email sent!")
        } catch {
          toast.success("Student added, but invite email failed to send.")
        }
      }

      setShowAddForm(false)
      setNewStudent({ name: "", email: "", school: "", phone: "", tempPassword: "" })
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
    image: (s as Student & { image?: string | null }).image || null,
    status: (s.studentProfile?.status || "NEW") as StudentStatus,
    school: s.school?.name || "—",
    journeyStage: s.studentProfile?.journeyStage || "—",
    serviceTier: s.studentProfile?.serviceTier || null,
    assignedAdmin: s.studentProfile?.assignedAdmin || null,
    phase: s.studentProfile?.gradeLevel ? `Grade ${s.studentProfile.gradeLevel}` : "—",
    initials: (s.name || s.email).substring(0, 2).toUpperCase(),
  }))

  const filtered = displayStudents.filter(s => {
    const matchesStatus = !statusFilter || s.status === statusFilter
    const matchesPhase = !phaseFilter || s.phase.toLowerCase().includes(phaseFilter)
    const matchesTier = tierFilter === "ALL" || (tierFilter === "NONE" ? !s.serviceTier : s.serviceTier === tierFilter)
    return matchesStatus && matchesPhase && matchesTier
  })

  const columns: ColumnDef<typeof filtered[0], unknown>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => { table.toggleAllPageRowsSelected(e.target.checked); setSelectedCount(e.target.checked ? filtered.length : 0); setSelectedIds(e.target.checked ? new Set(filtered.map(s => s.id)) : new Set()) }}
          className="size-4 rounded border-input"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => { row.toggleSelected(e.target.checked); setSelectedCount(prev => e.target.checked ? prev + 1 : prev - 1); setSelectedIds(prev => { const next = new Set(prev); e.target.checked ? next.add(row.original.id) : next.delete(row.original.id); return next }) }}
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
            {row.original.image && <AvatarImage src={row.original.image} alt={row.original.name} />}
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
      cell: ({ row }) => {
        const stage = row.original.journeyStage
        return stage && stage !== "—" ? (JOURNEY_STAGE_LABELS[stage]?.shortLabel ?? stage) : "—"
      },
    },
    {
      accessorKey: "serviceTier",
      header: "Service Tier",
      cell: ({ row }) => {
        const tier = row.original.serviceTier
        return tier ? (
          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-accent text-blue-700">
            {SERVICE_TIER_LABELS[tier] ?? tier}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-muted text-muted-foreground">
            No Tier
          </span>
        )
      },
    },
    {
      id: "counselor",
      header: "Counselor",
      cell: ({ row }) => {
        const admin = row.original.assignedAdmin
        return admin ? (
          <div className="flex items-center gap-1.5">
            <div className="size-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-medium">
              {(admin.name || "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <span className="text-xs">{admin.name}</span>
          </div>
        ) : <span className="text-xs text-muted-foreground">—</span>
      },
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
          <Button variant="ghost" size="icon-xs" onClick={() => {
            window.location.href = `mailto:${row.original.email}`
          }}><Mail className="size-3.5" /></Button>
          <ActionMenu items={[
            { label: "View / Edit", icon: <Pencil className="size-3.5" />, onClick: () => router.push(`/admin/students/${row.original.id}`) },
            { label: "Remove", icon: <Trash2 className="size-3.5" />, destructive: true, onClick: async () => {
              if (!confirm(`Remove ${row.original.name}? This cannot be undone.`)) return
              try {
                const res = await fetch(`/api/students/${row.original.id}`, { method: "DELETE" })
                if (!res.ok) throw new Error()
                toast.success("Student removed")
                loadStudents()
              } catch { toast.error("Failed to remove student") }
            }},
          ]} />
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
        <form onSubmit={handleAddStudent} className="rounded-xl bg-card p-5 transform-gpu [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Add New Student</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Name</label>
              <Input
                required
                type="text"
                value={newStudent.name}
                onChange={e => setNewStudent(p => ({ ...p, name: e.target.value }))}
                className="h-9"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Email</label>
              <Input
                required
                type="email"
                value={newStudent.email}
                onChange={e => setNewStudent(p => ({ ...p, email: e.target.value }))}
                className="h-9"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">School</label>
              <SchoolAutocomplete
                value={newStudent.school}
                onValueChange={(val) => setNewStudent(p => ({ ...p, school: val }))}
                onSchoolSelect={(school) => setNewStudent(p => ({ ...p, school: school.name }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Phone</label>
              <Input
                type="text"
                value={newStudent.phone}
                onChange={e => setNewStudent(p => ({ ...p, phone: e.target.value }))}
                className="h-9"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-foreground mb-1">Temporary Password <span className="text-muted-foreground font-normal">(optional — leave blank to send invite email instead)</span></label>
              <Input
                type="text"
                value={newStudent.tempPassword}
                onChange={e => setNewStudent(p => ({ ...p, tempPassword: e.target.value }))}
                placeholder="e.g. Welcome123!"
                className="h-9"
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
        <select
          value={tierFilter}
          onChange={e => setTierFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="ALL">All Tiers</option>
          <option value="INTRODUCTORY">Introductory</option>
          <option value="FLAT_RATE">Flat Rate</option>
          <option value="ONGOING">Ongoing</option>
          <option value="NONE">No Tier</option>
        </select>
      </div>

      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-accent p-3">
          <span className="text-sm font-medium text-secondary-foreground">{selectedCount} selected</span>
          <Button variant="outline" size="xs" onClick={() => router.push("/admin/messages")}>Send Message</Button>
          <Button variant="outline" size="xs" onClick={() => toast.info("Navigate to Tasks to assign tasks to selected students")}>Assign Task</Button>
          <Button variant="outline" size="xs" onClick={() => {
            const csv = ["Name,Email,Status,School"].concat(
              filtered.filter(s => selectedIds.has(s.id)).map(s => `${s.name},${s.email},${s.status},${s.school}`)
            ).join("\n")
            const blob = new Blob([csv], { type: "text/csv" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url; a.download = "students-export.csv"; a.click()
            URL.revokeObjectURL(url)
            toast.success("Students exported")
          }}>Export</Button>
          <Button variant="destructive" size="xs" onClick={async () => {
            if (!confirm(`Remove ${selectedCount} student(s)? This cannot be undone.`)) return
            let removed = 0
            for (const id of selectedIds) {
              try {
                const res = await fetch(`/api/students/${id}`, { method: "DELETE" })
                if (res.ok) removed++
              } catch { /* skip */ }
            }
            toast.success(`Removed ${removed} student(s)`)
            setSelectedIds(new Set())
            setSelectedCount(0)
            loadStudents()
          }}><Trash2 className="size-3" /> Remove</Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32"><LoaderOne /></div>
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
