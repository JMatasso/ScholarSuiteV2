"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, MoreHorizontal, Mail } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"

interface Parent {
  id: string
  name: string
  email: string
  phone: string
  initials: string
  linkedStudents: { name: string; initials: string }[]
  lastActive: string
}

const parents: Parent[] = [
  { id: "1", name: "Wei Chen", email: "wei.chen@email.com", phone: "(555) 111-0001", initials: "WC", linkedStudents: [{ name: "Maya Chen", initials: "MC" }], lastActive: "2 hrs ago" },
  { id: "2", name: "Patricia Williams", email: "p.williams@email.com", phone: "(555) 111-0002", initials: "PW", linkedStudents: [{ name: "Jordan Williams", initials: "JW" }], lastActive: "1 day ago" },
  { id: "3", name: "Neha Patel", email: "neha.patel@email.com", phone: "(555) 111-0003", initials: "NP", linkedStudents: [{ name: "Aisha Patel", initials: "AP" }], lastActive: "3 hrs ago" },
  { id: "4", name: "Maria Rivera", email: "maria.r@email.com", phone: "(555) 111-0004", initials: "MR", linkedStudents: [{ name: "Carlos Rivera", initials: "CR" }], lastActive: "5 hrs ago" },
  { id: "5", name: "Raj Sharma", email: "raj.sharma@email.com", phone: "(555) 111-0005", initials: "RS", linkedStudents: [{ name: "Priya Sharma", initials: "PS" }], lastActive: "1 day ago" },
  { id: "6", name: "David Kim", email: "david.kim@email.com", phone: "(555) 111-0006", initials: "DK", linkedStudents: [{ name: "Ethan Kim", initials: "EK" }], lastActive: "3 days ago" },
  { id: "7", name: "Susan Thompson", email: "s.thompson@email.com", phone: "(555) 111-0007", initials: "ST", linkedStudents: [{ name: "Derek Thompson", initials: "DT" }], lastActive: "1 week ago" },
  { id: "8", name: "James Park", email: "james.park@email.com", phone: "(555) 111-0008", initials: "JP", linkedStudents: [{ name: "Lisa Park", initials: "LP" }], lastActive: "2 days ago" },
]

const columns: ColumnDef<Parent, unknown>[] = [
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
        {row.original.linkedStudents.map((student, i) => (
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
    header: "Last Active",
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

export default function ParentsPage() {
  const [search, setSearch] = React.useState("")

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

      <DataTable
        columns={columns}
        data={parents}
        searchKey="name"
        searchValue={search}
      />
    </div>
  )
}
