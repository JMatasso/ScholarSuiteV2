"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Bookmark,
  ExternalLink,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  Loader2,
  Sparkles,
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
  minGpa: number | null
  states: string[]
  tags: ScholarshipTag[]
}

interface MatchedScholarship {
  id: string
  scholarshipId: string
  score: number
  reasons: string[]
  scholarship: Scholarship
}

function MatchScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : score >= 60
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-gray-100 text-gray-600 border-gray-200"
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {score}% match
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
  if (!deadline) return "No deadline"
  return new Date(deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function ScholarshipCard({
  scholarship,
  score,
  reasons,
  onSave,
  onDismiss,
}: {
  scholarship: Scholarship
  score?: number
  reasons?: string[]
  onSave: () => void
  onDismiss: () => void
}) {
  return (
    <Card className="flex flex-col justify-between hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link href={`/student/scholarships/${scholarship.id}`}>
                <CardTitle className="text-sm leading-tight hover:text-[#2563EB] hover:underline cursor-pointer">{scholarship.name}</CardTitle>
              </Link>
              {score != null && <MatchScoreBadge score={score} />}
            </div>
            <p className="text-xs text-muted-foreground">{scholarship.provider}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground line-clamp-2">{scholarship.description || "No description available."}</p>

        {/* Match reasons */}
        {reasons && reasons.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {reasons.map((reason, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                {reason}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-[#1E3A5F]">{formatAmount(scholarship)}</span>
          <span className="text-xs text-muted-foreground">Due {formatDeadline(scholarship.deadline)}</span>
        </div>

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

        <div className="flex items-center gap-2 pt-1">
          <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={onSave}>
            <Bookmark className="h-3.5 w-3.5" />
            Save
          </Button>
          {scholarship.url ? (
            <Button
              size="sm"
              className="flex-1 gap-1 bg-[#2563EB] hover:bg-[#2563EB]/90"
              onClick={() => window.open(scholarship.url!, "_blank")}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Apply
            </Button>
          ) : (
            <Button size="sm" className="flex-1 gap-1 bg-[#2563EB] hover:bg-[#2563EB]/90" onClick={onSave}>
              <CheckCircle className="h-3.5 w-3.5" />
              Track
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" onClick={onDismiss}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
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
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")
  const [stateFilter, setStateFilter] = useState("")
  const [scoreFilter, setScoreFilter] = useState<string>("0")
  const [activeTab, setActiveTab] = useState("matched")

  const fetchScholarships = useCallback(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("search", searchQuery)
    if (stateFilter) params.set("state", stateFilter)
    if (minAmount) params.set("minAmount", minAmount)
    if (maxAmount) params.set("maxAmount", maxAmount)

    fetch(`/api/scholarships?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setScholarships(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [searchQuery, stateFilter, minAmount, maxAmount])

  const fetchMatches = useCallback(async (recompute = false) => {
    setMatchLoading(true)
    try {
      if (recompute) {
        // Recompute matches
        const res = await fetch("/api/scholarships/match", { method: "POST" })
        const data = await res.json()
        setMatches(data.matches || [])
        setProfileIncomplete(data.profileIncomplete || false)
        setMissingFields(data.missingFields || [])
        if (recompute && data.matches?.length > 0) {
          toast.success(`Found ${data.matches.length} matching scholarships`)
        }
      } else {
        // Fetch cached matches
        const params = new URLSearchParams()
        if (scoreFilter !== "0") params.set("minScore", scoreFilter)
        const res = await fetch(`/api/scholarships/match?${params.toString()}`)
        const data = await res.json()
        setMatches(data.matches || [])
        setProfileIncomplete(data.profileIncomplete || false)
        setMissingFields(data.missingFields || [])

        // Auto-compute if no cached matches
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

  useEffect(() => {
    fetchScholarships()
    fetchMatches(false)
  }, [fetchScholarships, fetchMatches])

  const handleSave = async (scholarship: Scholarship) => {
    if (savedIds.includes(scholarship.id)) {
      setSavedIds((prev) => prev.filter((x) => x !== scholarship.id))
      return
    }
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scholarshipId: scholarship.id }),
    })
    if (res.ok) {
      setSavedIds((prev) => [...prev, scholarship.id])
      toast.success(`"${scholarship.name}" added to applications`)
    } else {
      toast.error("Failed to save scholarship")
    }
  }

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => [...prev, id])
  }

  const filteredScholarships = scholarships.filter(
    (s) =>
      !dismissedIds.includes(s.id) &&
      (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.provider || "").toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredMatches = matches.filter(
    (m) =>
      !dismissedIds.includes(m.scholarship.id) &&
      (m.scholarship.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.scholarship.provider || "").toLowerCase().includes(searchQuery.toLowerCase()))
  )

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
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
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

      {/* Search bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search scholarships by name, provider, or field..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchScholarships()}
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
        <Button onClick={fetchScholarships} className="bg-[#2563EB] hover:bg-[#2563EB]/90">
          Search
        </Button>
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

      {/* Tabs & Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <p className="text-sm">Loading scholarships...</p>
        </div>
      ) : (
        <div>
          {/* Custom tab bar */}
          <div className="flex gap-1 border-b border-border pb-px mb-4">
            {[
              { value: "matched", label: `Matched for You (${filteredMatches.length})`, icon: Sparkles },
              { value: "all", label: `All Scholarships (${filteredScholarships.length})` },
              { value: "saved", label: `Saved (${savedIds.length})` },
              { value: "dismissed", label: "Dismissed" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.value
                    ? "text-[#2563EB] border-b-2 border-[#2563EB] bg-[#2563EB]/5"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon && <tab.icon className="h-3.5 w-3.5" />}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Matched tab */}
          {activeTab === "matched" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {matchLoading ? (
                <div className="col-span-full flex justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredMatches.length > 0 ? (
                filteredMatches.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <ScholarshipCard
                      scholarship={m.scholarship}
                      score={m.score}
                      reasons={m.reasons}
                      onSave={() => handleSave(m.scholarship)}
                      onDismiss={() => handleDismiss(m.scholarship.id)}
                    />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Sparkles className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm">No matched scholarships yet.</p>
                  <p className="text-xs mt-1">Complete your profile and click &quot;Refresh Matches&quot; to find scholarships.</p>
                </div>
              )}
            </div>
          )}

          {/* All tab */}
          {activeTab === "all" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredScholarships.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ScholarshipCard
                    scholarship={s}
                    onSave={() => handleSave(s)}
                    onDismiss={() => handleDismiss(s.id)}
                  />
                </motion.div>
              ))}
              {filteredScholarships.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Search className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm">No scholarships found.</p>
                </div>
              )}
            </div>
          )}

          {/* Saved tab */}
          {activeTab === "saved" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {scholarships.filter((s) => savedIds.includes(s.id)).map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                >
                  <ScholarshipCard scholarship={s} onSave={() => handleSave(s)} onDismiss={() => handleDismiss(s.id)} />
                </motion.div>
              ))}
              {savedIds.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Bookmark className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm">No saved scholarships yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Dismissed tab */}
          {activeTab === "dismissed" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {scholarships.filter((s) => dismissedIds.includes(s.id)).map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                >
                  <ScholarshipCard scholarship={s} onSave={() => handleSave(s)} onDismiss={() => handleDismiss(s.id)} />
                </motion.div>
              ))}
              {dismissedIds.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <X className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm">No dismissed scholarships.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
