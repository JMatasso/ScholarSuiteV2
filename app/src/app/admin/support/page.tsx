"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, MoreHorizontal } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"

interface Ticket {
  id: string
  subject: string
  author: string
  authorInitials: string
  authorRole: string
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED"
  assignedTo: string
  createdDate: string
}

const tickets: Ticket[] = [
  { id: "T-001", subject: "Cannot upload transcript document", author: "Maya Chen", authorInitials: "MC", authorRole: "Student", priority: "HIGH", status: "OPEN", assignedTo: "Admin", createdDate: "Mar 10, 2026" },
  { id: "T-002", subject: "FAFSA link not working", author: "Carlos Rivera", authorInitials: "CR", authorRole: "Student", priority: "URGENT", status: "IN_PROGRESS", assignedTo: "Admin", createdDate: "Mar 9, 2026" },
  { id: "T-003", subject: "Unable to view scholarship details", author: "Wei Chen", authorInitials: "WC", authorRole: "Parent", priority: "MEDIUM", status: "OPEN", assignedTo: "Unassigned", createdDate: "Mar 8, 2026" },
  { id: "T-004", subject: "Password reset not received", author: "Aisha Patel", authorInitials: "AP", authorRole: "Student", priority: "LOW", status: "RESOLVED", assignedTo: "Admin", createdDate: "Mar 7, 2026" },
  { id: "T-005", subject: "Meeting calendar sync issue", author: "Raj Sharma", authorInitials: "RS", authorRole: "Parent", priority: "MEDIUM", status: "OPEN", assignedTo: "Unassigned", createdDate: "Mar 6, 2026" },
  { id: "T-006", subject: "Essay feedback not showing", author: "Jordan Williams", authorInitials: "JW", authorRole: "Student", priority: "HIGH", status: "IN_PROGRESS", assignedTo: "Admin", createdDate: "Mar 5, 2026" },
]

const columns: ColumnDef<Ticket, unknown>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <span className="text-xs font-mono text-muted-foreground">{row.original.id}</span>,
  },
  {
    accessorKey: "subject",
    header: ({ column }) => <SortableHeader column={column}>Subject</SortableHeader>,
    cell: ({ row }) => <span className="text-sm font-medium text-foreground">{row.original.subject}</span>,
  },
  {
    accessorKey: "author",
    header: "Author",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Avatar size="sm">
          <AvatarFallback>{row.original.authorInitials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium text-foreground">{row.original.author}</p>
          <p className="text-[11px] text-muted-foreground">{row.original.authorRole}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => <StatusBadge status={row.original.priority} />,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "assignedTo",
    header: "Assigned To",
    cell: ({ row }) => (
      <span className={`text-sm ${row.original.assignedTo === "Unassigned" ? "text-muted-foreground italic" : "text-foreground"}`}>
        {row.original.assignedTo}
      </span>
    ),
  },
  {
    accessorKey: "createdDate",
    header: ({ column }) => <SortableHeader column={column}>Created</SortableHeader>,
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.createdDate}</span>,
  },
  {
    id: "actions",
    cell: () => (
      <Button variant="ghost" size="icon-xs"><MoreHorizontal className="size-3.5" /></Button>
    ),
  },
]

export default function SupportPage() {
  const [search, setSearch] = React.useState("")

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Support Tickets"
        description="Manage support requests from students and parents."
        actions={
          <Button size="sm">
            <Plus className="size-3.5" /> Create Ticket
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search tickets..."
          className="w-72"
        />
        <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
          <option value="">All Priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={tickets}
        searchKey="subject"
        searchValue={search}
      />
    </div>
  )
}
