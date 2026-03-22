"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs as VercelTabs } from "@/components/ui/vercel-tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { CollegeAutocomplete, type CollegeResult } from "@/components/ui/college-autocomplete"
import { formatCurrency } from "@/lib/format"
import { formatTuition } from "@/lib/college-utils"
import { LearnMoreBanner } from "@/components/ui/learn-more-banner"
import { CollegeCostComparison } from "@/components/ui/college-cost-comparison"
import { ScholarshipOffset } from "@/components/ui/scholarship-offset"
import { SemesterBudget } from "@/components/ui/semester-budget"
import { BudgetOverview } from "@/components/ui/budget-overview"
import { toast } from "sonner"
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  GraduationCap,
  Award,
  Plus,
  RefreshCw,
  Loader2,
} from "@/lib/icons"

interface IncomeSource {
  id: string
  name: string
  amount: number
  type: string
  status: string
  isRecurring: boolean
}

interface CustomExpense {
  id: string
  name: string
  amount: number
}

interface Semester {
  id: string
  name: string
  type: string
  order: number
  isCustom: boolean
  tuition: number
  housing: number
  food: number
  transportation: number
  books: number
  personal: number
  other: number
  incomeSources: IncomeSource[]
  customExpenses: CustomExpense[]
}

interface FinancialPlan {
  id: string
  userId: string
  semesters: Semester[]
}

/* eslint-disable @typescript-eslint/no-explicit-any */
interface CollegeApp {
  id: string
  universityName: string
  classification?: string | null
  aidPackage?: any
  netCostEstimate?: number | null
  status: string
  college?: any
}

interface ScholarshipApp {
  id: string
  status: string
  amountAwarded?: number | null
  isRecurring: boolean
  scholarship: {
    name: string
    amount?: number | null
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function getSemesterTotal(sem: Semester): number {
  return sem.tuition + sem.housing + sem.food + sem.transportation + sem.books + sem.personal + sem.other
}

function getSemesterAid(sem: Semester): number {
  return sem.incomeSources.reduce((a, s) => a + s.amount, 0)
}

export default function FinancialPlanPage() {
  const [plan, setPlan] = useState<FinancialPlan | null>(null)
  const [collegeApps, setCollegeApps] = useState<CollegeApp[]>([])
  const [awardedScholarships, setAwardedScholarships] = useState<ScholarshipApp[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("college-costs")
  const [creating, setCreating] = useState(false)

  const loadData = useCallback(() => {
    Promise.all([
      fetch("/api/financial").then((res) => res.json()).catch(() => null),
      fetch("/api/college-applications").then((res) => res.json()).catch(() => []),
      fetch("/api/applications").then((res) => res.json()).catch(() => []),
    ])
      .then(([financialData, collegeData, scholarshipData]) => {
        setPlan(financialData && financialData.id ? financialData : null)
        setCollegeApps(Array.isArray(collegeData) ? collegeData : [])
        const awarded = Array.isArray(scholarshipData)
          ? scholarshipData.filter((a: ScholarshipApp) => a.status === "AWARDED")
          : []
        setAwardedScholarships(awarded)
        setLoading(false)
      })
      .catch(() => {
        toast.error("Failed to load financial data")
        setLoading(false)
      })
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Reload financial plan after scholarship sync
  const handleBudgetSynced = useCallback(() => {
    fetch("/api/financial")
      .then((res) => res.json())
      .then((data) => {
        if (data?.id) setPlan(data)
      })
      .catch(() => {})
  }, [])

  const createPlanFromCollege = async (collegeId: string, collegeName: string) => {
    setCreating(true)
    try {
      const res = await fetch("/api/financial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeId }),
      })
      if (!res.ok) throw new Error()
      const newPlan = await res.json()
      setPlan(newPlan)
      toast.success(`Budget created from ${collegeName}`)
    } catch {
      toast.error("Failed to create budget")
    } finally {
      setCreating(false)
    }
  }

  const createBlankPlan = async () => {
    setCreating(true)
    try {
      const res = await fetch("/api/financial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blank: true }),
      })
      if (!res.ok) throw new Error()
      const newPlan = await res.json()
      setPlan(newPlan)
      toast.success("Blank budget created — fill in your costs manually")
    } catch {
      toast.error("Failed to create budget")
    } finally {
      setCreating(false)
    }
  }

  // Prepare scholarship award data
  const awardItems = awardedScholarships.map((a) => ({
    id: a.id,
    scholarshipName: a.scholarship.name,
    amountAwarded: a.amountAwarded ?? null,
    scholarshipAmount: a.scholarship.amount ?? null,
    isRecurring: a.isRecurring,
  }))

  const totalScholarships = awardItems.reduce(
    (sum, a) => sum + (a.amountAwarded ?? a.scholarshipAmount ?? 0),
    0
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80 mt-2" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  const hasFinancialPlan = plan !== null
  const hasAwards = awardItems.length > 0

  const semesters = plan?.semesters ?? []
  const totalCost = semesters.reduce((a, s) => a + getSemesterTotal(s), 0)
  const totalAid = semesters.reduce((a, s) => a + getSemesterAid(s), 0)
  const remainingGap = totalCost - totalAid - totalScholarships

  const uniqueSources = semesters
    .flatMap((s) => s.incomeSources)
    .filter((src, idx, arr) => arr.findIndex((s) => s.id === src.id) === idx)

  // Semesters for scholarship allocation (simple id+name)
  const semesterList = semesters.map((s) => ({ id: s.id, name: s.name }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-secondary-foreground">Financial Plan</h1>
        <p className="mt-1 text-muted-foreground">
          Compare college costs, track scholarships, and manage your semester budget.
        </p>
      </div>

      <LearnMoreBanner
        title="Learn: FAFSA & University Aid"
        description="FAFSA filing tips, university aid, department scholarships, and financial appeals."
        href="/student/learning/scholarships"
      />

      {/* Top-level summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total Estimated Cost"
          value={hasFinancialPlan ? formatCurrency(totalCost) : "--"}
          sublabel={hasFinancialPlan ? `${semesters.length} semesters` : "No budget set"}
          icon={GraduationCap}
          color="text-secondary-foreground"
          bg="bg-accent"
          index={0}
        />
        <SummaryCard
          label="Budget Aid Secured"
          value={hasFinancialPlan ? formatCurrency(totalAid) : "--"}
          sublabel={hasFinancialPlan ? `${uniqueSources.length} income sources` : "No budget set"}
          icon={TrendingUp}
          color="text-emerald-600"
          bg="bg-emerald-50"
          index={1}
        />
        <SummaryCard
          label="Scholarships Won"
          value={hasAwards ? formatTuition(totalScholarships) : "$0"}
          sublabel={`${awardItems.length} awarded`}
          icon={Award}
          color="text-[#2563EB]"
          bg="bg-accent"
          index={2}
        />
        <SummaryCard
          label="Remaining Gap"
          value={hasFinancialPlan ? formatCurrency(Math.max(remainingGap, 0)) : "--"}
          sublabel={remainingGap <= 0 && hasFinancialPlan ? "Fully funded!" : "Funding needed"}
          icon={AlertTriangle}
          color={remainingGap <= 0 && hasFinancialPlan ? "text-emerald-600" : "text-amber-600"}
          bg={remainingGap <= 0 && hasFinancialPlan ? "bg-emerald-50" : "bg-amber-50"}
          index={3}
        />
      </div>

      {/* Tabbed content */}
      <VercelTabs
        tabs={[
          { id: "college-costs", label: "College Costs" },
          { id: "scholarships", label: "Scholarships" },
          { id: "overview", label: "Budget Overview" },
          { id: "budget", label: "Semester Budget" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* College Cost Comparison Tab */}
      {activeTab === "college-costs" && (
        <div className="space-y-6 mt-4">
          <CollegeCostComparison
            collegeApps={collegeApps}
            totalScholarships={totalScholarships}
          />
        </div>
      )}

      {/* Scholarships Tab */}
      {activeTab === "scholarships" && (
        <div className="space-y-6 mt-4">
          <ScholarshipOffset
            awards={awardItems}
            semesters={semesterList}
            planId={plan?.id}
            onBudgetSynced={handleBudgetSynced}
          />
          {!hasAwards && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Award className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">No scholarship awards yet.</p>
              <p className="text-xs mt-1">
                Apply to scholarships and mark them as awarded to see your offset here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Budget Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6 mt-4">
          {!hasFinancialPlan ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <DollarSign className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">No budget set up yet.</p>
              <p className="text-xs mt-1">
                Go to the Semester Budget tab to create your budget.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 gap-1.5"
                onClick={() => setActiveTab("budget")}
              >
                <Plus className="h-3.5 w-3.5" />
                Set Up Budget
              </Button>
            </div>
          ) : (
            <BudgetOverview plan={plan} totalScholarships={totalScholarships} />
          )}
        </div>
      )}

      {/* Semester Budget Tab */}
      {activeTab === "budget" && (
        <div className="space-y-6 mt-4">
          {!hasFinancialPlan ? (
            <BudgetSetup
              collegeApps={collegeApps}
              creating={creating}
              onSelectCollege={createPlanFromCollege}
              onCreateBlank={createBlankPlan}
            />
          ) : (
            <>
              <BudgetSchoolBar
                collegeApps={collegeApps}
                creating={creating}
                onSelectCollege={createPlanFromCollege}
                onCreateBlank={createBlankPlan}
                onRefresh={loadData}
              />
              <SemesterBudget plan={plan} onPlanUpdate={setPlan} totalScholarships={totalScholarships} />
            </>
          )}
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  sublabel,
  icon: Icon,
  color,
  bg,
  index,
}: {
  label: string
  value: string
  sublabel: string
  icon: typeof GraduationCap
  color: string
  bg: string
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card variant="bento">
        <CardContent className="pt-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{sublabel}</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Budget Setup (Empty State) ─────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
function BudgetSetup({
  collegeApps,
  creating,
  onSelectCollege,
  onCreateBlank,
}: {
  collegeApps: CollegeApp[]
  creating: boolean
  onSelectCollege: (collegeId: string, name: string) => void
  onCreateBlank: () => void
}) {
  const appsWithCosts = collegeApps.filter(
    (a) => a.college?.inStateTuition != null || a.college?.outOfStateTuition != null
  )

  return (
    <Card variant="bento">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1E3A5F]/10 mb-4">
            <DollarSign className="h-7 w-7 text-[#1E3A5F]" />
          </div>
          <h3 className="text-lg font-semibold text-secondary-foreground">
            Create Your Semester Budget
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Choose a school to auto-fill costs, or start with a blank budget and enter costs manually.
            You can always switch schools or edit costs later.
          </p>
        </div>

        {appsWithCosts.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-[#1E3A5F] uppercase tracking-wide mb-3">
              Your Colleges
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {appsWithCosts.map((app) => {
                const tuition = app.college?.inStateTuition ?? app.college?.outOfStateTuition ?? 0
                return (
                  <button
                    key={app.id}
                    type="button"
                    disabled={creating}
                    onClick={() => onSelectCollege(app.college?.id, app.universityName)}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 text-left transition-all hover:border-[#2563EB]/30 hover:shadow-sm disabled:opacity-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                      <GraduationCap className="h-5 w-5 text-[#1E3A5F]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{app.universityName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(tuition)}/yr
                        </span>
                        {app.status === "ACCEPTED" && (
                          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            Accepted
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="mb-4">
          <h4 className="text-xs font-semibold text-[#1E3A5F] uppercase tracking-wide mb-3">
            Search Any School
          </h4>
          <CollegeAutocomplete
            onSelect={(college: CollegeResult) => {
              if (college.id) onSelectCollege(college.id, college.name)
            }}
            placeholder="Search for a college to base your budget on..."
            disabled={creating}
          />
        </div>

        <div className="flex items-center gap-3 pt-4 border-t">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Start from scratch</p>
            <p className="text-xs text-muted-foreground">
              Create a blank 8-semester budget and enter all costs manually.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={onCreateBlank}
            disabled={creating}
            className="gap-1.5"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Blank Budget
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Budget School Bar (top of semester budget) ─────────────

function BudgetSchoolBar({
  collegeApps,
  creating,
  onSelectCollege,
  onCreateBlank,
  onRefresh,
}: {
  collegeApps: CollegeApp[]
  creating: boolean
  onSelectCollege: (collegeId: string, name: string) => void
  onCreateBlank: () => void
  onRefresh: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <CollegeAutocomplete
          onSelect={(college: CollegeResult) => {
            if (college.id) onSelectCollege(college.id, college.name)
          }}
          placeholder="Switch school — search to replace budget costs..."
          disabled={creating}
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        className="gap-1.5 shrink-0"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Refresh
      </Button>
    </div>
  )
}
/* eslint-enable @typescript-eslint/no-explicit-any */
