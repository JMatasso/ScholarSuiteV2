"use client"

import { motion } from "motion/react"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Award,
  GraduationCap,
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

interface BudgetOverviewProps {
  plan: FinancialPlan
  totalScholarships: number
}

function getSemesterTotal(sem: Semester): number {
  const base = sem.tuition + sem.housing + sem.food + sem.transportation + sem.books + sem.personal + sem.other
  const custom = (sem.customExpenses ?? []).reduce((a, e) => a + e.amount, 0)
  return base + custom
}

function getSemesterAid(sem: Semester): number {
  return sem.incomeSources.reduce((a, s) => a + s.amount, 0)
}

export function BudgetOverview({ plan, totalScholarships }: BudgetOverviewProps) {
  const semesters = plan.semesters
  const totalCost = semesters.reduce((a, s) => a + getSemesterTotal(s), 0)
  const totalAid = semesters.reduce((a, s) => a + getSemesterAid(s), 0)
  const totalFunded = totalAid + totalScholarships
  const gap = totalCost - totalFunded
  const pctFunded = totalCost > 0 ? Math.round((totalFunded / totalCost) * 100) : 0

  // Group semesters into academic years (pairs of Fall/Spring)
  const yearGroups: Array<{ label: string; semesters: Semester[] }> = []
  const yearNames = ["Freshman", "Sophomore", "Junior", "Senior", "5th Year"]
  let currentGroup: Semester[] = []
  let yearIndex = 0

  semesters.forEach((sem) => {
    currentGroup.push(sem)
    if (currentGroup.length === 2 || sem === semesters[semesters.length - 1]) {
      yearGroups.push({
        label: yearNames[yearIndex] || `Year ${yearIndex + 1}`,
        semesters: [...currentGroup],
      })
      currentGroup = []
      yearIndex++
    }
  })

  // Expense breakdown across all semesters
  const expenseBreakdown = [
    { label: "Tuition & Fees", value: semesters.reduce((s, sem) => s + sem.tuition, 0), color: "bg-[#1E3A5F]" },
    { label: "Housing", value: semesters.reduce((s, sem) => s + sem.housing, 0), color: "bg-[#2563EB]" },
    { label: "Food", value: semesters.reduce((s, sem) => s + sem.food, 0), color: "bg-emerald-500" },
    { label: "Books & Supplies", value: semesters.reduce((s, sem) => s + sem.books, 0), color: "bg-amber-500" },
    { label: "Transportation", value: semesters.reduce((s, sem) => s + sem.transportation, 0), color: "bg-purple-500" },
    { label: "Personal & Other", value: semesters.reduce((s, sem) => s + sem.personal + sem.other, 0), color: "bg-rose-400" },
    { label: "Custom Expenses", value: semesters.reduce((s, sem) => s + (sem.customExpenses ?? []).reduce((a, e) => a + e.amount, 0), 0), color: "bg-gray-500" },
  ].filter((e) => e.value > 0)

  // Income breakdown by type
  const incomeByType = new Map<string, number>()
  semesters.forEach((sem) => {
    sem.incomeSources.forEach((src) => {
      incomeByType.set(src.type, (incomeByType.get(src.type) || 0) + src.amount)
    })
  })
  if (totalScholarships > 0) {
    incomeByType.set("Awarded Scholarships", (incomeByType.get("Awarded Scholarships") || 0) + totalScholarships)
  }
  const incomeBreakdown = Array.from(incomeByType.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="space-y-6">
      {/* Overall funding progress */}
      <Card variant="bento" className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-secondary-foreground">Overall Funding Progress</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatCurrency(totalFunded)} of {formatCurrency(totalCost)} funded
              </p>
            </div>
            <div className={cn(
              "text-2xl font-bold",
              pctFunded >= 100 ? "text-emerald-600" : pctFunded >= 50 ? "text-[#2563EB]" : "text-amber-600"
            )}>
              {pctFunded}%
            </div>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(pctFunded, 100)}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "h-full rounded-full",
                pctFunded >= 100 ? "bg-emerald-500" : pctFunded >= 50 ? "bg-[#2563EB]" : "bg-amber-500"
              )}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total Cost</p>
              <p className="text-sm font-bold text-secondary-foreground">{formatCurrency(totalCost)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total Funded</p>
              <p className="text-sm font-bold text-emerald-600">{formatCurrency(totalFunded)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">{gap > 0 ? "Gap Remaining" : "Surplus"}</p>
              <p className={cn("text-sm font-bold", gap > 0 ? "text-rose-600" : "text-emerald-600")}>
                {formatCurrency(Math.abs(gap))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense & Income Breakdown side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Expense breakdown */}
        <Card variant="bento">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-secondary-foreground mb-4 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-rose-500" />
              Expense Breakdown
            </h3>
            <div className="space-y-3">
              {expenseBreakdown.map((exp, i) => {
                const pct = totalCost > 0 ? Math.round((exp.value / totalCost) * 100) : 0
                return (
                  <motion.div
                    key={exp.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{exp.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{pct}%</span>
                        <span className="font-semibold w-20 text-right">{formatCurrency(exp.value)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.2 + i * 0.05 }}
                        className={cn("h-full rounded-full", exp.color)}
                      />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Income breakdown */}
        <Card variant="bento">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-secondary-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Income Sources
            </h3>
            {incomeBreakdown.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-muted-foreground">
                <Award className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-xs">No income sources yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incomeBreakdown.map((inc, i) => {
                  const pct = totalFunded > 0 ? Math.round((inc.value / totalFunded) * 100) : 0
                  return (
                    <motion.div
                      key={inc.label}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{inc.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{pct}%</span>
                          <span className="font-semibold text-emerald-600 w-20 text-right">{formatCurrency(inc.value)}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: 0.2 + i * 0.05 }}
                          className="h-full rounded-full bg-emerald-500"
                        />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-semester cards */}
      <div>
        <h3 className="text-sm font-semibold text-secondary-foreground mb-4 flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-[#1E3A5F]" />
          Semester-by-Semester Breakdown
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {semesters.map((sem, i) => {
            const cost = getSemesterTotal(sem)
            const aid = getSemesterAid(sem)
            const net = aid - cost
            const semPct = cost > 0 ? Math.round((aid / cost) * 100) : 0

            return (
              <motion.div
                key={sem.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <Card variant="bento" className="overflow-hidden">
                  <div className={cn(
                    "h-1.5",
                    semPct >= 100 ? "bg-emerald-500" : semPct >= 50 ? "bg-[#2563EB]" : semPct > 0 ? "bg-amber-500" : "bg-gray-200"
                  )} />
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-secondary-foreground">{sem.name}</h4>
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                        semPct >= 100 ? "bg-emerald-100 text-emerald-700" :
                        semPct >= 50 ? "bg-blue-100 text-blue-700" :
                        "bg-amber-100 text-amber-700"
                      )}>
                        {semPct}%
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {sem.tuition > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tuition</span>
                          <span>{formatCurrency(sem.tuition)}</span>
                        </div>
                      )}
                      {sem.housing > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Housing</span>
                          <span>{formatCurrency(sem.housing)}</span>
                        </div>
                      )}
                      {sem.food > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Food</span>
                          <span>{formatCurrency(sem.food)}</span>
                        </div>
                      )}
                      {(sem.books + sem.transportation + sem.personal + sem.other) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Other</span>
                          <span>{formatCurrency(sem.books + sem.transportation + sem.personal + sem.other)}</span>
                        </div>
                      )}
                      {(sem.customExpenses ?? []).map((exp) => (
                        <div key={exp.id} className="flex justify-between">
                          <span className="text-muted-foreground truncate mr-2">{exp.name}</span>
                          <span>{formatCurrency(exp.amount)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">Total Cost</span>
                        <span className="font-semibold">{formatCurrency(cost)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-emerald-600">Aid</span>
                        <span className="font-semibold text-emerald-600">{formatCurrency(aid)}</span>
                      </div>
                      <div className="flex justify-between text-xs pt-1 border-t border-dashed">
                        <span className="font-semibold">{net >= 0 ? "Surplus" : "Gap"}</span>
                        <span className={cn("font-bold", net >= 0 ? "text-emerald-600" : "text-rose-600")}>
                          {net >= 0 ? formatCurrency(net) : `(${formatCurrency(Math.abs(net))})`}
                        </span>
                      </div>
                    </div>

                    {/* Income sources */}
                    {sem.incomeSources.length > 0 && (
                      <div className="pt-2 border-t space-y-1">
                        <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">Income Sources</p>
                        {sem.incomeSources.map((src) => (
                          <div key={src.id} className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground truncate mr-2">{src.name}</span>
                            <span className="text-emerald-600 font-medium shrink-0">{formatCurrency(src.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Yearly summary */}
      {yearGroups.length > 0 && (
        <Card variant="bento">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-secondary-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Year-Over-Year Summary
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-semibold text-muted-foreground">Year</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Cost</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Aid</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Net</th>
                    <th className="text-right py-2 pl-3 font-semibold text-muted-foreground">Funded</th>
                  </tr>
                </thead>
                <tbody>
                  {yearGroups.map((group, i) => {
                    const yCost = group.semesters.reduce((s, sem) => s + getSemesterTotal(sem), 0)
                    const yAid = group.semesters.reduce((s, sem) => s + getSemesterAid(sem), 0)
                    const yNet = yAid - yCost
                    const yPct = yCost > 0 ? Math.round((yAid / yCost) * 100) : 0
                    return (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2.5 pr-4 font-medium">{group.label}</td>
                        <td className="py-2.5 px-3 text-right">{formatCurrency(yCost)}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-600">{formatCurrency(yAid)}</td>
                        <td className={cn("py-2.5 px-3 text-right font-semibold", yNet >= 0 ? "text-emerald-600" : "text-rose-600")}>
                          {yNet >= 0 ? formatCurrency(yNet) : `(${formatCurrency(Math.abs(yNet))})`}
                        </td>
                        <td className="py-2.5 pl-3 text-right">
                          <span className={cn(
                            "inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold",
                            yPct >= 100 ? "bg-emerald-100 text-emerald-700" :
                            yPct >= 50 ? "bg-blue-100 text-blue-700" :
                            "bg-amber-100 text-amber-700"
                          )}>
                            {yPct}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-bold">
                    <td className="py-2.5 pr-4">Total</td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(totalCost)}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600">{formatCurrency(totalAid)}</td>
                    <td className={cn("py-2.5 px-3 text-right", totalAid - totalCost >= 0 ? "text-emerald-600" : "text-rose-600")}>
                      {totalAid - totalCost >= 0 ? formatCurrency(totalAid - totalCost) : `(${formatCurrency(Math.abs(totalAid - totalCost))})`}
                    </td>
                    <td className="py-2.5 pl-3 text-right">
                      <span className={cn(
                        "inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold",
                        pctFunded >= 100 ? "bg-emerald-100 text-emerald-700" :
                        pctFunded >= 50 ? "bg-blue-100 text-blue-700" :
                        "bg-amber-100 text-amber-700"
                      )}>
                        {pctFunded}%
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
