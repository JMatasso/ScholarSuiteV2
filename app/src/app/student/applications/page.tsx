"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SearchInput } from "@/components/ui/search-input"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { GridList, GridListItem } from "@/components/ui/grid-list"
import { toast } from "sonner"
import { LearnMoreBanner } from "@/components/ui/learn-more-banner"
import {
  Plus,
  DollarSign,
  Calendar,
  ExternalLink,
  Trash2,
  ArrowUpDown,
  Loader2,
  CheckSquare,
  Square,
} from "@/lib/icons"
import { CustomCheckbox } from "@/components/ui/custom-checkbox"

interface Scholarship {
  id: string
  name: string
  provider: string | null
  amount: number | null
  deadline: string | null
  url: string | null
}

interface Application {
  id: string
  scholarshipId: string
  status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "AWARDED" | "DENIED"
  amountAwarded: number | null
  notes: string | null
  scholarship: Scholarship
  createdAt: string
  updatedAt: string
}

const statusConfig: Record<string, { label: string; color: string; dotColor: string }> = {
  NOT_STARTED: { label: "Not Started", color: "bg-muted text-foreground border-border", dotColor: "bg-muted-foreground" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-200", dotColor: "bg-accent0" },
  SUBMITTED: { label: "Submitted", color: "bg-amber-100 text-amber-700 border-amber-200", dotColor: "bg-amber-500" },
  AWARDED: { label: "Awarded", color: "bg-emerald-100 text-emerald-700 border-emerald-200", dotColor: "bg-emerald-500" },
  DENIED: { label: "Denied", color: "bg-rose-100 text-rose-700 border-rose-200", dotColor: "bg-rose-500" },
}

const statusOrder = ["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "AWARDED", "DENIED"]

function formatAmount(amount: number | null | undefined): string {
  if (!amount) return "—"
  return `$${amount.toLocaleString()}`
}

function formatDate(date: string | null): string {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [sortField, setSortField] = useState<"name" | "provider" | "amount" | "deadline" | "status">("deadline")
  const [sortAsc, setSortAsc] = useState(true)

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((a) => a.id)))
    }
  }

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedIds.size === 0) return
    setBulkUpdating(true)
    let success = 0
    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/applications/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        })
        if (res.ok) success++
      } catch {}
    }
    toast.success(`Updated ${success} application${success !== 1 ? "s" : ""} to ${statusConfig[newStatus]?.label}`)
    setSelectedIds(new Set())
    setBulkUpdating(false)
    loadApplications()
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Remove ${selectedIds.size} application${selectedIds.size !== 1 ? "s" : ""} from your list?`)) return
    setBulkUpdating(true)
    let success = 0
    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/applications/${id}`, { method: "DELETE" })
        if (res.ok) success++
      } catch {}
    }
    toast.success(`Removed ${success} application${success !== 1 ? "s" : ""}`)
    setSelectedIds(new Set())
    setBulkUpdating(false)
    loadApplications()
  }

  // Add application dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [availableScholarships, setAvailableScholarships] = useState<Scholarship[]>([])
  const [scholarshipSearch, setScholarshipSearch] = useState("")
  const [adding, setAdding] = useState(false)

  const loadApplications = () => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((data) => {
        setApplications(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadApplications() }, [])

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(!sortAsc)
    else { setSortField(field); setSortAsc(true) }
  }

  const filtered = useMemo(() => {
    let list = [...applications]

    // Search
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((a) =>
        a.scholarship.name.toLowerCase().includes(q) ||
        (a.scholarship.provider || "").toLowerCase().includes(q) ||
        (a.notes || "").toLowerCase().includes(q)
      )
    }

    // Status filter
    if (statusFilter !== "ALL") {
      list = list.filter((a) => a.status === statusFilter)
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case "name":
          cmp = a.scholarship.name.localeCompare(b.scholarship.name)
          break
        case "provider":
          cmp = (a.scholarship.provider || "").localeCompare(b.scholarship.provider || "")
          break
        case "amount":
          cmp = (a.scholarship.amount || 0) - (b.scholarship.amount || 0)
          break
        case "deadline": {
          const aDate = a.scholarship.deadline ? new Date(a.scholarship.deadline).getTime() : Infinity
          const bDate = b.scholarship.deadline ? new Date(b.scholarship.deadline).getTime() : Infinity
          cmp = aDate - bDate
          break
        }
        case "status":
          cmp = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
          break
      }
      return sortAsc ? cmp : -cmp
    })

    return list
  }, [applications, search, statusFilter, sortField, sortAsc])

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const status of statusOrder) counts[status] = 0
    for (const app of applications) counts[app.status] = (counts[app.status] || 0) + 1
    return counts
  }, [applications])

  // Add scholarship dialog
  const openAddDialog = () => {
    setAddDialogOpen(true)
    setScholarshipSearch("")
    fetch("/api/scholarships")
      .then((r) => r.json())
      .then((data) => setAvailableScholarships(Array.isArray(data) ? data : []))
      .catch(() => {})
  }

  const handleAddScholarship = async (scholarshipId: string) => {
    setAdding(true)
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scholarshipId }),
      })
      if (res.status === 409) {
        toast.error("Already in your list")
      } else if (!res.ok) {
        throw new Error()
      } else {
        toast.success("Scholarship added to your list")
        setAddDialogOpen(false)
        loadApplications()
      }
    } catch {
      toast.error("Failed to add scholarship")
    }
    setAdding(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from your list?`)) return
    try {
      const res = await fetch(`/api/applications/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Removed from list")
      setApplications((prev) => prev.filter((a) => a.id !== id))
    } catch {
      toast.error("Failed to remove")
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      setApplications((prev) =>
        prev.map((a) => a.id === id ? { ...a, status: newStatus as Application["status"] } : a)
      )
      toast.success(`Status updated to ${statusConfig[newStatus]?.label}`)
    } catch {
      toast.error("Failed to update status")
    }
  }

  const filteredAddScholarships = availableScholarships.filter((s) => {
    if (!scholarshipSearch) return true
    const q = scholarshipSearch.toLowerCase()
    return s.name.toLowerCase().includes(q) || (s.provider || "").toLowerCase().includes(q)
  })

  const existingScholarshipIds = new Set(applications.map((a) => a.scholarshipId))

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  const SortButton = ({ field, children }: { field: typeof sortField; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={() => handleSort(field)}
      className={cn(
        "flex items-center gap-1 text-xs font-medium uppercase tracking-wide",
        sortField === field ? "text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Scholarships"
        description="Track your scholarship applications from start to finish."
        actions={
          <Button size="sm" className="gap-2" onClick={openAddDialog}>
            <Plus className="h-3.5 w-3.5" /> Add Scholarship
          </Button>
        }
      />

      {/* Learn more banner */}
      <LearnMoreBanner
        title="Learn: Organizing & Tracking Applications"
        description="Tips for tracking deadlines, submission best practices, and interview prep."
        href="/student/learning/scholarships"
      />

      {/* Status summary bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-all flex-nowrap whitespace-nowrap",
            statusFilter === "ALL"
              ? "bg-[#1E3A5F] text-white"
              : "bg-card text-muted-foreground ring-1 ring-gray-200 hover:bg-muted/50"
          )}
        >
          All ({applications.length})
        </button>
        {statusOrder.map((status) => {
          const config = statusConfig[status]
          return (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(statusFilter === status ? "ALL" : status)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all flex-nowrap whitespace-nowrap",
                statusFilter === status
                  ? "bg-[#1E3A5F] text-white"
                  : "bg-card text-muted-foreground ring-1 ring-gray-200 hover:bg-muted/50"
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", config.dotColor)} />
              {config.label} ({statusCounts[status] || 0})
            </button>
          )
        })}
      </div>

      {/* Search + Bulk actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search scholarships..."
          className="w-full sm:w-72"
        />
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
            <select
              className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs outline-none"
              defaultValue=""
              onChange={(e) => { if (e.target.value) handleBulkStatusChange(e.target.value); e.target.value = "" }}
              disabled={bulkUpdating}
            >
              <option value="" disabled>Change status...</option>
              {statusOrder.map((s) => (
                <option key={s} value={s}>{statusConfig[s].label}</option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="sm"
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1"
              onClick={handleBulkDelete}
              disabled={bulkUpdating}
            >
              {bulkUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Remove
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <DollarSign className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">
            {applications.length === 0 ? "No scholarships in your list yet" : "No matches for your filters"}
          </p>
          {applications.length === 0 && (
            <p className="text-xs mt-1">Click &quot;Add Scholarship&quot; to start tracking.</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
        <div className="rounded-xl bg-card ring-1 ring-foreground/5 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[32px_1fr_140px_110px_110px_140px_auto] gap-4 px-4 py-3 border-b border-border/50 bg-muted/30 min-w-[900px]">
            <div className="flex items-center justify-center">
              <CustomCheckbox
                checked={selectedIds.size === filtered.length && filtered.length > 0}
                onChange={toggleSelectAll}
                className="h-4 w-4"
              />
            </div>
            <SortButton field="name">Scholarship</SortButton>
            <SortButton field="provider">Provider</SortButton>
            <SortButton field="amount">Amount</SortButton>
            <SortButton field="deadline">Deadline</SortButton>
            <SortButton field="status">Status</SortButton>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions</span>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-border/30">
            {filtered.map((app, index) => {
              const config = statusConfig[app.status]
              return (
                <motion.div
                  key={app.id}
                  className="grid grid-cols-[32px_1fr_140px_110px_110px_140px_auto] gap-4 px-4 py-3 items-center hover:bg-muted/20 transition-colors min-w-[900px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                >
                  {/* Checkbox */}
                  <div className="flex items-center justify-center">
                    <CustomCheckbox
                      checked={selectedIds.has(app.id)}
                      onChange={() => toggleSelect(app.id)}
                      className="h-4 w-4"
                    />
                  </div>

                  {/* Scholarship Name */}
                  <div className="min-w-0">
                    <Link
                      href={`/student/applications/${app.id}`}
                      className="text-sm font-medium text-foreground hover:text-[#2563EB] transition-colors truncate block"
                    >
                      {app.scholarship.name}
                    </Link>
                  </div>

                  {/* Provider */}
                  <p className="text-sm text-muted-foreground truncate">
                    {app.scholarship.provider || "—"}
                  </p>

                  {/* Amount — show awarded amount in green when applicable */}
                  <div className="min-w-0">
                    {app.status === "AWARDED" && app.amountAwarded ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-emerald-600">
                          {formatAmount(app.amountAwarded)}
                        </span>
                        {app.amountAwarded !== app.scholarship.amount && (
                          <span className="text-[10px] text-muted-foreground line-through">
                            {formatAmount(app.scholarship.amount)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-foreground">
                        {formatAmount(app.scholarship.amount)}
                      </span>
                    )}
                  </div>

                  {/* Deadline */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(app.scholarship.deadline)}
                  </div>

                  {/* Status dropdown */}
                  <select
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    className={cn(
                      "h-7 rounded-full border px-2.5 text-[11px] font-medium outline-none cursor-pointer",
                      config.color
                    )}
                  >
                    {statusOrder.map((s) => (
                      <option key={s} value={s}>{statusConfig[s].label}</option>
                    ))}
                  </select>

                  {/* Actions — prominent Apply button + delete */}
                  <div className="flex items-center gap-1.5">
                    {app.scholarship.url && (
                      <a
                        href={app.scholarship.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2563EB]/90 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Apply
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(app.id, app.scholarship.name)}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
        </div>
      )}

      {/* Add Scholarship Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Scholarship</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <SearchInput
              value={scholarshipSearch}
              onValueChange={setScholarshipSearch}
              placeholder="Search available scholarships..."
              className="w-full"
            />
            <GridList
              aria-label="Available scholarships"
              className="max-h-64 overflow-y-auto"
              selectionMode="none"
              renderEmptyState={() => (
                <p className="text-sm text-muted-foreground text-center py-4">No scholarships found</p>
              )}
            >
              {filteredAddScholarships.map((s) => {
                const alreadyAdded = existingScholarshipIds.has(s.id)
                return (
                  <GridListItem
                    key={s.id}
                    textValue={s.name}
                    isDisabled={alreadyAdded || adding}
                    onAction={() => !alreadyAdded && !adding && handleAddScholarship(s.id)}
                    className={cn(
                      "cursor-pointer py-3 sm:py-2",
                      alreadyAdded && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.provider || "Unknown"} · {formatAmount(s.amount)} · Due {formatDate(s.deadline)}
                        </p>
                      </div>
                      {alreadyAdded && (
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">Added</span>
                      )}
                    </div>
                  </GridListItem>
                )
              })}
            </GridList>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
