"use client"

import { useState } from "react"
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

interface Scholarship {
  id: number
  name: string
  provider: string
  amount: string
  deadline: string
  matchScore: number
  field: string
  state: string
  eligibility: { label: string; met: boolean }[]
  description: string
  tab: "matched" | "all" | "saved" | "dismissed"
}

const scholarships: Scholarship[] = [
  {
    id: 1,
    name: "Gates Millennium Scholars Program",
    provider: "Bill & Melinda Gates Foundation",
    amount: "$72,000",
    deadline: "Apr 15, 2026",
    matchScore: 94,
    field: "Any",
    state: "National",
    eligibility: [
      { label: "GPA", met: true },
      { label: "Financial Need", met: true },
      { label: "Leadership", met: true },
      { label: "Minority", met: true },
    ],
    description: "Full cost of attendance scholarship for outstanding minority students with significant financial need.",
    tab: "matched",
  },
  {
    id: 2,
    name: "Jack Kent Cooke Foundation",
    provider: "Jack Kent Cooke Foundation",
    amount: "$55,000",
    deadline: "Mar 22, 2026",
    matchScore: 88,
    field: "Any",
    state: "National",
    eligibility: [
      { label: "GPA", met: true },
      { label: "Financial Need", met: true },
      { label: "SAT/ACT", met: true },
    ],
    description: "Supports high-achieving students with financial need from eighth grade through college.",
    tab: "matched",
  },
  {
    id: 3,
    name: "Coca-Cola Scholars Foundation",
    provider: "Coca-Cola Company",
    amount: "$20,000",
    deadline: "Oct 31, 2026",
    matchScore: 82,
    field: "Any",
    state: "National",
    eligibility: [
      { label: "GPA", met: true },
      { label: "Leadership", met: true },
      { label: "Community Service", met: true },
    ],
    description: "Achievement-based scholarship for well-rounded, community-oriented high school seniors.",
    tab: "matched",
  },
  {
    id: 4,
    name: "Ron Brown Scholar Program",
    provider: "CAP Charitable Foundation",
    amount: "$40,000",
    deadline: "Apr 1, 2026",
    matchScore: 76,
    field: "Any",
    state: "National",
    eligibility: [
      { label: "GPA", met: true },
      { label: "Leadership", met: true },
      { label: "African American", met: true },
      { label: "Financial Need", met: false },
    ],
    description: "Identifies and supports community-minded African Americans excelling in academics.",
    tab: "matched",
  },
  {
    id: 5,
    name: "Dell Scholars Program",
    provider: "Michael & Susan Dell Foundation",
    amount: "$20,000",
    deadline: "Dec 1, 2026",
    matchScore: 71,
    field: "Any",
    state: "National",
    eligibility: [
      { label: "GPA", met: true },
      { label: "Pell Eligible", met: true },
      { label: "College Ready", met: false },
    ],
    description: "Assists underprivileged students who demonstrate the drive to succeed and obtain a college degree.",
    tab: "all",
  },
  {
    id: 6,
    name: "QuestBridge National College Match",
    provider: "QuestBridge",
    amount: "Full Tuition",
    deadline: "Mar 27, 2026",
    matchScore: 65,
    field: "Any",
    state: "National",
    eligibility: [
      { label: "GPA", met: true },
      { label: "Income Threshold", met: true },
      { label: "First Gen", met: false },
    ],
    description: "Connects high-achieving, low-income students with full four-year scholarships at top colleges.",
    tab: "all",
  },
  {
    id: 7,
    name: "Elks National Foundation",
    provider: "Elks National Foundation",
    amount: "$50,000",
    deadline: "Apr 10, 2026",
    matchScore: 58,
    field: "Any",
    state: "National",
    eligibility: [
      { label: "GPA", met: true },
      { label: "US Citizen", met: true },
      { label: "State Residency", met: false },
    ],
    description: "Most valuable scholarships based on scholarship, leadership, and financial need.",
    tab: "all",
  },
  {
    id: 8,
    name: "Cameron Impact Scholarship",
    provider: "Bryan Cameron Education Foundation",
    amount: "$80,000",
    deadline: "Sep 14, 2026",
    matchScore: 45,
    field: "STEM",
    state: "National",
    eligibility: [
      { label: "GPA", met: true },
      { label: "STEM Focus", met: false },
      { label: "US Citizen", met: true },
    ],
    description: "Full-ride scholarship covering tuition, room, board, and books for four years.",
    tab: "all",
  },
]

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
          <MatchScoreBadge score={scholarship.matchScore} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground line-clamp-2">{scholarship.description}</p>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-[#1E3A5F]">{scholarship.amount}</span>
          <span className="text-xs text-muted-foreground">Due {scholarship.deadline}</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {scholarship.eligibility.map((elig) => (
            <span
              key={elig.label}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${
                elig.met
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {elig.met ? <CheckCircle className="h-3 w-3" /> : null}
              {elig.label} {elig.met ? "\u2713" : ""}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={onSave}>
            <Bookmark className="h-3.5 w-3.5" />
            Save
          </Button>
          <Button size="sm" className="flex-1 gap-1 bg-[#2563EB] hover:bg-[#2563EB]/90">
            <ExternalLink className="h-3.5 w-3.5" />
            Apply
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onDismiss}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ScholarshipDiscovery() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [savedIds, setSavedIds] = useState<number[]>([])
  const [dismissedIds, setDismissedIds] = useState<number[]>([])

  const handleSave = (id: number) => {
    setSavedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleDismiss = (id: number) => {
    setDismissedIds((prev) => [...prev, id])
  }

  const filterByTab = (tab: string) => {
    let filtered = scholarships.filter(
      (s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.provider.toLowerCase().includes(searchQuery.toLowerCase())
    )
    if (tab === "matched") return filtered.filter((s) => s.matchScore >= 70 && !dismissedIds.includes(s.id))
    if (tab === "saved") return filtered.filter((s) => savedIds.includes(s.id))
    if (tab === "dismissed") return filtered.filter((s) => dismissedIds.includes(s.id))
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
      </div>

      {/* Filters (collapsible) */}
      {filtersOpen && (
        <Card>
          <CardContent className="pt-0">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Amount Range</label>
                <div className="flex items-center gap-2">
                  <Input placeholder="Min" type="number" />
                  <span className="text-muted-foreground">-</span>
                  <Input placeholder="Max" type="number" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Deadline</label>
                <Input type="date" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Field of Study</label>
                <Input placeholder="e.g. STEM, Arts, Any" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">State</label>
                <Input placeholder="e.g. National, California" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs & Grid */}
      <Tabs defaultValue="matched">
        <TabsList>
          <TabsTrigger value="matched">Matched for You</TabsTrigger>
          <TabsTrigger value="all">All Scholarships</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
        </TabsList>

        {["matched", "all", "saved", "dismissed"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
              {filterByTab(tab).map((s) => (
                <ScholarshipCard
                  key={s.id}
                  scholarship={s}
                  onSave={() => handleSave(s.id)}
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
    </div>
  )
}
