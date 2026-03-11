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
import type { ColumnDef } from "@tanstack/react-table"

type StudentStatus = "NEW" | "ACTIVE" | "AT_RISK" | "INACTIVE" | "GRADUATED"

interface Student {
  id: string
  name: string
  email: string
  status: StudentStatus
  school: string
  journeyStage: string
  phase: string
  initials: string
}

const students: Student[] = [
  { id: "1", name: "Maya Chen", email: "maya.chen@email.com", status: "ACTIVE", school: "Lincoln High School", journeyStage: "Application", phase: "Senior Year", initials: "MC" },
  { id: "2", name: "Jordan Williams", email: "jordan.w@email.com", status: "ACTIVE", school: "Roosevelt Academy", journeyStage: "Research", phase: "Junior Year", initials: "JW" },
  { id: "3", name: "Aisha Patel", email: "aisha.p@email.com", status: "NEW", school: "Westfield Prep", journeyStage: "Onboarding", phase: "Sophomore Year", initials: "AP" },
  { id: "4", name: "Carlos Rivera", email: "carlos.r@email.com", status: "AT_RISK", school: "Eastside High", journeyStage: "Application", phase: "Senior Year", initials: "CR" },
  { id: "5", name: "Priya Sharma", email: "priya.s@email.com", status: "ACTIVE", school: "Oak Park High", journeyStage: "Essay Writing", phase: "Senior Year", initials: "PS" },
  { id: "6", name: "Ethan Kim", email: "ethan.k@email.com", status: "GRADUATED", school: "Summit Academy", journeyStage: "Complete", phase: "Alumni", initials: "EK" },
  { id: "7", name: "Derek Thompson", email: "derek.t@email.com", status: "INACTIVE", school: "Valley High", journeyStage: "Paused", phase: "Junior Year", initials: "DT" },
  { id: "8", name: "Lisa Park", email: "lisa.p@email.com", status: "ACTIVE", school: "Riverside High", journeyStage: "Financial Aid", phase: "Senior Year", initials: "LP" },
  { id: "9", name: "Marcus Johnson", email: "marcus.j@email.com", status: "AT_RISK", school: "Central High", journeyStage: "Application", phase: "Senior Year", initials: "MJ" },
  { id: "10", name: "Sofia Rodriguez", email: "sofia.r@email.com", status: "NEW", school: "Heritage Academy", journeyStage: "Onboarding", phase: "Junior Year", initials: "SR" },
]

const columns: ColumnDef<Student, unknown>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
        className="size-4 rounded border-input"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={(e) => row.toggleSelected(e.target.checked)}
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

export default function StudentsPage() {
  const [search, setSearch] = React.useState("")
  const [selectedCount, setSelectedCount] = React.useState(0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Students"
        description="Manage your student roster and track progress."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Upload className="size-3.5" /> Import CSV
            </Button>
            <Button size="sm">
              <Plus className="size-3.5" /> Add Student
            </Button>
          </>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3">
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search students..."
          className="w-72"
        />
        <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="NEW">New</option>
          <option value="AT_RISK">At Risk</option>
          <option value="INACTIVE">Inactive</option>
          <option value="GRADUATED">Graduated</option>
        </select>
        <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
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

      <DataTable
        columns={columns}
        data={students}
        searchKey="name"
        searchValue={search}
      />
    </div>
  )
}
