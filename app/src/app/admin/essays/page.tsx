"use client"

import * as React from "react"
import { motion } from "motion/react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SearchInput } from "@/components/ui/search-input"
import { Tabs as VercelTabs } from "@/components/ui/vercel-tabs"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { FileText } from "@/lib/icons"

interface Essay {
  id: string
  title: string
  status: string
  content?: string | null
  wordCount?: number | null
  updatedAt: string
  student?: {
    name?: string | null
    email: string
  } | null
}

const STATUS_TABS = ["All", "Draft", "In Progress", "Review", "Final"] as const
type StatusTab = (typeof STATUS_TABS)[number]

const statusMap: Record<string, StatusTab> = {
  DRAFT: "Draft",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  UNDER_REVIEW: "Review",
  FINAL: "Final",
  APPROVED: "Final",
}

const statusStyles: Record<string, string> = {
  Draft: "bg-muted text-foreground ring-gray-300",
  "In Progress": "bg-accent text-blue-700 ring-blue-300",
  Review: "bg-amber-50 text-amber-700 ring-amber-300",
  Final: "bg-green-50 text-green-700 ring-green-300",
}

function getWordCount(essay: Essay): number {
  if (essay.wordCount != null) return essay.wordCount
  if (essay.content) return essay.content.trim().split(/\s+/).filter(Boolean).length
  return 0
}

function getStatusLabel(status: string): StatusTab {
  return statusMap[status] || "Draft"
}

export default function AdminEssaysPage() {
  const [essays, setEssays] = React.useState<Essay[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [activeTab, setActiveTab] = React.useState<StatusTab>("All")
  const [selectedEssay, setSelectedEssay] = React.useState<Essay | null>(null)
  const [updating, setUpdating] = React.useState(false)

  const handleStatusChange = async (essayId: string, newStatus: string) => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/essays/${essayId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      toast.success("Status updated")
      setEssays((prev) => prev.map((e) => (e.id === essayId ? { ...e, status: newStatus } : e)))
      if (selectedEssay?.id === essayId) setSelectedEssay((prev) => prev ? { ...prev, status: newStatus } : null)
    } catch {
      toast.error("Failed to update status")
    } finally {
      setUpdating(false)
    }
  }

  React.useEffect(() => {
    fetch("/api/essays")
      .then((res) => res.json())
      .then((data) => {
        setEssays(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => {
        toast.error("Failed to load essays")
        setLoading(false)
      })
  }, [])

  const filtered = React.useMemo(() => {
    let result = essays

    if (activeTab !== "All") {
      result = result.filter((e) => getStatusLabel(e.status) === activeTab)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.student?.name || e.student?.email || "").toLowerCase().includes(q)
      )
    }

    return result
  }, [essays, activeTab, search])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Essays"
        description="Review and manage student essays."
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <VercelTabs
          tabs={STATUS_TABS.map((tab) => ({ id: tab, label: tab }))}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as StatusTab)}
        />
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search by student or title..."
          className="w-full sm:w-64"
        />
      </div>

      {/* Table */}
      <motion.div
        className="rounded-xl bg-card ring-1 ring-foreground/10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
            Loading essays...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <FileText className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No essays found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Student Name
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Essay Title
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Word Count
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((essay) => {
                const label = getStatusLabel(essay.status)
                return (
                  <tr
                    key={essay.id}
                    onClick={() => setSelectedEssay(essay)}
                    className={cn(
                      "border-b border-border/30 last:border-0 cursor-pointer transition-colors hover:bg-muted/50",
                      selectedEssay?.id === essay.id && "bg-[#2563EB]/5"
                    )}
                  >
                    <td className="px-5 py-3 font-medium text-foreground">
                      {essay.student?.name || essay.student?.email || "Unknown"}
                    </td>
                    <td className="px-5 py-3 text-foreground">{essay.title}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex h-5 items-center rounded-full px-2 text-xs font-medium ring-1 ring-inset",
                          statusStyles[label] || statusStyles["Draft"]
                        )}
                      >
                        {label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-muted-foreground tabular-nums">
                      {getWordCount(essay).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right text-muted-foreground">
                      {new Date(essay.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Essay Detail Panel */}
      {selectedEssay && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl bg-card ring-1 ring-foreground/10 p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-secondary-foreground">{selectedEssay.title}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                By {selectedEssay.student?.name || selectedEssay.student?.email || "Unknown"} &middot; {getWordCount(selectedEssay).toLocaleString()} words
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedEssay.status}
                onChange={(e) => handleStatusChange(selectedEssay.id, e.target.value)}
                disabled={updating}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="DRAFT">Draft</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
              </select>
              <Button variant="outline" size="sm" onClick={() => setSelectedEssay(null)}>
                Close
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 max-h-96 overflow-y-auto">
            {selectedEssay.content ? (
              <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                {selectedEssay.content}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No content yet.</p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
