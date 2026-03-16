"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Search,
  Bookmark,
  ExternalLink,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  CheckCircle,
} from "lucide-react"
import { toast } from "sonner"

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
  onSave,
  onDismiss,
}: {
  scholarship: Scholarship
  onSave: () => void
  onDismiss: () => void
}) {
  return (
    <Card className="flex flex-col justify-between hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-sm leading-tight">{scholarship.name}</CardTitle>
            <p className="text-xs text-muted-foreground">{scholarship.provider}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground line-clamp-2">{scholarship.description || "No description available."}</p>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-[#1E3A5F]">{formatAmount(scholarship)}</span>
          <span className="text-xs text-muted-foreground">Due {formatDeadline(scholarship.deadline)}</span>
        </div>

        {scholarship.tags.length > 0 && (
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
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")
  const [stateFilter, setStateFilter] = useState("")

  const fetchScholarships = () => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("search", searchQuery)
    if (stateFilter) params.set("state", stateFilter)
    if (minAmount) params.set("minAmount", minAmount)
    if (maxAmount) params.set("maxAmount", maxAmount)

    setLoading(true)
    fetch(`/api/scholarships?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setScholarships(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchScholarships()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const filterByTab = (tab: string) => {
    const filtered = scholarships.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.provider.toLowerCase().includes(searchQuery.toLowerCase())
    )
    if (tab === "saved") return filtered.filter((s) => savedIds.includes(s.id))
    if (tab === "dismissed") return filtered.filter((s) => dismissedIds.includes(s.id))
    if (tab === "matched") return filtered.filter((s) => !dismissedIds.includes(s.id)).slice(0, 10)
    return filtered.filter((s) => !dismissedIds.includes(s.id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1E3A5F]">Scholarship Discovery</h1>
        <p className="mt-1 text-muted-foreground">Find and track scholarships tailored to your profile.</p>
      </div>

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
                  <Input
                    placeholder="Min"
                    type="number"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    placeholder="Max"
                    type="number"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">State</label>
                <Input
                  placeholder="e.g. National, California"
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                />
              </div>
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
        <Tabs defaultValue="matched">
          <TabsList>
            <TabsTrigger value="matched">Matched for You</TabsTrigger>
            <TabsTrigger value="all">All Scholarships</TabsTrigger>
            <TabsTrigger value="saved">Saved ({savedIds.length})</TabsTrigger>
            <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
          </TabsList>

          {["matched", "all", "saved", "dismissed"].map((tab) => (
            <TabsContent key={tab} value={tab}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
                {filterByTab(tab).map((s) => (
                  <ScholarshipCard
                    key={s.id}
                    scholarship={s}
                    onSave={() => handleSave(s)}
                    onDismiss={() => handleDismiss(s.id)}
                  />
                ))}
                {filterByTab(tab).length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Search className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm">No scholarships found in this category.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
