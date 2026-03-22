"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import { Plus, Upload, ExternalLink, Pencil, Trash2, Globe, Loader2, Award, CalendarClock, DollarSign, CheckCircle } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import Link from "next/link"
import { ActionMenu } from "@/components/ui/action-menu"
import { ScholarshipUrlImportDialog } from "@/components/scholarship-url-import-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import LoaderOne from "@/components/ui/loader-one"
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
  lastScrapedAt?: string | null
  scrapeStatus?: string | null
  sourceUrl?: string | null
  applicationYear?: string | null
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
  const [editOpen, setEditOpen] = React.useState(false)
  const [editingScholarship, setEditingScholarship] = React.useState<Scholarship | null>(null)
  const [editForm, setEditForm] = React.useState({ name: "", provider: "", amount: "", deadline: "", url: "", isActive: true, tags: "" })
  const [editSaving, setEditSaving] = React.useState(false)

  const handleDeleteScholarship = async (id: string) => {
    try {
      const res = await fetch(`/api/scholarships/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Scholarship deleted")
      loadScholarships()
    } catch {
      toast.error("Failed to delete scholarship")
    }
  }

  const openEditDialog = (scholarship: Scholarship) => {
    setEditingScholarship(scholarship)
    setEditForm({
      name: scholarship.name,
      provider: scholarship.provider || "",
      amount: scholarship.amount != null ? String(scholarship.amount) : "",
      deadline: scholarship.deadline ? scholarship.deadline.slice(0, 10) : "",
      url: scholarship.url || "",
      isActive: scholarship.isActive,
      tags: scholarship.tags.map(t => t.name).join(", "),
    })
    setEditOpen(true)
  }

  const handleEditSave = async () => {
    if (!editingScholarship) return
    setEditSaving(true)
    try {
      const res = await fetch(`/api/scholarships/${editingScholarship.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          provider: editForm.provider || null,
          amount: editForm.amount ? parseFloat(editForm.amount) : null,
          deadline: editForm.deadline || null,
          url: editForm.url || null,
          isActive: editForm.isActive,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Scholarship updated")
      setEditOpen(false)
      loadScholarships()
    } catch {
      toast.error("Failed to update scholarship")
    } finally {
      setEditSaving(false)
    }
  }

  const loadScholarships = React.useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    params.set("limit", "10000")
    fetch(`/api/scholarships?${params}`)
      .then(res => res.json())
      .then(d => { setScholarships(d.scholarships || (Array.isArray(d) ? d : [])); setLoading(false) })
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

  const stats = React.useMemo(() => {
    const total = scholarships.length
    const active = scholarships.filter(s => s.isActive).length
    const withDeadline = scholarships.filter(s => s.deadline && new Date(s.deadline) > new Date()).length
    const totalAmount = scholarships.reduce((sum, s) => sum + (s.amount || 0), 0)
    return { total, active, withDeadline, totalAmount }
  }, [scholarships])

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
            : "bg-muted text-muted-foreground ring-1 ring-inset ring-gray-300"
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
      accessorKey: "lastScrapedAt",
      header: "Last Scraped",
      cell: ({ row }) => {
        const val = row.original.lastScrapedAt
        if (!val) return <span className="text-sm text-muted-foreground">Never</span>
        const diff = Date.now() - new Date(val).getTime()
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        let label: string
        if (days === 0) label = "Today"
        else if (days === 1) label = "1 day ago"
        else if (days < 30) label = `${days} days ago`
        else if (days < 365) label = `${Math.floor(days / 30)} mo ago`
        else label = `${Math.floor(days / 365)}y ago`
        return <span className="text-sm text-muted-foreground">{label}</span>
      },
    },
    {
      accessorKey: "scrapeStatus",
      header: "Scrape Status",
      cell: ({ row }) => {
        const status = row.original.scrapeStatus
        if (!status) return <span className="text-sm text-muted-foreground">&mdash;</span>
        const styles: Record<string, string> = {
          CURRENT: "bg-emerald-100 text-emerald-700 ring-emerald-300",
          NEEDS_REVIEW: "bg-amber-100 text-amber-700 ring-amber-300",
          EXPIRED: "bg-rose-100 text-rose-700 ring-rose-300",
          ERROR: "bg-red-100 text-red-700 ring-red-300",
        }
        return (
          <span className={`inline-flex h-5 items-center rounded-full px-2 text-xs font-medium ring-1 ring-inset ${styles[status] || "bg-muted text-muted-foreground ring-gray-300"}`}>
            {status.replace("_", " ")}
          </span>
        )
      },
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
          <ActionMenu items={[
            { label: "Edit", icon: <Pencil className="size-3.5" />, onClick: () => openEditDialog(row.original) },
            { label: "Delete", icon: <Trash2 className="size-3.5" />, destructive: true, onClick: () => handleDeleteScholarship(row.original.id) },
          ]} />
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
            <ScholarshipUrlImportDialog onImported={loadScholarships} />
            <Link href="/admin/scholarships/scraper">
              <Button variant="outline" size="sm" className="gap-2">
                <Globe className="h-3.5 w-3.5" /> Scraper
              </Button>
            </Link>
            <Button size="sm" onClick={() => setShowAddForm(true)}>
              <Plus className="size-3.5" /> Add Scholarship
            </Button>
          </>
        }
      />

      {!loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Scholarships" value={stats.total} icon={Award} index={0} />
          <StatCard title="Active" value={stats.active} description={`${stats.total - stats.active} inactive`} icon={CheckCircle} index={1} />
          <StatCard title="Open Deadlines" value={stats.withDeadline} description="with future deadlines" icon={CalendarClock} index={2} />
          <StatCard title="Total Value" value={`$${stats.totalAmount.toLocaleString()}`} description="combined award amounts" icon={DollarSign} index={3} />
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleAddScholarship} className="rounded-xl bg-card p-5 transform-gpu [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]">
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
        <div className="flex items-center justify-center h-32"><LoaderOne /></div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          searchKey="name"
          searchValue={search}
        />
      )}

      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditingScholarship(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Scholarship</DialogTitle>
            <DialogDescription>Update scholarship details below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Name *</label>
              <Input
                value={editForm.name}
                onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                className="h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Provider</label>
                <Input
                  value={editForm.provider}
                  onChange={e => setEditForm(p => ({ ...p, provider: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Amount ($)</label>
                <Input
                  type="number"
                  value={editForm.amount}
                  onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))}
                  className="h-9"
                  placeholder="e.g. 5000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Deadline</label>
                <Input
                  type="date"
                  value={editForm.deadline}
                  onChange={e => setEditForm(p => ({ ...p, deadline: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                <select
                  value={editForm.isActive ? "active" : "inactive"}
                  onChange={e => setEditForm(p => ({ ...p, isActive: e.target.value === "active" }))}
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">URL</label>
              <Input
                type="url"
                value={editForm.url}
                onChange={e => setEditForm(p => ({ ...p, url: e.target.value }))}
                className="h-9"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Tags</label>
              <Input
                value={editForm.tags}
                disabled
                className="h-9 bg-muted"
                placeholder="Tags are read-only"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Tags cannot be edited here.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleEditSave} disabled={editSaving || !editForm.name.trim()}>
              {editSaving && <Loader2 className="size-3.5 animate-spin mr-1" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
