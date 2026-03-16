"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import { Plus, Upload, MoreHorizontal, ExternalLink, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"

interface ScholarshipTag {
  id: string
  name: string
}

interface Scholarship {
  id: string
  name: string
  provider?: string | null
  amount?: number | null
  deadline?: string | null
  isActive: boolean
  url?: string | null
  tags: ScholarshipTag[]
}

import { parseCSV } from "@/lib/csv-parser"

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = React.useState<Scholarship[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [amountFilter, setAmountFilter] = React.useState("")
  const [showAddForm, setShowAddForm] = React.useState(false)
  const [newScholarship, setNewScholarship] = React.useState({
    name: "", provider: "", amount: "", deadline: "", description: "", url: ""
  })
  const csvInputRef = React.useRef<HTMLInputElement>(null)
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null)

  const handleDeleteScholarship = async (id: string) => {
    try {
      const res = await fetch(`/api/scholarships/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Scholarship deleted")
      loadScholarships()
    } catch {
      toast.error("Failed to delete scholarship")
    }
    setOpenMenuId(null)
  }

  const loadScholarships = React.useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    fetch(`/api/scholarships?${params}`)
      .then(res => res.json())
      .then(d => { setScholarships(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { toast.error("Failed to load scholarships"); setLoading(false) })
  }, [search])

  React.useEffect(() => { loadScholarships() }, [loadScholarships])

  const handleAddScholarship = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/scholarships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newScholarship,
          amount: newScholarship.amount ? parseFloat(newScholarship.amount) : null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Scholarship added successfully")
      setShowAddForm(false)
      setNewScholarship({ name: "", provider: "", amount: "", deadline: "", description: "", url: "" })
      loadScholarships()
    } catch {
      toast.error("Failed to add scholarship")
    }
  }

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const rows = parseCSV(text)
    if (rows.length === 0) { toast.error("No data found in CSV"); return }
    try {
      const res = await fetch("/api/scholarships/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows),
      })
      const result = await res.json()
      if (!res.ok) throw new Error()
      toast.success(`Imported ${result.created} scholarship(s)`)
      loadScholarships()
    } catch {
      toast.error("CSV import failed")
    }
    if (csvInputRef.current) csvInputRef.current.value = ""
  }

  const filtered = scholarships.filter(s => {
    if (statusFilter === "active" && !s.isActive) return false
    if (statusFilter === "inactive" && s.isActive) return false
    if (amountFilter === "0-10000" && (s.amount || 0) >= 10000) return false
    if (amountFilter === "10000-25000" && ((s.amount || 0) < 10000 || (s.amount || 0) > 25000)) return false
    if (amountFilter === "25000+" && (s.amount || 0) < 25000) return false
    return true
  })

  const columns: ColumnDef<Scholarship, unknown>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column}>Scholarship</SortableHeader>,
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium text-foreground">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.provider || "—"}</p>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => <SortableHeader column={column}>Amount</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm font-medium text-foreground">
          {row.original.amount === 0 ? "Full Tuition" : row.original.amount ? `$${row.original.amount.toLocaleString()}` : "—"}
        </span>
      ),
    },
    {
      accessorKey: "deadline",
      header: ({ column }) => <SortableHeader column={column}>Deadline</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.deadline ? new Date(row.original.deadline).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <span className={`inline-flex h-5 items-center rounded-full px-2 text-xs font-medium ${
          row.original.isActive
            ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-300"
            : "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-300"
        }`}>
          {row.original.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      accessorKey: "tags",
      header: "Tags",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.tags.map((tag) => (
            <span key={tag.id} className="inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium bg-blue-100 text-blue-700">
              {tag.name}
            </span>
          ))}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {row.original.url ? (
            <a href={row.original.url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon-xs"><ExternalLink className="size-3.5" /></Button>
            </a>
          ) : (
            <Button variant="ghost" size="icon-xs" disabled><ExternalLink className="size-3.5" /></Button>
          )}
          <div className="relative">
            <Button variant="ghost" size="icon-xs" onClick={() => setOpenMenuId(openMenuId === row.original.id ? null : row.original.id)}>
              <MoreHorizontal className="size-3.5" />
            </Button>
            {openMenuId === row.original.id && (
              <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-lg border border-border bg-white py-1 shadow-lg">
                <button className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-muted"
                  onClick={() => { toast.info("Edit scholarship coming soon"); setOpenMenuId(null) }}>
                  <Pencil className="size-3.5" /> Edit
                </button>
                <button className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-muted"
                  onClick={() => handleDeleteScholarship(row.original.id)}>
                  <Trash2 className="size-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Scholarship Database"
        description="Manage and track scholarship opportunities for your students."
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
              <Plus className="size-3.5" /> Add Scholarship
            </Button>
          </>
        }
      />

      {showAddForm && (
        <form onSubmit={handleAddScholarship} className="rounded-xl bg-white p-5 ring-1 ring-foreground/10">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Add New Scholarship</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Name *</label>
              <Input
                required
                type="text"
                value={newScholarship.name}
                onChange={e => setNewScholarship(p => ({ ...p, name: e.target.value }))}
                className="h-9"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Provider</label>
              <Input
                type="text"
                value={newScholarship.provider}
                onChange={e => setNewScholarship(p => ({ ...p, provider: e.target.value }))}
                className="h-9"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Amount ($)</label>
              <Input
                type="number"
                value={newScholarship.amount}
                onChange={e => setNewScholarship(p => ({ ...p, amount: e.target.value }))}
                className="h-9"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Deadline</label>
              <Input
                type="date"
                value={newScholarship.deadline}
                onChange={e => setNewScholarship(p => ({ ...p, deadline: e.target.value }))}
                className="h-9"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">URL</label>
              <Input
                type="url"
                value={newScholarship.url}
                onChange={e => setNewScholarship(p => ({ ...p, url: e.target.value }))}
                className="h-9"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Description</label>
              <Input
                type="text"
                value={newScholarship.description}
                onChange={e => setNewScholarship(p => ({ ...p, description: e.target.value }))}
                className="h-9"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">Add Scholarship</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="flex items-center gap-3">
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search scholarships..."
          className="w-72"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={amountFilter}
          onChange={e => setAmountFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Any Amount</option>
          <option value="0-10000">Under $10,000</option>
          <option value="10000-25000">$10,000 - $25,000</option>
          <option value="25000+">$25,000+</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Loading scholarships...</div>
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
