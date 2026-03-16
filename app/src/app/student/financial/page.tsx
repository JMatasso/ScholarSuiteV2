"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/format"
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  GraduationCap,
  Home,
  UtensilsCrossed,
  BookOpen,
  Receipt,
} from "lucide-react"

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

function getSemesterTotal(sem: Semester): number {
  return sem.tuition + sem.housing + sem.food + sem.transportation + sem.books + sem.personal + sem.other
}

function getSemesterAid(sem: Semester): number {
  return sem.incomeSources.reduce((a, s) => a + s.amount, 0)
}

export default function FinancialPlanPage() {
  const [plan, setPlan] = useState<FinancialPlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/financial")
      .then((res) => res.json())
      .then((data) => {
        setPlan(data && data.id ? data : null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">Loading financial plan...</p>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1E3A5F]">Financial Plan</h1>
          <p className="mt-1 text-muted-foreground">
            Track your college costs, aid, and funding gap across all four years.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <DollarSign className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">No financial plan yet. Your counselor will set one up with you.</p>
        </div>
      </div>
    )
  }

  const semesters = plan.semesters
  const totalCost = semesters.reduce((a, s) => a + getSemesterTotal(s), 0)
  const totalAid = semesters.reduce((a, s) => a + getSemesterAid(s), 0)
  const remainingGap = totalCost - totalAid
  const maxTotal = semesters.length > 0 ? Math.max(...semesters.map(getSemesterTotal)) : 1

  // Collect all income sources across semesters for the income sources panel
  const allIncomeSources = semesters.flatMap((s) => s.incomeSources)
  const uniqueSources = allIncomeSources.filter(
    (src, idx, arr) => arr.findIndex((s) => s.id === src.id) === idx
  )

  const summaryCards = [
    {
      label: "Total Estimated Cost",
      value: formatCurrency(totalCost),
      sublabel: `${semesters.length} semesters`,
      icon: GraduationCap,
      color: "text-[#1E3A5F]",
      bg: "bg-blue-50",
    },
    {
      label: "Total Aid Secured",
      value: formatCurrency(totalAid),
      sublabel: `${uniqueSources.length} income sources`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Remaining Gap",
      value: formatCurrency(remainingGap),
      sublabel: "Funding needed",
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1E3A5F]">Financial Plan</h1>
        <p className="mt-1 text-muted-foreground">
          Track your college costs, aid, and funding gap across all four years.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label}>
              <CardContent className="pt-0">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                    <p className="text-xs text-muted-foreground">{card.sublabel}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Bar chart */}
      {semesters.length > 0 && (
        <Card>
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
                        className="h-5 rounded bg-[#1E3A5F]/20 relative"
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
                  <div className="h-3 w-3 rounded bg-[#1E3A5F]/20" />
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
        <Card>
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
                    <th className="pb-2 font-medium text-[#1E3A5F] text-right">Total</th>
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
                        <td className="py-2.5 text-right font-semibold text-[#1E3A5F]">{formatCurrency(total)}</td>
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
                    <td className="pt-3 text-right text-[#1E3A5F]">{formatCurrency(totalCost)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Income Sources */}
      {uniqueSources.length > 0 && (
        <Card>
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
                    <span className="text-sm font-semibold text-[#1E3A5F] w-24 text-right">
                      {formatCurrency(source.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
