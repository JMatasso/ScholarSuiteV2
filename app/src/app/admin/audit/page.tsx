"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { Shield } from "lucide-react"
import { toast } from "sonner"
import LoaderOne from "@/components/ui/loader-one"
import type { ColumnDef } from "@tanstack/react-table"

interface AuditEntry {
  id: string
  createdAt: string
  action: string
  resource: string
  resourceId?: string | null
  details?: string | null
  user?: { name?: string | null; email: string } | null
}

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

export default function AuditPage() {
  const [entries, setEntries] = React.useState<AuditEntry[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [actionFilter, setActionFilter] = React.useState("")
  const [resourceFilter, setResourceFilter] = React.useState("")

  React.useEffect(() => {
    fetch("/api/audit?limit=50")
      .then(res => res.json())
      .then(d => {
        setEntries(Array.isArray(d.logs) ? d.logs : [])
        setTotal(d.total || 0)
        setLoading(false)
      })
      .catch(() => { toast.error("Failed to load audit logs"); setLoading(false) })
  }, [])

  const filtered = entries.filter(e => {
    const matchesAction = !actionFilter || e.action === actionFilter
    const matchesResource = !resourceFilter || e.resource === resourceFilter
    return matchesAction && matchesResource
  })

  const columns: ColumnDef<AuditEntry, unknown>[] = [
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column}>Timestamp</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
          {new Date(row.original.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      id: "user",
      header: ({ column }) => <SortableHeader column={column}>User</SortableHeader>,
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium text-foreground">{row.original.user?.name || "System"}</p>
          <p className="text-[11px] text-muted-foreground">{row.original.user?.email || "—"}</p>
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
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.details || "—"}</span>,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit Log"
        description="Track all system activity and user actions."
        actions={
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="size-3.5" /> {total} entries
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
        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="UPLOAD">Upload</option>
          <option value="SUBMIT">Submit</option>
          <option value="LOGIN">Login</option>
          <option value="EXPORT">Export</option>
        </select>
        <select
          value={resourceFilter}
          onChange={e => setResourceFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All Resources</option>
          <option value="Student">Student</option>
          <option value="Scholarship">Scholarship</option>
          <option value="Application">Application</option>
          <option value="Document">Document</option>
          <option value="Essay">Essay</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><LoaderOne /></div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          searchKey="details"
          searchValue={search}
          pageSize={15}
        />
      )}
    </div>
  )
}
