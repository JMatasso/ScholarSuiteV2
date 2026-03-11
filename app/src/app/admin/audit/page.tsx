"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { Shield } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"

interface AuditEntry {
  id: string
  timestamp: string
  user: string
  userRole: string
  action: string
  resource: string
  details: string
}

const auditEntries: AuditEntry[] = [
  { id: "1", timestamp: "Mar 11, 2026 09:42 AM", user: "Admin", userRole: "Consultant", action: "UPDATE", resource: "Student", details: "Updated Maya Chen status to ACTIVE" },
  { id: "2", timestamp: "Mar 11, 2026 09:30 AM", user: "Admin", userRole: "Consultant", action: "CREATE", resource: "Announcement", details: "Created announcement: FAFSA Deadline Reminder" },
  { id: "3", timestamp: "Mar 11, 2026 09:15 AM", user: "Maya Chen", userRole: "Student", action: "UPLOAD", resource: "Document", details: "Uploaded Official Transcript (PDF, 1.2MB)" },
  { id: "4", timestamp: "Mar 10, 2026 04:22 PM", user: "Admin", userRole: "Consultant", action: "CREATE", resource: "Scholarship", details: "Added Cameron Impact Scholarship to database" },
  { id: "5", timestamp: "Mar 10, 2026 03:45 PM", user: "Jordan Williams", userRole: "Student", action: "SUBMIT", resource: "Application", details: "Submitted National Merit Scholarship application" },
  { id: "6", timestamp: "Mar 10, 2026 02:10 PM", user: "Admin", userRole: "Consultant", action: "UPDATE", resource: "Task Template", details: "Modified Scholarship Application Checklist template" },
  { id: "7", timestamp: "Mar 10, 2026 11:30 AM", user: "Carlos Rivera", userRole: "Student", action: "LOGIN", resource: "Session", details: "Logged in from IP 192.168.1.45" },
  { id: "8", timestamp: "Mar 10, 2026 10:00 AM", user: "Admin", userRole: "Consultant", action: "DELETE", resource: "Note", details: "Deleted consultant note for Derek Thompson" },
  { id: "9", timestamp: "Mar 9, 2026 05:30 PM", user: "Wei Chen", userRole: "Parent", action: "VIEW", resource: "Report", details: "Viewed Maya Chen progress report" },
  { id: "10", timestamp: "Mar 9, 2026 04:15 PM", user: "Admin", userRole: "Consultant", action: "EXPORT", resource: "Data", details: "Exported student roster as CSV (127 records)" },
  { id: "11", timestamp: "Mar 9, 2026 02:00 PM", user: "Priya Sharma", userRole: "Student", action: "UPDATE", resource: "Profile", details: "Updated contact information and phone number" },
  { id: "12", timestamp: "Mar 9, 2026 11:45 AM", user: "Admin", userRole: "Consultant", action: "CREATE", resource: "Cohort", details: "Created cohort: STEM Scholars (15 members)" },
  { id: "13", timestamp: "Mar 8, 2026 03:20 PM", user: "Admin", userRole: "Consultant", action: "ASSIGN", resource: "Task", details: "Assigned Scholarship Application Checklist to Sofia Rodriguez" },
  { id: "14", timestamp: "Mar 8, 2026 01:00 PM", user: "Lisa Park", userRole: "Student", action: "SUBMIT", resource: "Essay", details: "Submitted personal statement draft for review" },
]

const actionColors: Record<string, string> = {
  CREATE: "bg-green-50 text-green-700",
  UPDATE: "bg-blue-50 text-blue-700",
  DELETE: "bg-red-50 text-red-700",
  UPLOAD: "bg-purple-50 text-purple-700",
  SUBMIT: "bg-amber-50 text-amber-700",
  LOGIN: "bg-gray-100 text-gray-700",
  VIEW: "bg-gray-100 text-gray-600",
  EXPORT: "bg-cyan-50 text-cyan-700",
  ASSIGN: "bg-indigo-50 text-indigo-700",
}

const columns: ColumnDef<AuditEntry, unknown>[] = [
  {
    accessorKey: "timestamp",
    header: ({ column }) => <SortableHeader column={column}>Timestamp</SortableHeader>,
    cell: ({ row }) => <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">{row.original.timestamp}</span>,
  },
  {
    accessorKey: "user",
    header: ({ column }) => <SortableHeader column={column}>User</SortableHeader>,
    cell: ({ row }) => (
      <div>
        <p className="text-sm font-medium text-foreground">{row.original.user}</p>
        <p className="text-[11px] text-muted-foreground">{row.original.userRole}</p>
      </div>
    ),
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => (
      <span className={`inline-flex h-5 items-center rounded-full px-2 text-xs font-medium ${actionColors[row.original.action] || "bg-gray-100 text-gray-600"}`}>
        {row.original.action}
      </span>
    ),
  },
  {
    accessorKey: "resource",
    header: "Resource",
    cell: ({ row }) => <span className="text-sm text-foreground">{row.original.resource}</span>,
  },
  {
    accessorKey: "details",
    header: "Details",
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.details}</span>,
  },
]

export default function AuditPage() {
  const [search, setSearch] = React.useState("")

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit Log"
        description="Track all system activity and user actions."
        actions={
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="size-3.5" /> {auditEntries.length} entries
          </div>
        }
      />

      <div className="flex items-center gap-3">
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search logs..."
          className="w-72"
        />
        <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
          <option value="">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="UPLOAD">Upload</option>
          <option value="SUBMIT">Submit</option>
          <option value="LOGIN">Login</option>
          <option value="EXPORT">Export</option>
        </select>
        <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
          <option value="">All Users</option>
          <option value="admin">Admin</option>
          <option value="students">Students</option>
          <option value="parents">Parents</option>
        </select>
        <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
          <option value="">All Resources</option>
          <option value="Student">Student</option>
          <option value="Scholarship">Scholarship</option>
          <option value="Application">Application</option>
          <option value="Document">Document</option>
          <option value="Essay">Essay</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={auditEntries}
        searchKey="details"
        searchValue={search}
        pageSize={15}
      />
    </div>
  )
}
