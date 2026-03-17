"use client"

import { useEffect, useState, useCallback } from "react"
import { GraduationCap, Search, SlidersHorizontal, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CollegeCard,
  CollegeDetailDialog,
  ComparisonPanel,
} from "@/components/college-search"
import type { College } from "@/components/college-search"
import { US_STATES, STATE_NAMES, COLLEGE_TYPES } from "@/components/college-search"

export default function CollegesPage() {
  const [colleges, setColleges] = useState<College[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [offset, setOffset] = useState(0)
  const limit = 20

  // Search/filter state
  const [query, setQuery] = useState("")
  const [stateFilter, setStateFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [hbcuOnly, setHbcuOnly] = useState(false)
  const [testOptionalOnly, setTestOptionalOnly] = useState(false)

  // Advanced filters
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [maxAcceptance, setMaxAcceptance] = useState("")
  const [maxTuition, setMaxTuition] = useState("")

  // Compare
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set())
  const [compareColleges, setCompareColleges] = useState<College[]>([])

  // Detail dialog
  const [detailCollege, setDetailCollege] = useState<College | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const fetchColleges = useCallback(async (newOffset = 0) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.set("q", query)
      if (stateFilter) params.set("state", stateFilter)
      if (typeFilter) params.set("type", typeFilter)
      if (hbcuOnly) params.set("hbcu", "true")
      if (testOptionalOnly) params.set("testOptional", "true")
      if (maxAcceptance) params.set("maxAcceptance", maxAcceptance)
      if (maxTuition) params.set("maxTuition", maxTuition)
      params.set("limit", String(limit))
      params.set("offset", String(newOffset))

      const res = await fetch(`/api/colleges?${params}`)
      if (!res.ok) throw new Error("Failed to fetch colleges")
      const data = await res.json()
      setColleges(data.colleges)
      setTotal(data.total)
      setOffset(newOffset)
    } catch {
      toast.error("Failed to load colleges")
    } finally {
      setLoading(false)
    }
  }, [query, stateFilter, typeFilter, hbcuOnly, testOptionalOnly, maxAcceptance, maxTuition])

  // Initial load + search on filter change
  useEffect(() => {
    const timer = setTimeout(() => fetchColleges(0), 300)
    return () => clearTimeout(timer)
  }, [fetchColleges])

  // Fetch compare data when IDs change
  useEffect(() => {
    if (compareIds.size < 2) {
      setCompareColleges([])
      return
    }
    async function fetchCompare() {
      try {
        const res = await fetch("/api/colleges/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: Array.from(compareIds) }),
        })
        if (!res.ok) throw new Error("Failed to compare")
        const data = await res.json()
        setCompareColleges(data)
      } catch {
        toast.error("Failed to load comparison data")
      }
    }
    fetchCompare()
  }, [compareIds])

  function toggleCompare(id: string) {
    setCompareIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 4) next.add(id)
      return next
    })
  }

  async function addToList(college: College, classification = "MATCH") {
    try {
      const res = await fetch("/api/college-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityName: college.name,
          collegeId: college.id,
          status: "RESEARCHING",
          classification,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to add")
      }
      toast.success(`${college.name} added to your list`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add college")
    }
  }

  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.floor(offset / limit) + 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1E3A5F]">College Search & Compare</h1>
        <p className="mt-1 text-muted-foreground">
          Explore colleges, compare stats side-by-side, and build your list.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by college name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Badge variant="secondary" className="self-center whitespace-nowrap">
            {total.toLocaleString()} result{total !== 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={stateFilter} onValueChange={(v) => { if (v) setStateFilter(v === "ALL" ? "" : v) }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All States</SelectItem>
              {US_STATES.map((s) => (
                <SelectItem key={s} value={s}>{STATE_NAMES[s] || s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(v) => { if (v) setTypeFilter(v === "ALL" ? "" : v) }}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {COLLEGE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="flex items-center gap-1.5 text-xs">
            <Checkbox checked={hbcuOnly} onCheckedChange={(v) => setHbcuOnly(v === true)} />
            HBCU
          </label>

          <label className="flex items-center gap-1.5 text-xs">
            <Checkbox checked={testOptionalOnly} onCheckedChange={(v) => setTestOptionalOnly(v === true)} />
            Test Optional
          </label>

          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <SlidersHorizontal className="h-3 w-3" />
            Advanced
            <ChevronDown className={`h-3 w-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
          </Button>
        </div>

        {/* Advanced filters */}
        {showAdvanced && (
          <div className="flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-white p-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Max Acceptance Rate (%)</label>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="e.g. 30"
                value={maxAcceptance}
                onChange={(e) => setMaxAcceptance(e.target.value)}
                className="w-32"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Max Tuition ($)</label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 40000"
                value={maxTuition}
                onChange={(e) => setMaxTuition(e.target.value)}
                className="w-32"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => { setMaxAcceptance(""); setMaxTuition("") }}
            >
              Reset
            </Button>
          </div>
        )}
      </div>

      {/* Comparison Panel */}
      <ComparisonPanel
        colleges={compareColleges}
        onRemove={(id) => toggleCompare(id)}
        onAddToList={(c) => addToList(c)}
        onClearAll={() => setCompareIds(new Set())}
      />

      {/* Results Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <p className="text-sm">Searching colleges...</p>
        </div>
      ) : colleges.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No colleges found"
          description="Try adjusting your search or filter criteria."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {colleges.map((college) => (
              <CollegeCard
                key={college.id}
                college={college}
                isComparing={compareIds.has(college.id)}
                compareCount={compareIds.size}
                onToggleCompare={toggleCompare}
                onViewDetail={(c) => { setDetailCollege(c); setDetailOpen(true) }}
                onAddToList={(c) => addToList(c)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => fetchColleges(offset - limit)}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => fetchColleges(offset + limit)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Detail Dialog */}
      <CollegeDetailDialog
        college={detailCollege}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onAddToList={(college, classification) => {
          addToList(college, classification)
          setDetailOpen(false)
        }}
      />
    </div>
  )
}
