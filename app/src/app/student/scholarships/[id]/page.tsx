"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  ExternalLink,
  Bookmark,
  Calendar,
  DollarSign,
  GraduationCap,
  MapPin,
  Globe,
  Star,
  CheckCircle,
  AlertCircle,
  Clock,
  BookOpen,
  Users,
  TrendingUp,
  FileText,
  Award,
  Shield,
} from "@/lib/icons"
import { toast } from "sonner"

interface ScholarshipTag {
  id: string
  name: string
}

interface ScholarshipDetail {
  id: string
  name: string
  provider: string | null
  amount: number | null
  amountMax: number | null
  deadline: string | null
  description: string | null
  url: string | null
  isRecurring: boolean
  minGpa: number | null
  maxGpa: number | null
  states: string[]
  citizenships: string[]
  gradeLevels: number[]
  fieldsOfStudy: string[]
  ethnicities: string[]
  requiresFirstGen: boolean
  requiresPell: boolean
  requiresFinancialNeed: boolean
  minSat: number | null
  minAct: number | null
  applicationYear: string | null
  sourceUrl: string | null
  tags: ScholarshipTag[]
}

function formatAmount(s: ScholarshipDetail): string {
  if (!s.amount) return "Varies"
  if (s.amountMax && s.amountMax !== s.amount) {
    return `$${s.amount.toLocaleString()} – $${s.amountMax.toLocaleString()}`
  }
  return `$${s.amount.toLocaleString()}`
}

function formatDeadline(deadline: string | null): string {
  if (!deadline) return "No deadline listed"
  return new Date(deadline).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function daysUntil(deadline: string | null): number | null {
  if (!deadline) return null
  const diff = new Date(deadline).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function gradeLabel(level: number): string {
  const labels: Record<number, string> = {
    9: "Freshman",
    10: "Sophomore",
    11: "Junior",
    12: "Senior",
    13: "College Freshman",
    14: "College Sophomore",
    15: "College Junior",
    16: "College Senior",
    17: "Graduate Student",
  }
  return labels[level] || `Grade ${level}`
}

function DeadlineCountdown({ deadline }: { deadline: string | null }) {
  const days = daysUntil(deadline)
  if (days === null) return null

  if (days < 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        Deadline has passed
      </div>
    )
  }
  if (days <= 7) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700">
        <AlertCircle className="h-4 w-4" />
        {days === 0 ? "Due today!" : `${days} day${days > 1 ? "s" : ""} left`}
      </div>
    )
  }
  if (days <= 30) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm font-medium text-amber-700">
        <Clock className="h-4 w-4" />
        {days} days left
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700">
      <Clock className="h-4 w-4" />
      {days} days left
    </div>
  )
}

function EligibilityItem({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-secondary-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

export default function ScholarshipDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [scholarship, setScholarship] = useState<ScholarshipDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/scholarships/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found")
        return res.json()
      })
      .then(setScholarship)
      .catch(() => toast.error("Scholarship not found"))
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async () => {
    if (!scholarship) return
    setSaving(true)
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scholarshipId: scholarship.id }),
    })
    if (res.ok) {
      toast.success(`"${scholarship.name}" added to your applications`)
    } else {
      const data = await res.json()
      toast.error(data.error || "Failed to save")
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!scholarship) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mb-4 opacity-40" />
        <p className="text-lg font-medium">Scholarship not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    )
  }

  const hasEligibility =
    scholarship.minGpa ||
    scholarship.maxGpa ||
    scholarship.states.length > 0 ||
    scholarship.citizenships.length > 0 ||
    scholarship.gradeLevels.length > 0 ||
    scholarship.fieldsOfStudy.length > 0 ||
    scholarship.ethnicities.length > 0 ||
    scholarship.requiresFirstGen ||
    scholarship.requiresPell ||
    scholarship.requiresFinancialNeed ||
    scholarship.minSat ||
    scholarship.minAct

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" size="sm" className="gap-1 mb-2 -ml-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Back to Scholarships
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-secondary-foreground">{scholarship.name}</h1>
            <p className="text-muted-foreground">
              {scholarship.provider || "Unknown Provider"}
              {scholarship.applicationYear && (
                <span className="ml-2 text-xs bg-accent text-blue-700 rounded px-1.5 py-0.5">{scholarship.applicationYear}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" className="gap-2" onClick={handleSave} disabled={saving}>
              <Bookmark className="h-4 w-4" />
              Save to Applications
            </Button>
            {scholarship.url && (
              <Button
                className="gap-2"
                onClick={() => window.open(scholarship.url!, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
                Apply Now
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Key stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-wrap items-center gap-4"
      >
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5">
          <DollarSign className="h-5 w-5 text-emerald-600" />
          <div>
            <p className="text-xs text-emerald-600">Award Amount</p>
            <p className="text-lg font-bold text-emerald-700">{formatAmount(scholarship)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-accent border border-blue-200 px-4 py-2.5">
          <Calendar className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-xs text-blue-600">Deadline</p>
            <p className="text-sm font-semibold text-blue-700">{formatDeadline(scholarship.deadline)}</p>
          </div>
        </div>

        <DeadlineCountdown deadline={scholarship.deadline} />

        {scholarship.isRecurring && (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200">
            <TrendingUp className="h-3 w-3 mr-1" />
            Renewable
          </Badge>
        )}
      </motion.div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — description + eligibility */}
        <motion.div
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Description */}
          <Card variant="bento">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-secondary-foreground" />
                About This Scholarship
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {scholarship.description || "No detailed description available for this scholarship."}
              </p>
            </CardContent>
          </Card>

          {/* Eligibility */}
          <Card variant="bento">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-secondary-foreground" />
                Eligibility Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasEligibility ? (
                <div className="grid gap-0 sm:grid-cols-2 divide-y sm:divide-y-0">
                  <div className="space-y-0 divide-y">
                    {scholarship.minGpa && (
                      <EligibilityItem
                        icon={Star}
                        label="Minimum GPA"
                        value={scholarship.maxGpa ? `${scholarship.minGpa} – ${scholarship.maxGpa}` : `${scholarship.minGpa}+`}
                      />
                    )}
                    {scholarship.gradeLevels.length > 0 && (
                      <EligibilityItem
                        icon={GraduationCap}
                        label="Grade Levels"
                        value={scholarship.gradeLevels.map(gradeLabel).join(", ")}
                      />
                    )}
                    {scholarship.states.length > 0 && (
                      <EligibilityItem
                        icon={MapPin}
                        label="Location"
                        value={scholarship.states.join(", ")}
                      />
                    )}
                    {scholarship.citizenships.length > 0 && (
                      <EligibilityItem
                        icon={Globe}
                        label="Citizenship"
                        value={scholarship.citizenships.join(", ")}
                      />
                    )}
                    {scholarship.fieldsOfStudy.length > 0 && (
                      <EligibilityItem
                        icon={BookOpen}
                        label="Fields of Study"
                        value={scholarship.fieldsOfStudy.join(", ")}
                      />
                    )}
                  </div>
                  <div className="space-y-0 divide-y">
                    {scholarship.ethnicities.length > 0 && (
                      <EligibilityItem
                        icon={Users}
                        label="Demographics"
                        value={scholarship.ethnicities.join(", ")}
                      />
                    )}
                    {scholarship.minSat && (
                      <EligibilityItem icon={Award} label="Minimum SAT" value={`${scholarship.minSat}+`} />
                    )}
                    {scholarship.minAct && (
                      <EligibilityItem icon={Award} label="Minimum ACT" value={`${scholarship.minAct}+`} />
                    )}
                    {scholarship.requiresFirstGen && (
                      <EligibilityItem icon={CheckCircle} label="Special Requirement" value="First-generation college student" />
                    )}
                    {scholarship.requiresPell && (
                      <EligibilityItem icon={CheckCircle} label="Special Requirement" value="Pell Grant eligible" />
                    )}
                    {scholarship.requiresFinancialNeed && (
                      <EligibilityItem icon={CheckCircle} label="Special Requirement" value="Demonstrated financial need" />
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <Shield className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">No specific eligibility requirements listed.</p>
                  <p className="text-xs mt-1">Check the scholarship website for full details.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {scholarship.tags.length > 0 && (
            <Card variant="bento">
              <CardHeader>
                <CardTitle className="text-sm">Categories & Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {scholarship.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium bg-accent text-blue-700 border border-blue-200"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Right sidebar — quick actions */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {/* Quick actions card */}
          <Card variant="bento" className="border-[#2563EB]/20 bg-accent/30">
            <CardHeader>
              <CardTitle className="text-sm text-secondary-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full gap-2" onClick={handleSave} disabled={saving}>
                <Bookmark className="h-4 w-4" />
                Save to My Applications
              </Button>
              {scholarship.url && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => window.open(scholarship.url!, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                  Visit Scholarship Website
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Quick facts card */}
          <Card variant="bento">
            <CardHeader>
              <CardTitle className="text-sm">Quick Facts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold text-secondary-foreground">{formatAmount(scholarship)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Renewable</span>
                <span className="font-medium">{scholarship.isRecurring ? "Yes" : "No"}</span>
              </div>
              {scholarship.minGpa && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Min. GPA</span>
                  <span className="font-medium">{scholarship.minGpa}</span>
                </div>
              )}
              {scholarship.states.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium text-right">{scholarship.states.length > 2 ? `${scholarship.states.slice(0, 2).join(", ")} +${scholarship.states.length - 2}` : scholarship.states.join(", ")}</span>
                </div>
              )}
              {scholarship.applicationYear && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Year</span>
                  <span className="font-medium">{scholarship.applicationYear}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Source info */}
          {scholarship.sourceUrl && (
            <Card variant="bento">
              <CardHeader>
                <CardTitle className="text-sm">Source</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground break-all">{scholarship.sourceUrl}</p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  )
}
