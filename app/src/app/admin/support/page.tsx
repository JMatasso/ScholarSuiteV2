"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"

interface Ticket {
  id: string
  subject: string
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED"
  createdAt: string
  author: { name?: string | null; email: string }
  assignee?: { name?: string | null } | null
}

export default function SupportPage() {
  const [tickets, setTickets] = React.useState<Ticket[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [priorityFilter, setPriorityFilter] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [showForm, setShowForm] = React.useState(false)
  const [form, setForm] = React.useState({
    subject: "", description: "", category: "", priority: "MEDIUM"
  })

  const loadTickets = React.useCallback(() => {
    fetch("/api/support")
      .then(res => res.json())
      .then(d => { setTickets(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { toast.error("Failed to load tickets"); setLoading(false) })
  }, [])

  React.useEffect(() => { loadTickets() }, [loadTickets])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success("Ticket created")
      setShowForm(false)
      setForm({ subject: "", description: "", category: "", priority: "MEDIUM" })
      loadTickets()
    } catch {
      toast.error("Failed to create ticket")
    }
  }

  const filtered = tickets.filter(t => {
    const matchesPriority = !priorityFilter || t.priority === priorityFilter
    const matchesStatus = !statusFilter || t.status === statusFilter
    return matchesPriority && matchesStatus
  })

  const columns: ColumnDef<Ticket, unknown>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <span className="text-xs font-mono text-muted-foreground">{row.original.id.substring(0, 8)}</span>,
    },
    {
      accessorKey: "subject",
      header: ({ column }) => <SortableHeader column={column}>Subject</SortableHeader>,
      cell: ({ row }) => <span className="text-sm font-medium text-foreground">{row.original.subject}</span>,
    },
    {
      id: "author",
      header: "Author",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback>{(row.original.author.name || row.original.author.email).substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-foreground">{row.original.author.name || "Unknown"}</p>
            <p className="text-[11px] text-muted-foreground">{row.original.author.email}</p>
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
      id: "assignedTo",
      header: "Assigned To",
      cell: ({ row }) => (
        <span className={`text-sm ${!row.original.assignee ? "text-muted-foreground italic" : "text-foreground"}`}>
          {row.original.assignee?.name || "Unassigned"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column}>Created</SortableHeader>,
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</span>,
    },
    {
      id: "actions",
      cell: () => (
        <Button variant="ghost" size="icon-xs"><MoreHorizontal className="size-3.5" /></Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Support Tickets"
        description="Manage support requests from students and parents."
        actions={
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="size-3.5" /> Create Ticket
          </Button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl bg-white p-5 ring-1 ring-foreground/10">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Create Ticket</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-foreground mb-1">Subject *</label>
              <input required type="text" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-foreground mb-1">Description *</label>
              <textarea required value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-input bg-transparent p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Category</label>
              <input type="text" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">Create Ticket</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="flex items-center gap-3">
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search tickets..."
          className="w-72"
        />
        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All Priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Loading tickets...</div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          searchKey="subject"
          searchValue={search}
        />
      )}
    </div>
  )
}
