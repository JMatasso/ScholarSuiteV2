"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { CheckCircle2, XCircle, Clock, Mail, School } from "@/lib/icons"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"

interface AccessRequest {
  id: string
  name: string
  email: string
  role: "STUDENT" | "PARENT"
  school: string | null
  phone: string | null
  message: string | null
  status: "PENDING" | "APPROVED" | "DENIED"
  createdAt: string
}

export default function AccessRequestsPage() {
  const [requests, setRequests] = React.useState<AccessRequest[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [actioningId, setActioningId] = React.useState<string | null>(null)

  const fetchRequests = React.useCallback(() => {
    setLoading(true)
    fetch("/api/access-requests")
      .then((res) => res.json())
      .then((data) => {
        setRequests(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => {
        toast.error("Failed to load access requests")
        setLoading(false)
      })
  }, [])

  React.useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleAction = async (id: string, action: "approve" | "deny") => {
    setActioningId(id)
    try {
      const res = await fetch(`/api/access-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")
      toast.success(
        action === "approve"
          ? "Request approved — invite email sent!"
          : "Request denied."
      )
      fetchRequests()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to process request"
      )
    } finally {
      setActioningId(null)
    }
  }

  const pendingCount = requests.filter((r) => r.status === "PENDING").length

  const filtered = requests.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false
    return true
  })

  const columns: ColumnDef<AccessRequest, unknown>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableHeader column={column}>Name</SortableHeader>
      ),
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium text-foreground">
            {row.original.name}
          </p>
          <p className="text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.role === "STUDENT" ? "Student" : "Parent"}
        </Badge>
      ),
    },
    {
      id: "details",
      header: "Details",
      cell: ({ row }) => (
        <div className="space-y-0.5">
          {row.original.school && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <School className="size-3" />
              {row.original.school}
            </p>
          )}
          {row.original.phone && (
            <p className="text-xs text-muted-foreground">
              {row.original.phone}
            </p>
          )}
          {row.original.message && (
            <p className="text-xs text-muted-foreground italic truncate max-w-[200px]">
              &ldquo;{row.original.message}&rdquo;
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              status === "PENDING"
                ? "bg-amber-50 text-amber-700"
                : status === "APPROVED"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
            }`}
          >
            {status === "PENDING" && <Clock className="size-3" />}
            {status === "APPROVED" && <CheckCircle2 className="size-3" />}
            {status === "DENIED" && <XCircle className="size-3" />}
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </span>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column}>Requested</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        if (row.original.status !== "PENDING") return null
        const isActioning = actioningId === row.original.id
        return (
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              disabled={isActioning}
              onClick={() => handleAction(row.original.id, "approve")}
            >
              <CheckCircle2 className="size-3" />
              Approve
            </Button>
            <Button
              variant="outline"
              size="xs"
              disabled={isActioning}
              onClick={() => handleAction(row.original.id, "deny")}
            >
              <XCircle className="size-3" />
              Deny
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Access Requests"
        description={
          pendingCount > 0
            ? `${pendingCount} pending request${pendingCount !== 1 ? "s" : ""} awaiting review.`
            : "Review and approve account requests from students and parents."
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3">
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search requests..."
          className="w-72"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="DENIED">Denied</option>
        </select>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          Loading requests...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          {statusFilter ? "No requests match this filter." : "No access requests yet."}
        </div>
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
