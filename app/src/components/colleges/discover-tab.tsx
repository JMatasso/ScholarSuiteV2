"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { toast } from "sonner"
import {
  GraduationCap, Search, SlidersHorizontal, ChevronDown,
} from "@/lib/icons"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { MultiSelect } from "@/components/ui/multi-select"
import { EmptyState } from "@/components/ui/empty-state"
import {
  CollegeCard as SearchCollegeCard,
  CollegeDetailDialog,
  ComparisonPanel,
} from "@/components/college-search"
import type { College as SearchCollege } from "@/components/college-search"
import { US_STATES, STATE_NAMES, COLLEGE_TYPES } from "@/components/college-search"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import LoaderOne from "@/components/ui/loader-one"

/* ────── types ────── */

interface CollegeAppForCompare {
  id: string
  universityName: string
  applicationType: string
  status: string
  classification: string | null
  deadline: string | null
  college: {
    name?: string
    city?: string | null
    state?: string | null
    type?: string | null
    locale?: string | null
    enrollment?: number | null
    acceptanceRate?: number | null
    satAvg?: number | null
    sat25?: number | null
    sat75?: number | null
    actAvg?: number | null
    act25?: number | null
    act75?: number | null
    testOptional?: boolean
    inStateTuition?: number | null
    outOfStateTuition?: number | null
    roomAndBoard?: number | null
    pellPct?: number | null
    fedLoanPct?: number | null
    medianDebt?: number | null
    gradRate4yr?: number | null
    gradRate6yr?: number | null
    retentionRate?: number | null
    medianEarnings6yr?: number | null
    medianEarnings10yr?: number | null
  } | null
}

/* ────── compare table helpers ────── */

type Getter = (a: CollegeAppForCompare) => number | null
type Direction = "high" | "low"

const fmtPct = (v: number | null) => (v != null ? `${Math.round(v * 100)}%` : "\u2014")
const fmtMoney = (v: number | null) =>
  v != null ? `$${v.toLocaleString("en-US")}` : "\u2014"
const fmtNum = (v: number | null) => (v != null ? v.toLocaleString("en-US") : "\u2014")
const fmtStr = (v: string | null | undefined) => v || "\u2014"
const fmtBool = (v: boolean | undefined) => (v === true ? "Yes" : v === false ? "No" : "\u2014")
const fmtRange = (lo: number | null | undefined, hi: number | null | undefined) =>
  lo != null && hi != null ? `${lo}\u2013${hi}` : lo != null ? `${lo}+` : "\u2014"

interface CompareRow {
  label: string
  value: (a: CollegeAppForCompare) => string
  rank?: { get: Getter; dir: Direction }
}

const compareSections: { title: string; rows: CompareRow[] }[] = [
  {
    title: "Overview",
    rows: [
      { label: "Name", value: (a) => a.college?.name ?? a.universityName },
      { label: "City / State", value: (a) => a.college ? fmtStr([a.college.city, a.college.state].filter(Boolean).join(", ") || null) : "\u2014" },
      { label: "Type", value: (a) => fmtStr(a.college?.type) },
      { label: "Enrollment", value: (a) => fmtNum(a.college?.enrollment ?? null), rank: { get: (a) => a.college?.enrollment ?? null, dir: "high" } },
      { label: "Locale", value: (a) => fmtStr(a.college?.locale) },
    ],
  },
  {
    title: "Admissions",
    rows: [
      { label: "Acceptance Rate", value: (a) => fmtPct(a.college?.acceptanceRate ?? null), rank: { get: (a) => a.college?.acceptanceRate ?? null, dir: "high" } },
      { label: "SAT Avg", value: (a) => fmtNum(a.college?.satAvg ?? null), rank: { get: (a) => a.college?.satAvg ?? null, dir: "high" } },
      { label: "SAT Range (25th\u201375th)", value: (a) => fmtRange(a.college?.sat25, a.college?.sat75) },
      { label: "ACT Avg", value: (a) => fmtNum(a.college?.actAvg ?? null), rank: { get: (a) => a.college?.actAvg ?? null, dir: "high" } },
      { label: "ACT Range (25th\u201375th)", value: (a) => fmtRange(a.college?.act25, a.college?.act75) },
      { label: "Test Optional", value: (a) => fmtBool(a.college?.testOptional) },
    ],
  },
  {
    title: "Cost",
    rows: [
      { label: "In-State Tuition", value: (a) => fmtMoney(a.college?.inStateTuition ?? null), rank: { get: (a) => a.college?.inStateTuition ?? null, dir: "low" } },
      { label: "Out-of-State Tuition", value: (a) => fmtMoney(a.college?.outOfStateTuition ?? null), rank: { get: (a) => a.college?.outOfStateTuition ?? null, dir: "low" } },
      { label: "Room & Board", value: (a) => fmtMoney(a.college?.roomAndBoard ?? null), rank: { get: (a) => a.college?.roomAndBoard ?? null, dir: "low" } },
    ],
  },
  {
    title: "Financial Aid",
    rows: [
      { label: "Pell Grant %", value: (a) => fmtPct(a.college?.pellPct ?? null), rank: { get: (a) => a.college?.pellPct ?? null, dir: "high" } },
      { label: "Federal Loan %", value: (a) => fmtPct(a.college?.fedLoanPct ?? null), rank: { get: (a) => a.college?.fedLoanPct ?? null, dir: "low" } },
      { label: "Median Debt", value: (a) => fmtMoney(a.college?.medianDebt ?? null), rank: { get: (a) => a.college?.medianDebt ?? null, dir: "low" } },
    ],
  },
  {
    title: "Outcomes",
    rows: [
      { label: "4-Year Grad Rate", value: (a) => fmtPct(a.college?.gradRate4yr ?? null), rank: { get: (a) => a.college?.gradRate4yr ?? null, dir: "high" } },
      { label: "6-Year Grad Rate", value: (a) => fmtPct(a.college?.gradRate6yr ?? null), rank: { get: (a) => a.college?.gradRate6yr ?? null, dir: "high" } },
      { label: "Retention Rate", value: (a) => fmtPct(a.college?.retentionRate ?? null), rank: { get: (a) => a.college?.retentionRate ?? null, dir: "high" } },
      { label: "Median Earnings (6yr)", value: (a) => fmtMoney(a.college?.medianEarnings6yr ?? null), rank: { get: (a) => a.college?.medianEarnings6yr ?? null, dir: "high" } },
      { label: "Median Earnings (10yr)", value: (a) => fmtMoney(a.college?.medianEarnings10yr ?? null), rank: { get: (a) => a.college?.medianEarnings10yr ?? null, dir: "high" } },
    ],
  },
  {
    title: "Your Application",
    rows: [
      { label: "Application Type", value: (a) => fmtStr(a.applicationType) },
      { label: "Status", value: (a) => fmtStr(a.status) },
      { label: "Classification", value: (a) => fmtStr(a.classification) },
      { label: "Deadline", value: (a) => formatDate(a.deadline) },
    ],
  },
]

function rankValues(apps: CollegeAppForCompare[], get: Getter, dir: Direction) {
  const vals = apps.map((a) => get(a))
  const valid = vals.filter((v): v is number => v != null)
  if (valid.length < 2) return apps.map(() => "neutral" as const)
  const best = dir === "high" ? Math.max(...valid) : Math.min(...valid)
  const worst = dir === "high" ? Math.min(...valid) : Math.max(...valid)
  return vals.map((v) => {
    if (v == null) return "neutral" as const
    if (v === best) return "best" as const
    if (v === worst) return "worst" as const
    return "neutral" as const
  })
}

const cellColor = { best: "bg-emerald-50", worst: "bg-rose-50", neutral: "" }

/* ────── sub-tab type ────── */

type SubTab = "search" | "compare"

/* ────── component ────── */

interface DiscoverTabProps {
  apps: CollegeAppForCompare[]
  onAddedToList: () => void
}

export function DiscoverTab({ apps, onAddedToList }: DiscoverTabProps) {
  const [subTab, setSubTab] = useState<SubTab>("search")

  return (
    <div className="space-y-5">
      {/* Sub-tab toggle */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        <button
          onClick={() => setSubTab("search")}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            subTab === "search" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Search & Add
        </button>
        <button
          onClick={() => setSubTab("compare")}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            subTab === "compare" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Compare My List
        </button>
      </div>

      {subTab === "search" ? (
        <SearchSection onAddedToList={onAddedToList} />
      ) : (
        <CompareSection apps={apps} />
      )}
    </div>
  )
}

/* ================================================================
   Search Section
   ================================================================ */

function SearchSection({ onAddedToList }: { onAddedToList: () => void }) {
  const [colleges, setColleges] = useState<SearchCollege[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [offset, setOffset] = useState(0)
  const limit = 20

  const [query, setQuery] = useState("")
  const [stateFilter, setStateFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [hbcuOnly, setHbcuOnly] = useState(false)
  const [testOptionalOnly, setTestOptionalOnly] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [maxAcceptance, setMaxAcceptance] = useState("")
  const [maxTuition, setMaxTuition] = useState("")

  const [compareIds, setCompareIds] = useState<Set<string>>(new Set())
  const [compareColleges, setCompareColleges] = useState<SearchCollege[]>([])
  const [detailCollege, setDetailCollege] = useState<SearchCollege | null>(null)
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

  useEffect(() => {
    const timer = setTimeout(() => fetchColleges(0), 300)
    return () => clearTimeout(timer)
  }, [fetchColleges])

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
        setCompareColleges(await res.json())
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

  async function addToList(college: SearchCollege, classification = "MATCH") {
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
      onAddedToList()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add college")
    }
  }

  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.floor(offset / limit) + 1

  return (
    <div className="space-y-5">
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

        {showAdvanced && (
          <div className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-card p-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Max Acceptance Rate (%)</label>
              <Input type="number" min={0} max={100} placeholder="e.g. 30" value={maxAcceptance} onChange={(e) => setMaxAcceptance(e.target.value)} className="w-32" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Max Tuition ($)</label>
              <Input type="number" min={0} placeholder="e.g. 40000" value={maxTuition} onChange={(e) => setMaxTuition(e.target.value)} className="w-32" />
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => { setMaxAcceptance(""); setMaxTuition("") }}>
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
        <div className="flex items-center justify-center py-16">
          <LoaderOne />
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
              <SearchCollegeCard
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => fetchColleges(offset - limit)}>
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => fetchColleges(offset + limit)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}

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

/* ================================================================
   Compare Section (compare colleges on your list)
   ================================================================ */

function CompareSection({ apps }: { apps: CollegeAppForCompare[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const options = useMemo(
    () => apps.map((a) => ({ id: a.id, label: a.universityName })),
    [apps]
  )

  const selected = useMemo(
    () => apps.filter((a) => selectedIds.includes(a.id)),
    [apps, selectedIds]
  )

  const handleChange = (ids: string[]) => setSelectedIds(ids.slice(0, 4))

  return (
    <div className="space-y-5">
      <div className="max-w-md">
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Select 2-4 colleges to compare
        </label>
        <MultiSelect
          options={options}
          selectedIds={selectedIds}
          onChange={handleChange}
          placeholder="Choose colleges..."
          searchPlaceholder="Search your college list..."
          emptyMessage="No colleges in your list yet."
        />
      </div>

      {selected.length < 2 ? (
        <Card variant="bento">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-secondary-foreground mb-3">
              <GraduationCap className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-secondary-foreground">Select at least 2 colleges</p>
            <p className="text-xs text-muted-foreground mt-1">Pick colleges from your list above to see a side-by-side comparison.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[600px] text-sm">
            {compareSections.map((section) => (
              <tbody key={section.title}>
                <tr>
                  <td
                    colSpan={selected.length + 1}
                    className="bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-secondary-foreground"
                  >
                    {section.title}
                  </td>
                </tr>
                {section.rows.map((row) => {
                  const ranks = row.rank
                    ? rankValues(selected, row.rank.get, row.rank.dir)
                    : selected.map(() => "neutral" as const)
                  return (
                    <tr key={row.label} className="border-t border-border">
                      <td className="whitespace-nowrap px-4 py-2 font-medium text-muted-foreground w-48">
                        {row.label}
                      </td>
                      {selected.map((app, i) => (
                        <td key={app.id} className={cn("px-4 py-2 text-center", cellColor[ranks[i]])}>
                          {row.value(app)}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            ))}
          </table>
        </div>
      )}
    </div>
  )
}
