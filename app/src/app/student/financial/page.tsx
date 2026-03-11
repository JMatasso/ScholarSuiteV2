"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

const summaryCards = [
  {
    label: "Total 4-Year Cost",
    value: "$196,400",
    sublabel: "Stanford University estimate",
    icon: GraduationCap,
    color: "text-[#1E3A5F]",
    bg: "bg-blue-50",
  },
  {
    label: "Total Aid Secured",
    value: "$12,500",
    sublabel: "1 scholarship awarded",
    icon: TrendingUp,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    label: "Remaining Gap",
    value: "$183,900",
    sublabel: "Pending 6 applications",
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
]

const semesterData = [
  {
    semester: "Fall 2026",
    tuition: 19200,
    housing: 6800,
    food: 3200,
    books: 900,
    fees: 1500,
    total: 31600,
    aid: 3125,
  },
  {
    semester: "Spring 2027",
    tuition: 19200,
    housing: 6800,
    food: 3200,
    books: 750,
    fees: 1500,
    total: 31450,
    aid: 3125,
  },
  {
    semester: "Fall 2027",
    tuition: 19800,
    housing: 7000,
    food: 3400,
    books: 900,
    fees: 1550,
    total: 32650,
    aid: 3125,
  },
  {
    semester: "Spring 2028",
    tuition: 19800,
    housing: 7000,
    food: 3400,
    books: 750,
    fees: 1550,
    total: 32500,
    aid: 3125,
  },
  {
    semester: "Fall 2028",
    tuition: 20400,
    housing: 7200,
    food: 3600,
    books: 900,
    fees: 1600,
    total: 33700,
    aid: 0,
  },
  {
    semester: "Spring 2029",
    tuition: 20400,
    housing: 7200,
    food: 3600,
    books: 750,
    fees: 1600,
    total: 33550,
    aid: 0,
  },
]

const incomeSources = [
  { name: "National Merit Scholarship", amount: "$2,500", type: "Scholarship", status: "Confirmed" },
  { name: "Gates Millennium (Pending)", amount: "$72,000", type: "Scholarship", status: "Pending" },
  { name: "Federal Pell Grant (Est.)", amount: "$7,395", type: "Grant", status: "Estimated" },
  { name: "Cal Grant A (Est.)", amount: "$12,630", type: "Grant", status: "Estimated" },
  { name: "Work-Study (Est.)", amount: "$3,500/yr", type: "Employment", status: "Estimated" },
  { name: "Coca-Cola Scholars (Pending)", amount: "$20,000", type: "Scholarship", status: "Pending" },
]

const statusColors: Record<string, string> = {
  Confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Estimated: "bg-gray-100 text-gray-600 border-gray-200",
}

function formatCurrency(val: number) {
  return "$" + val.toLocaleString()
}

export default function FinancialPlanPage() {
  const maxTotal = Math.max(...semesterData.map((s) => s.total))

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

      {/* Bar chart mock */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4 text-[#2563EB]" />
            Cost vs. Aid by Semester
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {semesterData.map((sem) => (
              <div key={sem.semester} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium w-28">{sem.semester}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                      Cost: {formatCurrency(sem.total)}
                    </span>
                    <span className="text-emerald-600 font-medium">
                      Aid: {formatCurrency(sem.aid)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 h-6">
                  {/* Cost bar */}
                  <div
                    className="h-5 rounded bg-[#1E3A5F]/20 relative"
                    style={{ width: `${(sem.total / maxTotal) * 100}%` }}
                  >
                    {/* Aid overlay */}
                    {sem.aid > 0 && (
                      <div
                        className="absolute inset-y-0 left-0 rounded bg-emerald-500/60"
                        style={{ width: `${(sem.aid / sem.total) * 100}%` }}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
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

      {/* Semester table */}
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
                  <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Fees</th>
                  <th className="pb-2 font-medium text-[#1E3A5F] text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {semesterData.map((sem) => (
                  <tr key={sem.semester}>
                    <td className="py-2.5 pr-4 font-medium">{sem.semester}</td>
                    <td className="py-2.5 pr-4 text-right text-muted-foreground">{formatCurrency(sem.tuition)}</td>
                    <td className="py-2.5 pr-4 text-right text-muted-foreground">{formatCurrency(sem.housing)}</td>
                    <td className="py-2.5 pr-4 text-right text-muted-foreground">{formatCurrency(sem.food)}</td>
                    <td className="py-2.5 pr-4 text-right text-muted-foreground">{formatCurrency(sem.books)}</td>
                    <td className="py-2.5 pr-4 text-right text-muted-foreground">{formatCurrency(sem.fees)}</td>
                    <td className="py-2.5 text-right font-semibold text-[#1E3A5F]">{formatCurrency(sem.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-semibold">
                  <td className="pt-3">Total</td>
                  <td className="pt-3 text-right">{formatCurrency(semesterData.reduce((a, s) => a + s.tuition, 0))}</td>
                  <td className="pt-3 text-right">{formatCurrency(semesterData.reduce((a, s) => a + s.housing, 0))}</td>
                  <td className="pt-3 text-right">{formatCurrency(semesterData.reduce((a, s) => a + s.food, 0))}</td>
                  <td className="pt-3 text-right">{formatCurrency(semesterData.reduce((a, s) => a + s.books, 0))}</td>
                  <td className="pt-3 text-right">{formatCurrency(semesterData.reduce((a, s) => a + s.fees, 0))}</td>
                  <td className="pt-3 text-right text-[#1E3A5F]">{formatCurrency(semesterData.reduce((a, s) => a + s.total, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Income Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            Income Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {incomeSources.map((source, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{source.name}</p>
                    <p className="text-xs text-muted-foreground">{source.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusColors[source.status]}`}>
                    {source.status}
                  </span>
                  <span className="text-sm font-semibold text-[#1E3A5F] w-24 text-right">{source.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
