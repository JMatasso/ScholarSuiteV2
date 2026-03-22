"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatTuition, getCollegeTypeLabel } from "@/lib/college-utils"
import {
  GraduationCap,
  Home,
  BookOpen,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Building2,
  MapPin,
  Trophy,
  CheckCircle2,
  Plus,
  X,
  Search,
  Download,
} from "@/lib/icons"

interface College {
  id: string
  name: string
  city?: string | null
  state?: string | null
  type?: string | null
  inStateTuition?: number | null
  outOfStateTuition?: number | null
  roomAndBoard?: number | null
  booksSupplies?: number | null
  gradInStateTuition?: number | null
  gradOutOfStateTuition?: number | null
  highestDegree?: number | null
}

interface AidPackage {
  grants?: number
  scholarships?: number
  loans?: number
  workStudy?: number
  [key: string]: unknown
}

interface CollegeApp {
  id: string
  universityName: string
  classification?: string | null
  college?: College | null
  aidPackage?: AidPackage | null
  netCostEstimate?: number | null
  status: string
}

// A comparison-only school (not a formal application)
interface ComparisonSchool {
  id: string // college DB id
  universityName: string
  college: College
  isComparisonOnly: true
}

type CostEntry = (CollegeApp & { isComparisonOnly?: false }) | ComparisonSchool

interface CollegeCostComparisonProps {
  collegeApps: CollegeApp[]
  totalScholarships: number
}

interface SearchResult {
  id: string
  name: string
  city?: string | null
  state?: string | null
  type?: string | null
  inStateTuition?: number | null
  outOfStateTuition?: number | null
  roomAndBoard?: number | null
  booksSupplies?: number | null
}

const STORAGE_KEY = "scholar-suite-comparison-schools"

function loadSavedComparisons(): ComparisonSchool[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveComparisons(schools: ComparisonSchool[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schools))
  } catch {
    // localStorage full or unavailable
  }
}

function classificationBadge(classification: string | null | undefined) {
  if (!classification) return null
  const colorMap: Record<string, string> = {
    REACH: "bg-rose-100 text-rose-700 border-rose-200",
    MATCH: "bg-blue-100 text-blue-700 border-blue-200",
    LIKELY: "bg-amber-100 text-amber-700 border-amber-200",
    SAFETY: "bg-emerald-100 text-emerald-700 border-emerald-200",
  }
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border ${colorMap[classification] || "bg-muted text-muted-foreground border-border"}`}>
      {classification}
    </span>
  )
}

function getCOA(college: College | null | undefined, useOutOfState = false, graduate = false): number | null {
  if (!college) return null
  const tuition = getTuition(college, useOutOfState, graduate)
  if (tuition == null) return null
  if (graduate) {
    // Graduate COA typically doesn't include room/board from Scorecard
    return tuition + (college.booksSupplies ?? 0)
  }
  return tuition + (college.roomAndBoard ?? 0) + (college.booksSupplies ?? 0)
}

function getTuition(college: College, useOutOfState: boolean, graduate: boolean): number | null {
  if (graduate) {
    const gradOOS = college.gradOutOfStateTuition ?? null
    const gradIS = college.gradInStateTuition ?? null
    return useOutOfState ? (gradOOS ?? gradIS) : gradIS
  }
  return (useOutOfState ? college.outOfStateTuition : college.inStateTuition) ?? null
}

function hasGradData(entries: Array<{ college?: College | null }>): boolean {
  return entries.some((e) => e.college?.gradInStateTuition != null || e.college?.gradOutOfStateTuition != null)
}

function getAidTotal(aidPackage: AidPackage | null | undefined): number {
  if (!aidPackage) return 0
  return (aidPackage.grants ?? 0) + (aidPackage.scholarships ?? 0) + (aidPackage.loans ?? 0) + (aidPackage.workStudy ?? 0)
}

function getGrantAid(aidPackage: AidPackage | null | undefined): number {
  if (!aidPackage) return 0
  return (aidPackage.grants ?? 0) + (aidPackage.scholarships ?? 0)
}

function CollegeSearchPicker({
  onSelect,
  excludeIds,
}: {
  onSelect: (college: SearchResult) => void
  excludeIds: Set<string>
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/colleges/search?q=${encodeURIComponent(q)}`)
      const data: SearchResult[] = await res.json()
      setResults(data.filter((c) => !excludeIds.has(c.id)))
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [excludeIds])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(query), 300)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query, search])

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search for a school to compare..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          className="pl-8 h-9 text-sm"
        />
      </div>
      {open && query.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-lg max-h-60 overflow-y-auto">
          {searching && (
            <div className="px-3 py-2 text-xs text-muted-foreground">Searching...</div>
          )}
          {!searching && results.length === 0 && query.length >= 2 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">No schools found</div>
          )}
          {results.map((college) => {
            const hasCosts = college.inStateTuition != null || college.outOfStateTuition != null
            return (
              <button
                key={college.id}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors"
                onClick={() => {
                  onSelect(college)
                  setQuery("")
                  setOpen(false)
                  setResults([])
                }}
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{college.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[college.city, college.state].filter(Boolean).join(", ")}
                    {!hasCosts && " — no cost data"}
                  </p>
                </div>
                {hasCosts && (
                  <span className="shrink-0 ml-2 text-xs text-muted-foreground">
                    {formatTuition(college.inStateTuition)}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function CollegeCostComparison({ collegeApps, totalScholarships }: CollegeCostComparisonProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [useOutOfState, setUseOutOfState] = useState(false)
  const [showGraduate, setShowGraduate] = useState(false)
  const [comparisonSchools, setComparisonSchools] = useState<ComparisonSchool[]>([])
  const [showPicker, setShowPicker] = useState(false)

  // Load saved comparisons on mount
  useEffect(() => {
    setComparisonSchools(loadSavedComparisons())
  }, [])

  // Build merged list — real apps with cost data + comparison-only schools
  const appsWithCosts: CostEntry[] = collegeApps
    .filter((app) => app.college && (app.college.inStateTuition != null || app.college.outOfStateTuition != null))
    .map((app) => ({ ...app, isComparisonOnly: false as const }))

  // Filter out comparison schools that now overlap with real apps (student added them)
  const realCollegeIds = new Set(appsWithCosts.map((a) => a.college?.id).filter(Boolean) as string[])
  const filteredComparisons = comparisonSchools.filter((c) => !realCollegeIds.has(c.id))

  const allEntries: CostEntry[] = [...appsWithCosts, ...filteredComparisons]

  // IDs already in the list (for excluding from search)
  const excludeIds = new Set([
    ...realCollegeIds,
    ...filteredComparisons.map((c) => c.id),
  ])

  const handleAddComparison = (result: SearchResult) => {
    const hasCosts = result.inStateTuition != null || result.outOfStateTuition != null
    if (!hasCosts) return

    const newSchool: ComparisonSchool = {
      id: result.id,
      universityName: result.name,
      isComparisonOnly: true,
      college: {
        id: result.id,
        name: result.name,
        city: result.city,
        state: result.state,
        type: result.type,
        inStateTuition: result.inStateTuition,
        outOfStateTuition: result.outOfStateTuition,
        roomAndBoard: result.roomAndBoard,
        booksSupplies: result.booksSupplies,
      },
    }
    const updated = [...filteredComparisons, newSchool]
    setComparisonSchools(updated)
    saveComparisons(updated)
    // Keep picker open so user can add more schools
  }

  const handleRemoveComparison = (collegeId: string) => {
    const updated = comparisonSchools.filter((c) => c.id !== collegeId)
    setComparisonSchools(updated)
    saveComparisons(updated)
  }

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Find cheapest net cost
  const netCosts = allEntries.map((entry) => {
    const coa = getCOA(entry.college, useOutOfState, showGraduate) ?? 0
    const aid = entry.isComparisonOnly ? 0 : getAidTotal((entry as CollegeApp).aidPackage)
    const key = entry.isComparisonOnly ? `cmp-${entry.id}` : entry.id
    return { key, netCost: coa - aid }
  })
  const cheapestKey = netCosts.length > 0 ? netCosts.reduce((a, b) => (a.netCost < b.netCost ? a : b)).key : null

  const getEntryKey = (entry: CostEntry) => entry.isComparisonOnly ? `cmp-${entry.id}` : entry.id

  const isEmpty = allEntries.length === 0

  const handleExportExcel = () => {
    if (allEntries.length < 2) return

    const headers = ["Category", ...allEntries.map(e => e.universityName)]
    const rows = [
      ["Tuition", ...allEntries.map(e => getTuition(e.college!, useOutOfState, showGraduate)?.toString() ?? "N/A")],
      ["Room & Board", ...allEntries.map(e => e.college!.roomAndBoard?.toString() ?? "N/A")],
      ["Books & Supplies", ...allEntries.map(e => e.college!.booksSupplies?.toString() ?? "N/A")],
      ["Total COA", ...allEntries.map(e => getCOA(e.college, useOutOfState, showGraduate)?.toString() ?? "N/A")],
      ["Grants/Scholarships", ...allEntries.map(e => {
        if (e.isComparisonOnly) return "N/A"
        const g = getGrantAid((e as CollegeApp).aidPackage)
        return g > 0 ? g.toString() : "N/A"
      })],
      ["Loans", ...allEntries.map(e => {
        if (e.isComparisonOnly) return "N/A"
        const l = (e as CollegeApp).aidPackage?.loans ?? 0
        return l > 0 ? l.toString() : "N/A"
      })],
      ["Net Annual Cost", ...allEntries.map(e => {
        const coa = getCOA(e.college, useOutOfState, showGraduate)
        const aid = e.isComparisonOnly ? 0 : getAidTotal((e as CollegeApp).aidPackage)
        return coa != null ? (coa - aid).toString() : "N/A"
      })],
      ["4-Year Total", ...allEntries.map(e => {
        const coa = getCOA(e.college, useOutOfState, showGraduate)
        const aid = e.isComparisonOnly ? 0 : getAidTotal((e as CollegeApp).aidPackage)
        return coa != null ? ((coa - aid) * 4).toString() : "N/A"
      })],
    ]

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "college-cost-comparison.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-secondary-foreground uppercase tracking-wide">
          College Cost Comparison
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPicker(!showPicker)}
            className="text-xs gap-1.5"
          >
            <Plus className="h-3 w-3" />
            Compare School
          </Button>
          {!isEmpty && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUseOutOfState(!useOutOfState)}
                className="text-xs"
              >
                {useOutOfState ? "Out-of-State" : "In-State"}
              </Button>
              {hasGradData(allEntries) && (
                <Button
                  variant={showGraduate ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowGraduate(!showGraduate)}
                  className={`text-xs ${showGraduate ? "bg-[#2563EB] hover:bg-[#2563EB]/90" : ""}`}
                >
                  {showGraduate ? "Graduate" : "Undergrad"}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Search picker */}
      {showPicker && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <CollegeSearchPicker onSelect={handleAddComparison} excludeIds={excludeIds} />
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowPicker(false)} className="shrink-0 text-xs">
            Done
          </Button>
        </div>
      )}

      {/* Empty state */}
      {isEmpty && !showPicker && (
        <Card variant="bento">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Building2 className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No colleges with cost data to compare yet.</p>
              <p className="text-xs mt-1">Add colleges from your list or use "Compare School" to search any school.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Graduate mode notice */}
      {showGraduate && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3">
          <p className="text-xs text-amber-700">
            <strong>Graduate/Professional Costs</strong> — Data from College Scorecard. Coverage is limited and
            may not reflect specific program costs (MBA, JD, MD, etc.). Verify with university websites. Room &
            board not included in graduate estimates.
          </p>
        </div>
      )}

      {/* Per-School Cost Cards */}
      {allEntries.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-2">
          {allEntries.map((entry, i) => {
            const college = entry.college!
            const isComparison = entry.isComparisonOnly
            const aidPackage = isComparison ? null : (entry as CollegeApp).aidPackage
            const classification = isComparison ? null : (entry as CollegeApp).classification
            const coa = getCOA(college, useOutOfState, showGraduate)
            const aid = getAidTotal(aidPackage)
            const netCost = coa != null ? coa - aid : null
            const fourYearTotal = netCost != null ? netCost * 4 : null
            const entryKey = getEntryKey(entry)
            const isCheapest = entryKey === cheapestKey && allEntries.length > 1
            const isExpanded = expandedCards.has(entryKey)

            return (
              <motion.div
                key={entryKey}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card variant="bento" className={`relative ${isCheapest ? "ring-2 ring-emerald-400" : ""} ${isComparison ? "border-dashed" : ""}`}>
                  {isCheapest && (
                    <div className="absolute -top-2.5 left-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium">
                        <Trophy className="h-3 w-3" />
                        Best Value
                      </span>
                    </div>
                  )}
                  {isComparison && (
                    <button
                      className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => handleRemoveComparison(entry.id)}
                      title="Remove from comparison"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm truncate pr-4">{entry.universityName}</CardTitle>
                        {college.city && college.state && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {college.city}, {college.state}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {isComparison ? (
                          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border bg-gray-100 text-gray-600 border-gray-200">
                            Comparing
                          </span>
                        ) : (
                          classificationBadge(classification)
                        )}
                        {college.type && (
                          <span className="text-[10px] text-muted-foreground">
                            {getCollegeTypeLabel(college.type)}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Cost breakdown */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <GraduationCap className="h-3 w-3" />
                          Tuition
                        </span>
                        <span className="font-medium">
                          {formatTuition(getTuition(college, useOutOfState, showGraduate))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Home className="h-3 w-3" />
                          Room & Board
                        </span>
                        <span className="font-medium">{formatTuition(college.roomAndBoard)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <BookOpen className="h-3 w-3" />
                          Books & Supplies
                        </span>
                        <span className="font-medium">{formatTuition(college.booksSupplies)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1.5">
                        <span className="font-semibold text-secondary-foreground">Est. Total COA</span>
                        <span className="font-semibold text-secondary-foreground">{formatTuition(coa)}</span>
                      </div>
                    </div>

                    {/* Aid breakdown if available */}
                    {aidPackage && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs h-7"
                          onClick={() => toggleCard(entryKey)}
                        >
                          {isExpanded ? (
                            <>Aid Details <ChevronUp className="h-3 w-3 ml-1" /></>
                          ) : (
                            <>Aid Details <ChevronDown className="h-3 w-3 ml-1" /></>
                          )}
                        </Button>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="space-y-1.5 text-xs"
                          >
                            {(aidPackage.grants ?? 0) > 0 && (
                              <div className="flex justify-between">
                                <span className="text-emerald-600">Grants</span>
                                <span className="text-emerald-600 font-medium">-{formatTuition(aidPackage.grants ?? 0)}</span>
                              </div>
                            )}
                            {(aidPackage.scholarships ?? 0) > 0 && (
                              <div className="flex justify-between">
                                <span className="text-emerald-600">Scholarships</span>
                                <span className="text-emerald-600 font-medium">-{formatTuition(aidPackage.scholarships ?? 0)}</span>
                              </div>
                            )}
                            {(aidPackage.loans ?? 0) > 0 && (
                              <div className="flex justify-between">
                                <span className="text-amber-600">Loans</span>
                                <span className="text-amber-600 font-medium">{formatTuition(aidPackage.loans ?? 0)}</span>
                              </div>
                            )}
                            {(aidPackage.workStudy ?? 0) > 0 && (
                              <div className="flex justify-between">
                                <span className="text-blue-600">Work-Study</span>
                                <span className="text-blue-600 font-medium">{formatTuition(aidPackage.workStudy ?? 0)}</span>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </>
                    )}

                    {/* Net cost & 4-year */}
                    {netCost != null && (
                      <div className="rounded-lg bg-muted/50 p-2.5 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">Net Annual Cost</span>
                          <span className={`font-bold ${isCheapest ? "text-emerald-600" : "text-secondary-foreground"}`}>
                            {formatTuition(netCost)}
                          </span>
                        </div>
                        {fourYearTotal != null && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">4-Year Projected</span>
                            <span className={`font-semibold ${isCheapest ? "text-emerald-600" : "text-secondary-foreground"}`}>
                              {formatTuition(fourYearTotal)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Side-by-Side Comparison Table */}
      {allEntries.length >= 2 && (
        <Card variant="bento">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowRight className="h-4 w-4 text-[#2563EB]" />
                Side-by-Side Comparison
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                className="text-xs gap-1.5"
              >
                <Download className="h-3 w-3" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium text-muted-foreground min-w-[140px] sticky left-0 bg-card z-10">Category</th>
                    {allEntries.map((entry) => {
                      const key = getEntryKey(entry)
                      return (
                        <th key={key} className="pb-2 px-3 font-medium text-secondary-foreground text-right min-w-[130px]">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-xs leading-tight">{entry.universityName}</span>
                            {key === cheapestKey && allEntries.length > 1 && (
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            )}
                            {entry.isComparisonOnly && (
                              <span className="text-[10px] text-muted-foreground italic">comparing</span>
                            )}
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <ComparisonRow
                    label="Tuition"
                    values={allEntries.map((e) => formatTuition(getTuition(e.college!, useOutOfState, showGraduate)))}
                    rawValues={allEntries.map((e) => getTuition(e.college!, useOutOfState, showGraduate) ?? Infinity)}
                    highlightLowest
                  />
                  <ComparisonRow
                    label="Room & Board"
                    values={allEntries.map((e) => formatTuition(e.college!.roomAndBoard))}
                    rawValues={allEntries.map((e) => e.college!.roomAndBoard ?? Infinity)}
                    highlightLowest
                  />
                  <ComparisonRow
                    label="Books & Supplies"
                    values={allEntries.map((e) => formatTuition(e.college!.booksSupplies))}
                    rawValues={allEntries.map((e) => e.college!.booksSupplies ?? Infinity)}
                    highlightLowest
                  />
                  <ComparisonRow
                    label="Total COA"
                    values={allEntries.map((e) => formatTuition(getCOA(e.college, useOutOfState, showGraduate)))}
                    rawValues={allEntries.map((e) => getCOA(e.college, useOutOfState, showGraduate) ?? Infinity)}
                    highlightLowest
                    bold
                  />
                  <ComparisonRow
                    label="Grants/Scholarships"
                    values={allEntries.map((e) => {
                      if (e.isComparisonOnly) return "N/A"
                      const g = getGrantAid((e as CollegeApp).aidPackage)
                      return g > 0 ? formatTuition(g) : "N/A"
                    })}
                    rawValues={allEntries.map((e) => e.isComparisonOnly ? 0 : getGrantAid((e as CollegeApp).aidPackage))}
                    highlightHighest
                    colorClass="text-emerald-600"
                  />
                  <ComparisonRow
                    label="Loans"
                    values={allEntries.map((e) => {
                      if (e.isComparisonOnly) return "N/A"
                      const l = (e as CollegeApp).aidPackage?.loans ?? 0
                      return l > 0 ? formatTuition(l) : "N/A"
                    })}
                    rawValues={allEntries.map((e) => e.isComparisonOnly ? 0 : ((e as CollegeApp).aidPackage?.loans ?? 0))}
                    highlightLowest
                    colorClass="text-amber-600"
                  />
                  <ComparisonRow
                    label="Net Annual Cost"
                    values={allEntries.map((e) => {
                      const coa = getCOA(e.college, useOutOfState, showGraduate)
                      const aid = e.isComparisonOnly ? 0 : getAidTotal((e as CollegeApp).aidPackage)
                      return coa != null ? formatTuition(coa - aid) : "N/A"
                    })}
                    rawValues={allEntries.map((e) => {
                      const coa = getCOA(e.college, useOutOfState, showGraduate)
                      const aid = e.isComparisonOnly ? 0 : getAidTotal((e as CollegeApp).aidPackage)
                      return coa != null ? coa - aid : Infinity
                    })}
                    highlightLowest
                    bold
                  />
                  <ComparisonRow
                    label="4-Year Total"
                    values={allEntries.map((e) => {
                      const coa = getCOA(e.college, useOutOfState, showGraduate)
                      const aid = e.isComparisonOnly ? 0 : getAidTotal((e as CollegeApp).aidPackage)
                      return coa != null ? formatTuition((coa - aid) * 4) : "N/A"
                    })}
                    rawValues={allEntries.map((e) => {
                      const coa = getCOA(e.college, useOutOfState, showGraduate)
                      const aid = e.isComparisonOnly ? 0 : getAidTotal((e as CollegeApp).aidPackage)
                      return coa != null ? (coa - aid) * 4 : Infinity
                    })}
                    highlightLowest
                    bold
                  />
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ComparisonRow({
  label,
  values,
  rawValues,
  highlightLowest,
  highlightHighest,
  bold,
  colorClass,
}: {
  label: string
  values: string[]
  rawValues: number[]
  highlightLowest?: boolean
  highlightHighest?: boolean
  bold?: boolean
  colorClass?: string
}) {
  const validValues = rawValues.filter((v) => v !== Infinity && v > 0)
  const targetValue = highlightLowest
    ? Math.min(...(validValues.length > 0 ? validValues : [Infinity]))
    : highlightHighest
      ? Math.max(...(validValues.length > 0 ? validValues : [-Infinity]))
      : null

  return (
    <tr>
      <td className={`py-2.5 pr-4 sticky left-0 bg-card z-10 ${bold ? "font-semibold text-secondary-foreground" : "text-muted-foreground"}`}>
        {label}
      </td>
      {values.map((value, idx) => {
        const isHighlighted = targetValue != null && rawValues[idx] === targetValue && validValues.length > 1
        return (
          <td
            key={idx}
            className={`py-2.5 px-3 text-right ${
              isHighlighted
                ? "text-emerald-600 font-semibold"
                : bold
                  ? `font-semibold ${colorClass || "text-secondary-foreground"}`
                  : colorClass || "text-muted-foreground"
            }`}
          >
            {value}
          </td>
        )
      })}
    </tr>
  )
}
