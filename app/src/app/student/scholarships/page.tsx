"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Search,
  ExternalLink,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowUpDown,
  Plus,
  Heart,
  ListPlus,
  Check,
  Trash2,
  Eye,
  MapPin,
  Bell,
  BellOff,
} from "lucide-react"
import { toast } from "sonner"
import { LearnMoreBanner } from "@/components/ui/learn-more-banner"

interface ScholarshipTag {
  id: string
  name: string
}

interface Scholarship {
  id: string
  name: string
  provider: string
  amount: number | null
  amountMax: number | null
  deadline: string | null
  description: string | null
  url: string | null
  sourceUrl: string | null
  minGpa: number | null
  states: string[]
  tags: ScholarshipTag[]
  source?: string
  county?: string | null
  cycleStatus?: string | null
  cycleYear?: string | null
}

interface MatchedScholarship {
  id: string
  scholarshipId: string
  score: number
  reasons: string[]
  scholarship: Scholarship
}

interface SavedApplication {
  id: string
  scholarshipId: string
}

function MatchScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : score >= 60
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-gray-100 text-gray-600 border-gray-200"
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${color}`}>
      {score}%
    </span>
  )
}

function formatAmount(scholarship: Scholarship): string {
  if (!scholarship.amount) return "Varies"
  if (scholarship.amountMax && scholarship.amountMax !== scholarship.amount) {
    return `$${scholarship.amount.toLocaleString()} - $${scholarship.amountMax.toLocaleString()}`
  }
  return `$${scholarship.amount.toLocaleString()}`
}

function formatDeadline(deadline: string | null): string {
  if (!deadline) return "—"
  return new Date(deadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

function SortButton({
  field,
  currentField,
  asc,
  onSort,
  children,
}: {
  field: string
  currentField: string
  asc: boolean
  onSort: (field: string) => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={cn(
        "flex items-center gap-1 text-xs font-medium uppercase tracking-wide",
        currentField === field ? "text-[#2563EB]" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
      {currentField === field ? (
        asc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3" />
      )}
    </button>
  )
}

function ScholarshipRow({
  scholarship,
  score,
  reasons,
  isNew,
  isSaved,
  applicationId,
  expanded,
  onToggleExpand,
  onAdd,
  onRemove,
}: {
  scholarship: Scholarship
  score?: number
  reasons?: string[]
  isNew?: boolean
  isSaved: boolean
  applicationId?: string
  expanded: boolean
  onToggleExpand: () => void
  onAdd: () => void
  onRemove: () => void
}) {
  return (
    <div className="border-b border-border/30 last:border-b-0">
      <div
        className={cn(
          "grid min-w-[700px] grid-cols-[auto_1fr_120px_160px_auto_auto] gap-4 px-4 py-3 items-center transition-colors cursor-pointer",
          expanded ? "bg-muted/30" : "hover:bg-muted/20"
        )}
        onClick={onToggleExpand}
      >
        {/* Expand chevron */}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform shrink-0",
            expanded && "rotate-180"
          )}
        />

        {/* Name + Provider */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/student/scholarships/${scholarship.id}`}
              className="text-sm font-semibold text-[#2563EB] hover:underline truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {scholarship.name}
            </Link>
            {scholarship.url && (
              <a
                href={scholarship.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-[#2563EB] shrink-0"
                onClick={(e) => e.stopPropagation()}
                title="Visit scholarship website"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {isNew && (
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold bg-[#2563EB] text-white uppercase">
                New
              </span>
            )}
            {score != null && <MatchScoreBadge score={score} />}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{scholarship.provider}</p>
        </div>

        {/* Amount */}
        <span className="text-sm font-medium text-foreground">{formatAmount(scholarship)}</span>

        {/* Deadline */}
        <span className="text-xs text-muted-foreground">{formatDeadline(scholarship.deadline)}</span>

        {/* Add / In My List */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {isSaved ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-emerald-600 hover:text-rose-600 hover:bg-rose-50 group"
              onClick={onRemove}
              title="Remove from My List"
            >
              <Check className="h-3.5 w-3.5 group-hover:hidden" />
              <Trash2 className="h-3.5 w-3.5 hidden group-hover:block" />
              <span className="group-hover:hidden">In My List</span>
              <span className="hidden group-hover:inline">Remove</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={onAdd}
            >
              <ListPlus className="h-3.5 w-3.5" />
              Add to My List
            </Button>
          )}
        </div>

        {/* View button */}
        <div onClick={(e) => e.stopPropagation()}>
          <Link href={`/student/scholarships/${scholarship.id}`}>
            <Button variant="outline" size="sm">
              View
            </Button>
          </Link>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="px-4 pb-4 pl-4 sm:pl-12"
        >
          <div className="rounded-lg bg-muted/20 border border-border/50 p-4 space-y-3">
            {scholarship.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {scholarship.description.length > 300
                  ? scholarship.description.slice(0, 300) + "..."
                  : scholarship.description}
              </p>
            )}
            {!scholarship.description && (
              <p className="text-sm text-muted-foreground italic">No description available.</p>
            )}

            {/* Match reasons */}
            {reasons && reasons.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {reasons.map((reason, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {reason}
                  </span>
                ))}
              </div>
            )}

            {/* Tags */}
            {scholarship.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {scholarship.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Quick info row */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
              {scholarship.minGpa && <span>Min GPA: {scholarship.minGpa}</span>}
              {scholarship.states.length > 0 && (
                <span>Location: {scholarship.states.slice(0, 3).join(", ")}{scholarship.states.length > 3 ? ` +${scholarship.states.length - 3}` : ""}</span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default function ScholarshipDiscovery() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([])
  const [matches, setMatches] = useState<MatchedScholarship[]>([])
  const [profileIncomplete, setProfileIncomplete] = useState(false)
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [matchLoading, setMatchLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [savedApps, setSavedApps] = useState<SavedApplication[]>([])
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")
  const [stateFilter, setStateFilter] = useState("")
  const [scoreFilter, setScoreFilter] = useState<string>("0")
  const [activeTab, setActiveTab] = useState("matched")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [allLoading, setAllLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [sortField, setSortField] = useState("deadline")
  const [sortAsc, setSortAsc] = useState(true)
  const [localScholarships, setLocalScholarships] = useState<Scholarship[]>([])
  const [localLoading, setLocalLoading] = useState(false)
  const [studentCounty, setStudentCounty] = useState<string | null>(null)
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set())
  const perPage = 20

  // Build a lookup map for saved scholarship IDs → application IDs
  const savedMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const app of savedApps) {
      map.set(app.scholarshipId, app.id)
    }
    return map
  }, [savedApps])

  // Fetch student's existing applications on load
  const fetchSavedApps = useCallback(async () => {
    try {
      const res = await fetch("/api/applications")
      const data = await res.json()
      if (Array.isArray(data)) {
        setSavedApps(data.map((a: { id: string; scholarshipId: string }) => ({
          id: a.id,
          scholarshipId: a.scholarshipId,
        })))
      }
    } catch {
      // Silently fail — non-critical
    }
  }, [])

  const fetchScholarships = useCallback((pageNum = 1) => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("search", searchQuery)
    if (stateFilter) params.set("state", stateFilter)
    if (minAmount) params.set("minAmount", minAmount)
    if (maxAmount) params.set("maxAmount", maxAmount)
    params.set("page", String(pageNum))
    params.set("limit", String(perPage))

    setAllLoading(true)
    fetch(`/api/scholarships?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setScholarships(data.scholarships || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalCount(data.pagination?.total || 0)
        setPage(pageNum)
        setLoading(false)
        setAllLoading(false)
      })
      .catch(() => { setLoading(false); setAllLoading(false) })
  }, [searchQuery, stateFilter, minAmount, maxAmount, perPage])

  const fetchMatches = useCallback(async (recompute = false) => {
    setMatchLoading(true)
    try {
      if (recompute) {
        const res = await fetch("/api/scholarships/match", { method: "POST" })
        const data = await res.json()
        setMatches(data.matches || [])
        setProfileIncomplete(data.profileIncomplete || false)
        setMissingFields(data.missingFields || [])
        if (recompute && data.matches?.length > 0) {
          toast.success(`Found ${data.matches.length} matching scholarships`)
        }
      } else {
        const params = new URLSearchParams()
        if (scoreFilter !== "0") params.set("minScore", scoreFilter)
        const res = await fetch(`/api/scholarships/match?${params.toString()}`)
        const data = await res.json()
        setMatches(data.matches || [])
        setProfileIncomplete(data.profileIncomplete || false)
        setMissingFields(data.missingFields || [])

        if (data.matches?.length === 0 && !data.profileIncomplete) {
          await fetchMatches(true)
          return
        }
      }
    } catch {
      toast.error("Failed to load matches")
    } finally {
      setMatchLoading(false)
    }
  }, [scoreFilter])

  // Fetch student county from profile
  const fetchStudentCounty = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/onboarding-status")
      const data = await res.json()
      if (data.profile?.county) {
        setStudentCounty(data.profile.county)
      }
    } catch {}
  }, [])

  // Fetch local scholarships for student's county
  const fetchLocalScholarships = useCallback(async () => {
    if (!studentCounty) return
    setLocalLoading(true)
    try {
      const res = await fetch(`/api/scholarships/local?county=${encodeURIComponent(studentCounty)}`)
      const data = await res.json()
      setLocalScholarships(Array.isArray(data) ? data : [])
    } catch {
      toast.error("Failed to load local scholarships")
    } finally {
      setLocalLoading(false)
    }
  }, [studentCounty])

  const handleNotifyMe = async (scholarshipId: string) => {
    const res = await fetch("/api/scholarships/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scholarshipId }),
    })
    if (res.ok || res.status === 409) {
      setNotifiedIds((prev) => new Set([...prev, scholarshipId]))
      toast.success("You'll be notified when this scholarship is confirmed")
    } else {
      toast.error("Failed to subscribe")
    }
  }

  useEffect(() => {
    fetchSavedApps()
    fetchScholarships(1)
    fetchMatches(false)
    fetchStudentCounty()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch local scholarships when county is known
  useEffect(() => {
    if (studentCounty) fetchLocalScholarships()
  }, [studentCounty, fetchLocalScholarships])

  const handleAdd = async (scholarship: Scholarship) => {
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scholarshipId: scholarship.id }),
    })
    if (res.status === 409) {
      toast.info(`"${scholarship.name}" is already in your list`)
      // Refresh saved apps to sync state
      fetchSavedApps()
      return
    }
    if (res.ok) {
      const data = await res.json()
      setSavedApps((prev) => [...prev, { id: data.id, scholarshipId: scholarship.id }])
      toast.success(`"${scholarship.name}" added to your list`)
    } else {
      toast.error("Failed to add scholarship")
    }
  }

  const handleRemove = async (scholarship: Scholarship) => {
    const applicationId = savedMap.get(scholarship.id)
    if (!applicationId) return

    const res = await fetch(`/api/applications/${applicationId}`, { method: "DELETE" })
    if (res.ok) {
      setSavedApps((prev) => prev.filter((a) => a.scholarshipId !== scholarship.id))
      toast.success(`"${scholarship.name}" removed from your list`)
    } else {
      toast.error("Failed to remove scholarship")
    }
  }

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => [...prev, id])
  }

  const handleSort = (field: string) => {
    if (sortField === field) setSortAsc(!sortAsc)
    else { setSortField(field); setSortAsc(true) }
  }

  const filteredMatches = useMemo(() => {
    let list = matches.filter(
      (m) =>
        !dismissedIds.includes(m.scholarship.id) &&
        (m.scholarship.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.scholarship.provider || "").toLowerCase().includes(searchQuery.toLowerCase()))
    )

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
        case "match":
          cmp = a.score - b.score
          break
      }
      return sortAsc ? cmp : -cmp
    })

    return list
  }, [matches, dismissedIds, searchQuery, sortField, sortAsc])

  // For "My List" tab, show saved scholarships from both matches and all
  const savedScholarships = useMemo(() => {
    const savedScholarshipIds = new Set(savedApps.map((a) => a.scholarshipId))
    // Combine from matches and all scholarships
    const allKnown = new Map<string, Scholarship>()
    for (const m of matches) allKnown.set(m.scholarship.id, m.scholarship)
    for (const s of scholarships) allKnown.set(s.id, s)
    return Array.from(allKnown.values()).filter((s) => savedScholarshipIds.has(s.id))
  }, [savedApps, matches, scholarships])

  const displayingFrom = (page - 1) * perPage + 1
  const displayingTo = Math.min(page * perPage, totalCount)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1E3A5F]">Scholarship Discovery</h1>
          <p className="mt-1 text-muted-foreground">Find and track scholarships tailored to your profile.</p>
        </div>
        {activeTab === "matched" && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => fetchMatches(true)}
            disabled={matchLoading}
          >
            {matchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh Matches
          </Button>
        )}
      </div>

      {/* Learn more banner */}
      <LearnMoreBanner
        title="Learn: Finding Scholarships"
        description="Discover where to look, local vs. national strategies, and scholarship types."
        href="/student/learning/scholarships"
      />

      {/* Profile incomplete banner */}
      {profileIncomplete && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-amber-200 bg-amber-50/30">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Complete your profile for better matches</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Missing: {missingFields.join(", ")}
                </p>
                <Link href="/student/profile">
                  <Button size="xs" className="mt-2 bg-amber-600 hover:bg-amber-700">
                    Update Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Search bar + filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search your matches..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && activeTab === "all" && fetchScholarships(1)}
          />
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {filtersOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
        {activeTab === "all" && (
          <Button onClick={() => fetchScholarships(1)} className="bg-[#2563EB] hover:bg-[#2563EB]/90">
            Search
          </Button>
        )}
      </div>

      {/* Filters (collapsible) */}
      {filtersOpen && (
        <Card>
          <CardContent className="pt-0">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Amount Range</label>
                <div className="flex items-center gap-2">
                  <Input placeholder="Min" type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
                  <span className="text-muted-foreground">-</span>
                  <Input placeholder="Max" type="number" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">State</label>
                <Input placeholder="e.g. National, California" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} />
              </div>
              {activeTab === "matched" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Minimum Match Score</label>
                  <select
                    value={scoreFilter}
                    onChange={(e) => { setScoreFilter(e.target.value); fetchMatches(false) }}
                    className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="0">All matches</option>
                    <option value="60">60%+ match</option>
                    <option value="80">80%+ match</option>
                  </select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs & Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <p className="text-sm">Loading scholarships...</p>
        </div>
      ) : (
        <div>
          {/* Tab bar */}
          <div className="flex gap-1 border-b border-border pb-px mb-0 overflow-x-auto flex-nowrap">
            {[
              { value: "matched", label: `Matched for You (${filteredMatches.length})`, icon: Sparkles },
              { value: "all", label: "All Scholarships" },
              { value: "local", label: studentCounty ? `Local (${studentCounty})` : "Local", icon: MapPin },
              { value: "mylist", label: `My List (${savedApps.length})`, icon: Heart },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setActiveTab(tab.value); setExpandedId(null) }}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap",
                  activeTab === tab.value
                    ? "text-[#2563EB] border-b-2 border-[#2563EB] bg-[#2563EB]/5"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.icon && <tab.icon className="h-3.5 w-3.5" />}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Matched tab */}
          {activeTab === "matched" && (
            <div className="rounded-b-xl bg-white ring-1 ring-foreground/5 overflow-hidden overflow-x-auto">
              {matchLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredMatches.length > 0 ? (
                <>
                  {/* Table header */}
                  <div className="grid min-w-[700px] grid-cols-[auto_1fr_120px_160px_auto_auto] gap-4 px-4 py-3 border-b border-border/50 bg-muted/30">
                    <span className="w-4" />
                    <SortButton field="name" currentField={sortField} asc={sortAsc} onSort={handleSort}>Name</SortButton>
                    <SortButton field="amount" currentField={sortField} asc={sortAsc} onSort={handleSort}>Award</SortButton>
                    <SortButton field="deadline" currentField={sortField} asc={sortAsc} onSort={handleSort}>Deadline</SortButton>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide w-[130px]" />
                    <span className="w-[52px]" />
                  </div>

                  <div className="text-center text-xs text-muted-foreground py-2 border-b border-border/30">
                    Displaying {filteredMatches.length} matched scholarships
                  </div>

                  {/* Rows */}
                  {filteredMatches.map((m) => (
                    <ScholarshipRow
                      key={m.id}
                      scholarship={m.scholarship}
                      score={m.score}
                      reasons={m.reasons}
                      isSaved={savedMap.has(m.scholarship.id)}
                      applicationId={savedMap.get(m.scholarship.id)}
                      expanded={expandedId === m.scholarship.id}
                      onToggleExpand={() => setExpandedId(expandedId === m.scholarship.id ? null : m.scholarship.id)}
                      onAdd={() => handleAdd(m.scholarship)}
                      onRemove={() => handleRemove(m.scholarship)}
                    />
                  ))}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Sparkles className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm">No matched scholarships yet.</p>
                  <p className="text-xs mt-1">Complete your profile and click &quot;Refresh Matches&quot; to find scholarships.</p>
                </div>
              )}
            </div>
          )}

          {/* All tab */}
          {activeTab === "all" && (
            <div className="rounded-b-xl bg-white ring-1 ring-foreground/5 overflow-hidden overflow-x-auto">
              {allLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Table header */}
                  <div className="grid min-w-[700px] grid-cols-[auto_1fr_120px_160px_auto_auto] gap-4 px-4 py-3 border-b border-border/50 bg-muted/30">
                    <span className="w-4" />
                    <SortButton field="name" currentField={sortField} asc={sortAsc} onSort={handleSort}>Name</SortButton>
                    <SortButton field="amount" currentField={sortField} asc={sortAsc} onSort={handleSort}>Award</SortButton>
                    <SortButton field="deadline" currentField={sortField} asc={sortAsc} onSort={handleSort}>Deadline</SortButton>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide w-[130px]" />
                    <span className="w-[52px]" />
                  </div>

                  {totalCount > 0 && (
                    <div className="text-center text-xs text-muted-foreground py-2 border-b border-border/30">
                      Displaying {displayingFrom} – {displayingTo} of {totalCount} Scholarships
                    </div>
                  )}

                  {/* Rows */}
                  {scholarships.map((s) => (
                    <ScholarshipRow
                      key={s.id}
                      scholarship={s}
                      isSaved={savedMap.has(s.id)}
                      applicationId={savedMap.get(s.id)}
                      expanded={expandedId === s.id}
                      onToggleExpand={() => setExpandedId(expandedId === s.id ? null : s.id)}
                      onAdd={() => handleAdd(s)}
                      onRemove={() => handleRemove(s)}
                    />
                  ))}

                  {scholarships.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Search className="h-10 w-10 mb-3 opacity-40" />
                      <p className="text-sm">No scholarships found.</p>
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 py-4 border-t border-border/30">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => fetchScholarships(page - 1)}
                        className="gap-1"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground px-3">
                        Page {page} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => fetchScholarships(page + 1)}
                        className="gap-1"
                      >
                        Next
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Local tab */}
          {activeTab === "local" && (
            <div className="rounded-b-xl bg-white ring-1 ring-foreground/5 overflow-hidden overflow-x-auto">
              {!studentCounty ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <MapPin className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm font-medium">Set your county to see local scholarships</p>
                  <p className="text-xs mt-1">Update your profile with your county to discover nearby opportunities.</p>
                  <Link href="/student/settings">
                    <Button variant="outline" size="sm" className="mt-4">Update Profile</Button>
                  </Link>
                </div>
              ) : localLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : localScholarships.length > 0 ? (
                <>
                  {/* Table header */}
                  <div className="grid min-w-[700px] grid-cols-[auto_1fr_120px_160px_auto_auto] gap-4 px-4 py-3 border-b border-border/50 bg-muted/30">
                    <span className="w-4" />
                    <SortButton field="name" currentField={sortField} asc={sortAsc} onSort={handleSort}>Name</SortButton>
                    <SortButton field="amount" currentField={sortField} asc={sortAsc} onSort={handleSort}>Award</SortButton>
                    <SortButton field="deadline" currentField={sortField} asc={sortAsc} onSort={handleSort}>Deadline</SortButton>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide w-[130px]" />
                    <span className="w-[52px]" />
                  </div>

                  {/* This Year (Confirmed) */}
                  {localScholarships.filter((s) => s.cycleStatus === "CONFIRMED").length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-emerald-50/50 border-b border-border/30">
                        <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">This Year — Confirmed</span>
                      </div>
                      {localScholarships
                        .filter((s) => s.cycleStatus === "CONFIRMED")
                        .map((s) => (
                          <ScholarshipRow
                            key={s.id}
                            scholarship={s}
                            isSaved={savedMap.has(s.id)}
                            applicationId={savedMap.get(s.id)}
                            expanded={expandedId === s.id}
                            onToggleExpand={() => setExpandedId(expandedId === s.id ? null : s.id)}
                            onAdd={() => handleAdd(s)}
                            onRemove={() => handleRemove(s)}
                          />
                        ))}
                    </>
                  )}

                  {/* Previously Available */}
                  {localScholarships.filter((s) => s.cycleStatus !== "CONFIRMED").length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-gray-50 border-b border-border/30 mt-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Previously Available</span>
                      </div>
                      {localScholarships
                        .filter((s) => s.cycleStatus !== "CONFIRMED")
                        .map((s) => (
                          <div key={s.id} className="border-b border-border/30 last:border-b-0 opacity-70">
                            <div className="grid min-w-[700px] grid-cols-[auto_1fr_120px_160px_auto_auto] gap-4 px-4 py-3 items-center">
                              <span className="w-4" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-muted-foreground truncate">{s.name}</p>
                                <p className="text-xs text-muted-foreground/60 truncate mt-0.5">{s.provider}</p>
                              </div>
                              <span className="text-sm text-muted-foreground">{formatAmount(s)}</span>
                              <span className="text-xs text-muted-foreground">Last: {formatDeadline(s.deadline)}</span>
                              <div onClick={(e) => e.stopPropagation()}>
                                {notifiedIds.has(s.id) ? (
                                  <Button variant="ghost" size="sm" className="gap-1.5 text-emerald-600" disabled>
                                    <Bell className="h-3.5 w-3.5" />
                                    Subscribed
                                  </Button>
                                ) : (
                                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleNotifyMe(s.id)}>
                                    <Bell className="h-3.5 w-3.5" />
                                    Notify Me
                                  </Button>
                                )}
                              </div>
                              <span className="w-[52px]" />
                            </div>
                          </div>
                        ))}
                    </>
                  )}

                  {/* Provider portal CTA */}
                  <div className="px-4 py-4 border-t border-border/30 bg-muted/10 text-center">
                    <p className="text-xs text-muted-foreground">
                      Don&apos;t see a scholarship you know about?{" "}
                      <Link href="/scholarships/submit" className="text-[#2563EB] hover:underline font-medium">
                        Tell us about it
                      </Link>
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <MapPin className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm font-medium">No local scholarships found in {studentCounty} yet</p>
                  <p className="text-xs mt-1">We&apos;re building our local database. Check back soon!</p>
                  <div className="mt-4">
                    <Link href="/scholarships/submit">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Plus className="h-3.5 w-3.5" />
                        Know a local scholarship? Tell us
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* My List tab */}
          {activeTab === "mylist" && (
            <div className="rounded-b-xl bg-white ring-1 ring-foreground/5 overflow-hidden overflow-x-auto">
              {savedScholarships.length > 0 ? (
                <>
                  <div className="grid min-w-[700px] grid-cols-[auto_1fr_120px_160px_auto_auto] gap-4 px-4 py-3 border-b border-border/50 bg-muted/30">
                    <span className="w-4" />
                    <SortButton field="name" currentField={sortField} asc={sortAsc} onSort={handleSort}>Name</SortButton>
                    <SortButton field="amount" currentField={sortField} asc={sortAsc} onSort={handleSort}>Award</SortButton>
                    <SortButton field="deadline" currentField={sortField} asc={sortAsc} onSort={handleSort}>Deadline</SortButton>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide w-[130px]" />
                    <span className="w-[52px]" />
                  </div>

                  <div className="text-center text-xs text-muted-foreground py-2 border-b border-border/30">
                    {savedScholarships.length} scholarship{savedScholarships.length !== 1 ? "s" : ""} in your list
                  </div>

                  {savedScholarships.map((s) => (
                    <ScholarshipRow
                      key={s.id}
                      scholarship={s}
                      isSaved={true}
                      applicationId={savedMap.get(s.id)}
                      expanded={expandedId === s.id}
                      onToggleExpand={() => setExpandedId(expandedId === s.id ? null : s.id)}
                      onAdd={() => handleAdd(s)}
                      onRemove={() => handleRemove(s)}
                    />
                  ))}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Heart className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm font-medium">No scholarships in your list yet</p>
                  <p className="text-xs mt-1">Click &quot;Add to My List&quot; on any scholarship to start tracking it.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-2"
                    onClick={() => setActiveTab("matched")}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Browse Matches
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
