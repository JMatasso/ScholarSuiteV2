"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs as VercelTabs } from "@/components/ui/vercel-tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/format"
import { formatTuition } from "@/lib/college-utils"
import { LearnMoreBanner } from "@/components/ui/learn-more-banner"
import { CollegeCostComparison } from "@/components/ui/college-cost-comparison"
import { ScholarshipOffset } from "@/components/ui/scholarship-offset"
import { toast } from "sonner"
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  GraduationCap,
  Receipt,
  Building2,
  Award,
} from "@/lib/icons"

interface IncomeSource {
  id: string
  name: string
  amount: number
  type: string
  status: string
}

interface Semester {
  id: string
  name: string
  tuition: number
  housing: number
  food: number
  transportation: number
  books: number
  personal: number
  other: number
  incomeSources: IncomeSource[]
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

  useEffect(() => {
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

  // Prepare scholarship award data for the offset component
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

  // Determine if we have data for each tab
  const hasFinancialPlan = plan !== null
  const hasCollegeCosts = collegeApps.some(
    (a) => a.college && (a.college.inStateTuition != null || a.college.outOfStateTuition != null)
  )
  const hasAwards = awardItems.length > 0

  // Compute plan stats if available
  const semesters = plan?.semesters ?? []
  const totalCost = semesters.reduce((a, s) => a + getSemesterTotal(s), 0)
  const totalAid = semesters.reduce((a, s) => a + getSemesterAid(s), 0)
  const remainingGap = totalCost - totalAid - totalScholarships
  const maxTotal = semesters.length > 0 ? Math.max(...semesters.map(getSemesterTotal)) : 1

  const allIncomeSources = semesters.flatMap((s) => s.incomeSources)
  const uniqueSources = allIncomeSources.filter(
    (src, idx, arr) => arr.findIndex((s) => s.id === src.id) === idx
  )


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-secondary-foreground">Financial Plan</h1>
        <p className="mt-1 text-muted-foreground">
          Compare college costs, track scholarships, and manage your semester budget.
        </p>
      </div>

      {/* Learn more banner */}
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
          <ScholarshipOffset awards={awardItems} />
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

      {/* Semester Budget Tab (existing content) */}
      {activeTab === "budget" && (
        <div className="space-y-6 mt-4">
          {!hasFinancialPlan ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <DollarSign className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-medium text-foreground">No semester budget yet</p>
              <p className="text-xs mt-1 max-w-xs text-center">
                Once you have an accepted college with cost data, your budget will be generated automatically.
              </p>
            </div>
          ) : (
            <>
              {/* Bar chart */}
              {semesters.length > 0 && (
                <Card variant="bento">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Receipt className="h-4 w-4 text-[#2563EB]" />
                      Cost vs. Aid by Semester
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {semesters.map((sem) => {
                        const total = getSemesterTotal(sem)
                        const aid = getSemesterAid(sem)
                        return (
                          <div key={sem.id} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium w-28">{sem.name}</span>
                              <div className="flex items-center gap-4">
                                <span className="text-muted-foreground">Cost: {formatCurrency(total)}</span>
                                <span className="text-emerald-600 font-medium">Aid: {formatCurrency(aid)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 h-6">
                              <div
                                className="h-5 rounded bg-accent relative"
                                style={{ width: `${(total / maxTotal) * 100}%` }}
                              >
                                {aid > 0 && (
                                  <div
                                    className="absolute inset-y-0 left-0 rounded bg-emerald-500/60"
                                    style={{ width: `${Math.min((aid / total) * 100, 100)}%` }}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <div className="h-3 w-3 rounded bg-accent" />
                          <span>Total Cost</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-3 w-3 rounded bg-emerald-500/60" />
                          <span>Aid Covered</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Semester table */}
              {semesters.length > 0 && (
                <Card variant="bento">
                  <CardHeader>
                    <CardTitle className="text-base">Semester Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="pb-2 pr-4 font-medium text-muted-foreground">Semester</th>
                            <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Tuition</th>
                            <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Housing</th>
                            <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Food</th>
                            <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Books</th>
                            <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Other</th>
                            <th className="pb-2 font-medium text-secondary-foreground text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {semesters.map((sem) => {
                            const total = getSemesterTotal(sem)
                            return (
                              <tr key={sem.id}>
                                <td className="py-2.5 pr-4 font-medium">{sem.name}</td>
                                <td className="py-2.5 pr-4 text-right text-muted-foreground">{formatCurrency(sem.tuition)}</td>
                                <td className="py-2.5 pr-4 text-right text-muted-foreground">{formatCurrency(sem.housing)}</td>
                                <td className="py-2.5 pr-4 text-right text-muted-foreground">{formatCurrency(sem.food)}</td>
                                <td className="py-2.5 pr-4 text-right text-muted-foreground">{formatCurrency(sem.books)}</td>
                                <td className="py-2.5 pr-4 text-right text-muted-foreground">{formatCurrency(sem.other + sem.transportation + sem.personal)}</td>
                                <td className="py-2.5 text-right font-semibold text-secondary-foreground">{formatCurrency(total)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 font-semibold">
                            <td className="pt-3">Total</td>
                            <td className="pt-3 text-right">{formatCurrency(semesters.reduce((a, s) => a + s.tuition, 0))}</td>
                            <td className="pt-3 text-right">{formatCurrency(semesters.reduce((a, s) => a + s.housing, 0))}</td>
                            <td className="pt-3 text-right">{formatCurrency(semesters.reduce((a, s) => a + s.food, 0))}</td>
                            <td className="pt-3 text-right">{formatCurrency(semesters.reduce((a, s) => a + s.books, 0))}</td>
                            <td className="pt-3 text-right">{formatCurrency(semesters.reduce((a, s) => a + s.other + s.transportation + s.personal, 0))}</td>
                            <td className="pt-3 text-right text-secondary-foreground">{formatCurrency(totalCost)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Income Sources */}
              {uniqueSources.length > 0 && (
                <Card variant="bento">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                      Income Sources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2.5">
                      {uniqueSources.map((source) => (
                        <div key={source.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{source.name}</p>
                              <p className="text-xs text-muted-foreground">{source.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-secondary-foreground w-24 text-right">
                              {formatCurrency(source.amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
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
