"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import LoaderOne from "@/components/ui/loader-one"
import {
  Building2,
  Search,
  Users,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Globe,
  Lock,
  Terminal,
} from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatTuition, formatAcceptanceRate, getCollegeTypeLabel } from "@/lib/college-utils"
import { formatDate } from "@/lib/format"

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
]

const COLLEGE_TYPES = [
  { value: "PUBLIC", label: "Public" },
  { value: "PRIVATE_NONPROFIT", label: "Private (Nonprofit)" },
  { value: "PRIVATE_FORPROFIT", label: "Private (For-Profit)" },
]

interface CollegeRecord {
  id: string
  name: string
  city: string | null
  state: string | null
  type: string | null
  acceptanceRate: number | null
  outOfStateTuition: number | null
  inStateTuition: number | null
  enrollment: number | null
  lastSyncedAt: string
  _count: { applications: number }
}

interface Stats {
  total: number
  publicCount: number
  privateCount: number
  withApplications: number
  lastSyncedAt: string | null
}

const PAGE_SIZE = 50

export default function AdminCollegesPage() {
  const router = useRouter()
  const [colleges, setColleges] = useState<CollegeRecord[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [stateFilter, setStateFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [offset, setOffset] = useState(0)
  const [sortBy, setSortBy] = useState<string>("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const fetchStats = useCallback(() => {
    fetch("/api/colleges/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {})
  }, [])

  const fetchColleges = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set("limit", String(PAGE_SIZE))
    params.set("offset", String(offset))
    if (search.trim()) params.set("q", search.trim())
    if (stateFilter) params.set("state", stateFilter)
    if (typeFilter) params.set("type", typeFilter)

    fetch(`/api/colleges?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setColleges(data.colleges ?? [])
        setTotal(data.total ?? 0)
        setLoading(false)
      })
      .catch(() => {
        toast.error("Failed to load colleges")
        setLoading(false)
      })
  }, [offset, search, stateFilter, typeFilter])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchColleges()
    }, search ? 400 : 0)
    return () => clearTimeout(timeout)
  }, [fetchColleges])

  // Reset to first page when filters change
  useEffect(() => {
    setOffset(0)
  }, [search, stateFilter, typeFilter])

  const sortedColleges = [...colleges].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1
    switch (sortBy) {
      case "name":
        return dir * (a.name || "").localeCompare(b.name || "")
      case "state":
        return dir * (a.state || "").localeCompare(b.state || "")
      case "type":
        return dir * (a.type || "").localeCompare(b.type || "")
      case "acceptanceRate":
        return dir * ((a.acceptanceRate ?? 999) - (b.acceptanceRate ?? 999))
      case "tuition":
        return dir * ((a.outOfStateTuition ?? 999999) - (b.outOfStateTuition ?? 999999))
      case "enrollment":
        return dir * ((a.enrollment ?? 0) - (b.enrollment ?? 0))
      case "apps":
        return dir * ((a._count?.applications ?? 0) - (b._count?.applications ?? 0))
      default:
        return 0
    }
  })

  const toggleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(col)
      setSortDir("asc")
    }
  }

  const SortIndicator = ({ col }: { col: string }) => {
    if (sortBy !== col) return null
    return <span className="ml-1 text-[10px]">{sortDir === "asc" ? "\u25B2" : "\u25BC"}</span>
  }

  const currentPage = Math.floor(offset / PAGE_SIZE) + 1
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Colleges"
        description="Browse and manage the College Scorecard database."
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Colleges"
          value={stats?.total ?? 0}
          icon={Building2}
          index={0}
        />
        <StatCard
          title="Public"
          value={stats?.publicCount ?? 0}
          icon={Globe}
          index={1}
        />
        <StatCard
          title="Private"
          value={stats?.privateCount ?? 0}
          icon={Lock}
          index={2}
        />
        <StatCard
          title="With Student Interest"
          value={stats?.withApplications ?? 0}
          icon={Users}
          index={3}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search colleges by name..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={stateFilter} onValueChange={(v) => setStateFilter(v === "ALL" ? "" : v || "")}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All States</SelectItem>
            {US_STATES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === "ALL" ? "" : v || "")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {COLLEGE_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* College Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <LoaderOne />
            </div>
          ) : sortedColleges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Building2 className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">No colleges found</p>
              <p className="text-xs mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("name")}
                  >
                    Name <SortIndicator col="name" />
                  </TableHead>
                  <TableHead className="hidden md:table-cell">City</TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("state")}
                  >
                    State <SortIndicator col="state" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hidden lg:table-cell"
                    onClick={() => toggleSort("type")}
                  >
                    Type <SortIndicator col="type" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right"
                    onClick={() => toggleSort("acceptanceRate")}
                  >
                    Accept % <SortIndicator col="acceptanceRate" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right hidden lg:table-cell"
                    onClick={() => toggleSort("tuition")}
                  >
                    Tuition <SortIndicator col="tuition" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right hidden xl:table-cell"
                    onClick={() => toggleSort("enrollment")}
                  >
                    Enrollment <SortIndicator col="enrollment" />
                  </TableHead>
                  <TableHead className="hidden xl:table-cell">Last Synced</TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right"
                    onClick={() => toggleSort("apps")}
                  >
                    Apps <SortIndicator col="apps" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedColleges.map((college) => (
                  <TableRow
                    key={college.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/admin/colleges/${college.id}`)}
                  >
                    <TableCell className="font-medium text-[#1E3A5F] max-w-[260px] truncate">
                      {college.name}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {college.city || "\u2014"}
                    </TableCell>
                    <TableCell>{college.state || "\u2014"}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {college.type ? (
                        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700">
                          {getCollegeTypeLabel(college.type)}
                        </span>
                      ) : (
                        "\u2014"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatAcceptanceRate(college.acceptanceRate)}
                    </TableCell>
                    <TableCell className="text-right hidden lg:table-cell">
                      {formatTuition(college.outOfStateTuition)}
                    </TableCell>
                    <TableCell className="text-right hidden xl:table-cell">
                      {college.enrollment?.toLocaleString() ?? "\u2014"}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden xl:table-cell">
                      {formatDate(college.lastSyncedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {college._count?.applications > 0 ? (
                        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700">
                          {college._count.applications}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">\u2014</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {offset + 1}\u2013{Math.min(offset + PAGE_SIZE, total)} of{" "}
            {total.toLocaleString()} colleges
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0}
              onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => setOffset((o) => o + PAGE_SIZE)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Sync Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            College Scorecard Sync
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1E3A5F]/10 text-[#1E3A5F]">
              <Terminal className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-[#1A1A1A]">
                The college database is synced from the U.S. Department of Education College Scorecard API.
                Since the sync can take several minutes, it runs via the CLI.
              </p>
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 font-mono text-xs space-y-1">
                <p className="text-muted-foreground"># Set your API key first:</p>
                <p className="text-[#1A1A1A]">export SCORECARD_API_KEY=your_api_key_here</p>
                <p className="text-muted-foreground mt-2"># Then run the sync:</p>
                <p className="text-[#1A1A1A]">npm run db:seed-colleges</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Get a free API key at{" "}
                <a
                  href="https://collegescorecard.ed.gov/data/documentation/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2563EB] hover:underline"
                >
                  collegescorecard.ed.gov
                </a>
              </p>
              {stats?.lastSyncedAt && (
                <p className="text-xs text-muted-foreground">
                  Last synced: <span className="font-medium">{formatDate(stats.lastSyncedAt)}</span>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
