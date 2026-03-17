"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "motion/react"
import {
  ArrowLeft,
  Building2,
  MapPin,
  Globe,
  Users,
  GraduationCap,
  DollarSign,
  TrendingUp,
  BookOpen,
  Percent,
  TestTube,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  formatTuition,
  formatAcceptanceRate,
  getCollegeTypeLabel,
  getLocaleLabel,
} from "@/lib/college-utils"
import { formatDate, getInitials } from "@/lib/format"

interface CollegeApplication {
  id: string
  userId: string
  universityName: string
  status: string
  classification: string | null
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
}

interface CollegeData {
  id: string
  scorecardId: number
  name: string
  alias: string | null
  city: string | null
  state: string | null
  zip: string | null
  website: string | null
  logoUrl: string | null
  type: string | null
  locale: string | null
  latitude: number | null
  longitude: number | null
  // Admissions
  acceptanceRate: number | null
  satAvg: number | null
  sat25: number | null
  sat75: number | null
  actAvg: number | null
  act25: number | null
  act75: number | null
  testOptional: boolean
  // Cost
  inStateTuition: number | null
  outOfStateTuition: number | null
  roomAndBoard: number | null
  booksSupplies: number | null
  // Size
  enrollment: number | null
  undergradPop: number | null
  studentFacultyRatio: number | null
  // Outcomes
  gradRate4yr: number | null
  gradRate6yr: number | null
  retentionRate: number | null
  medianEarnings6yr: number | null
  medianEarnings10yr: number | null
  medianDebt: number | null
  // Financial Aid
  pellPct: number | null
  fedLoanPct: number | null
  // Programs
  topPrograms: string[] | null
  // Attributes
  religiousAffiliation: string | null
  hbcu: boolean
  menOnly: boolean
  womenOnly: boolean
  // Deadlines
  rdDeadline: string | null
  eaDeadline: string | null
  edDeadline: string | null
  ed2Deadline: string | null
  fafsaDeadline: string | null
  cssProfileRequired: boolean
  // Meta
  lastSyncedAt: string
  applications: CollegeApplication[]
  _count: { applications: number }
}

const STATUS_COLORS: Record<string, string> = {
  RESEARCHING: "bg-gray-100 text-gray-600 border-gray-200",
  IN_PROGRESS: "bg-amber-100 text-amber-700 border-amber-200",
  SUBMITTED: "bg-blue-100 text-blue-700 border-blue-200",
  ACCEPTED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  DENIED: "bg-rose-100 text-rose-700 border-rose-200",
  WAITLISTED: "bg-purple-100 text-purple-700 border-purple-200",
  DEFERRED: "bg-orange-100 text-orange-700 border-orange-200",
  WITHDRAWN: "bg-gray-100 text-gray-600 border-gray-200",
}

function formatPct(val: number | null): string {
  if (val == null) return "N/A"
  return `${val.toFixed(1)}%`
}

function formatNum(val: number | null): string {
  if (val == null) return "N/A"
  return val.toLocaleString()
}

function InfoRow({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-[#1A1A1A] text-right">{value}</span>
    </div>
  )
}

export default function CollegeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [college, setCollege] = useState<CollegeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/colleges/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load college")
        return res.json()
      })
      .then((data) => {
        setCollege(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">Loading...</p>
      </div>
    )
  }

  if (error || !college) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          className="gap-2 text-muted-foreground"
          onClick={() => router.push("/admin/colleges")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Colleges
        </Button>
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <p className="text-sm">{error ?? "College not found"}</p>
        </div>
      </div>
    )
  }

  const websiteUrl = college.website
    ? college.website.startsWith("http")
      ? college.website
      : `https://${college.website}`
    : null

  const programs = Array.isArray(college.topPrograms) ? college.topPrograms : []

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        className="gap-2 text-muted-foreground"
        onClick={() => router.push("/admin/colleges")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Colleges
      </Button>

      {/* College header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1E3A5F]/10 text-[#1E3A5F]">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-[#1E3A5F]">{college.name}</h1>
                    <div className="mt-0.5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      {(college.city || college.state) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {[college.city, college.state, college.zip]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      )}
                      {college.type && (
                        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700">
                          {getCollegeTypeLabel(college.type)}
                        </span>
                      )}
                      {college.locale && (
                        <span className="text-xs">{getLocaleLabel(college.locale)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {websiteUrl && (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#2563EB] transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                      {college.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {college.hbcu && (
                    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-purple-50 text-purple-700">
                      HBCU
                    </span>
                  )}
                  {college.womenOnly && (
                    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-pink-50 text-pink-700">
                      Women Only
                    </span>
                  )}
                  {college.menOnly && (
                    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-indigo-50 text-indigo-700">
                      Men Only
                    </span>
                  )}
                  {college.testOptional && (
                    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700">
                      Test Optional
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Scorecard ID: {college.scorecardId} | Last synced:{" "}
                  {formatDate(college.lastSyncedAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Acceptance Rate"
          value={formatAcceptanceRate(college.acceptanceRate)}
          icon={Percent}
          index={0}
        />
        <StatCard
          title="Enrollment"
          value={college.enrollment?.toLocaleString() ?? "N/A"}
          icon={Users}
          index={1}
        />
        <StatCard
          title="In-State Tuition"
          value={formatTuition(college.inStateTuition)}
          icon={DollarSign}
          index={2}
        />
        <StatCard
          title="Student Interest"
          value={college._count.applications}
          icon={GraduationCap}
          index={3}
        />
      </div>

      {/* Detail sections grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Admissions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Admissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow label="Acceptance Rate" value={formatAcceptanceRate(college.acceptanceRate)} />
            <InfoRow
              label="SAT Range"
              value={
                college.sat25 != null && college.sat75 != null
                  ? `${college.sat25} - ${college.sat75}`
                  : "N/A"
              }
            />
            <InfoRow label="SAT Average" value={college.satAvg?.toString() ?? "N/A"} />
            <InfoRow
              label="ACT Range"
              value={
                college.act25 != null && college.act75 != null
                  ? `${college.act25} - ${college.act75}`
                  : "N/A"
              }
            />
            <InfoRow label="ACT Average" value={college.actAvg?.toString() ?? "N/A"} />
            <InfoRow
              label="Test Optional"
              value={college.testOptional ? "Yes" : "No"}
            />
          </CardContent>
        </Card>

        {/* Cost */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Cost
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow label="In-State Tuition" value={formatTuition(college.inStateTuition)} />
            <InfoRow label="Out-of-State Tuition" value={formatTuition(college.outOfStateTuition)} />
            <InfoRow label="Room & Board" value={formatTuition(college.roomAndBoard)} />
            <InfoRow label="Books & Supplies" value={formatTuition(college.booksSupplies)} />
            <InfoRow
              label="CSS Profile Required"
              value={college.cssProfileRequired ? "Yes" : "No"}
            />
          </CardContent>
        </Card>

        {/* Outcomes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Outcomes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow label="4-Year Grad Rate" value={formatPct(college.gradRate4yr)} />
            <InfoRow label="6-Year Grad Rate" value={formatPct(college.gradRate6yr)} />
            <InfoRow label="Retention Rate" value={formatPct(college.retentionRate)} />
            <InfoRow
              label="Median Earnings (6yr)"
              value={formatTuition(college.medianEarnings6yr)}
            />
            <InfoRow
              label="Median Earnings (10yr)"
              value={formatTuition(college.medianEarnings10yr)}
            />
            <InfoRow label="Median Debt" value={formatTuition(college.medianDebt)} />
          </CardContent>
        </Card>

        {/* Financial Aid */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Financial Aid
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow label="Pell Grant Recipients" value={formatPct(college.pellPct)} />
            <InfoRow label="Federal Loan Recipients" value={formatPct(college.fedLoanPct)} />
          </CardContent>
        </Card>

        {/* Size & Demographics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide flex items-center gap-2">
              <Users className="h-4 w-4" />
              Size & Demographics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow label="Total Enrollment" value={formatNum(college.enrollment)} />
            <InfoRow label="Undergrad Population" value={formatNum(college.undergradPop)} />
            <InfoRow
              label="Student:Faculty Ratio"
              value={
                college.studentFacultyRatio
                  ? `${college.studentFacultyRatio}:1`
                  : "N/A"
              }
            />
            {college.religiousAffiliation && (
              <InfoRow
                label="Religious Affiliation"
                value={college.religiousAffiliation}
              />
            )}
          </CardContent>
        </Card>

        {/* Deadlines */}
        {(college.rdDeadline ||
          college.eaDeadline ||
          college.edDeadline ||
          college.ed2Deadline ||
          college.fafsaDeadline) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide">
                Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {college.rdDeadline && (
                <InfoRow label="Regular Decision" value={formatDate(college.rdDeadline)} />
              )}
              {college.eaDeadline && (
                <InfoRow label="Early Action" value={formatDate(college.eaDeadline)} />
              )}
              {college.edDeadline && (
                <InfoRow label="Early Decision" value={formatDate(college.edDeadline)} />
              )}
              {college.ed2Deadline && (
                <InfoRow label="Early Decision II" value={formatDate(college.ed2Deadline)} />
              )}
              {college.fafsaDeadline && (
                <InfoRow label="FAFSA Priority" value={formatDate(college.fafsaDeadline)} />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Programs */}
      {programs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Top Programs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {programs.map((program, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700"
                >
                  {String(program)}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Interest */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Student Interest ({college.applications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {college.applications.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <p className="text-sm">No students have added this college to their list yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {college.applications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center gap-4 py-3 px-1 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => router.push(`/admin/students/${app.user.id}`)}
                >
                  <Avatar>
                    {app.user.image && (
                      <AvatarImage src={app.user.image} alt={app.user.name} />
                    )}
                    <AvatarFallback>{getInitials(app.user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A1A1A] truncate">
                      {app.user.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {app.user.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {app.classification && (
                      <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700">
                        {app.classification}
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                        STATUS_COLORS[app.status] ?? "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {app.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
