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
import { toast } from "sonner"
import { LearnMoreBanner } from "@/components/ui/learn-more-banner"
import {
  Plus,
  DollarSign,
  Calendar,
  ExternalLink,
  Trash2,
  ArrowUpDown,
} from "lucide-react"

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
  NOT_STARTED: { label: "Not Started", color: "bg-gray-100 text-gray-700 border-gray-200", dotColor: "bg-gray-400" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-200", dotColor: "bg-blue-500" },
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
  const [sortField, setSortField] = useState<"name" | "amount" | "deadline" | "status">("deadline")
  const [sortAsc, setSortAsc] = useState(true)

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
        (a.scholarship.provider || "").toLowerCase().includes(q)
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
        sortField === field ? "text-[#1E3A5F]" : "text-muted-foreground hover:text-foreground"
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
          <Button size="sm" className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2" onClick={openAddDialog}>
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
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-all",
            statusFilter === "ALL"
              ? "bg-[#1E3A5F] text-white"
              : "bg-white text-muted-foreground ring-1 ring-gray-200 hover:bg-gray-50"
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
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all",
                statusFilter === status
                  ? "bg-[#1E3A5F] text-white"
                  : "bg-white text-muted-foreground ring-1 ring-gray-200 hover:bg-gray-50"
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", config.dotColor)} />
              {config.label} ({statusCounts[status] || 0})
            </button>
          )
        })}
      </div>

      {/* Search + Sort */}
      <div className="flex items-center gap-3">
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search scholarships..."
          className="w-72"
        />
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
        <div className="rounded-xl bg-white ring-1 ring-foreground/5 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_120px_120px_140px_100px] gap-4 px-4 py-3 border-b border-border/50 bg-muted/30">
            <SortButton field="name">Scholarship</SortButton>
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
                  className="grid grid-cols-[1fr_120px_120px_140px_100px] gap-4 px-4 py-3 items-center hover:bg-muted/20 transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                >
                  {/* Name + Provider */}
                  <div className="min-w-0">
                    <Link
                      href={`/student/applications/${app.id}`}
                      className="text-sm font-medium text-foreground hover:text-[#2563EB] transition-colors truncate block"
                    >
                      {app.scholarship.name}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">
                      {app.scholarship.provider || "—"}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    {app.status === "AWARDED" && app.amountAwarded
                      ? formatAmount(app.amountAwarded)
                      : formatAmount(app.scholarship.amount)}
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

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {app.scholarship.url && (
                      <a
                        href={app.scholarship.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md p-1.5 text-muted-foreground hover:text-[#2563EB] hover:bg-muted transition-colors"
                        title="Visit scholarship"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
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
      )}

      {/* Add Scholarship Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
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
            <div className="max-h-64 overflow-y-auto space-y-1 rounded-lg border border-gray-200 p-1.5">
              {filteredAddScholarships.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No scholarships found</p>
              ) : (
                filteredAddScholarships.map((s) => {
                  const alreadyAdded = existingScholarshipIds.has(s.id)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={alreadyAdded || adding}
                      onClick={() => handleAddScholarship(s.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors",
                        alreadyAdded
                          ? "opacity-50 cursor-not-allowed bg-muted/30"
                          : "hover:bg-muted/50 cursor-pointer"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.provider || "Unknown"} · {formatAmount(s.amount)} · Due {formatDate(s.deadline)}
                        </p>
                      </div>
                      {alreadyAdded && (
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">Added</span>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
