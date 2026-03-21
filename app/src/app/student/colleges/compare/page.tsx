"use client"

import { useEffect, useState, useMemo } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { MultiSelect } from "@/components/ui/multi-select"
import { Skeleton } from "@/components/ui/skeleton"
import { GraduationCap } from "lucide-react"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

interface CollegeApp {
  id: string
  universityName: string
  applicationType: string
  status: string
  classification: string | null
  deadline: string | null
  college: {
    name: string
    city: string | null
    state: string | null
    type: string | null
    locale: string | null
    enrollment: number | null
    acceptanceRate: number | null
    satAvg: number | null
    sat25: number | null
    sat75: number | null
    actAvg: number | null
    act25: number | null
    act75: number | null
    testOptional: boolean
    inStateTuition: number | null
    outOfStateTuition: number | null
    roomAndBoard: number | null
    pellPct: number | null
    fedLoanPct: number | null
    medianDebt: number | null
    gradRate4yr: number | null
    gradRate6yr: number | null
    retentionRate: number | null
    medianEarnings6yr: number | null
    medianEarnings10yr: number | null
  } | null
}

type Getter = (a: CollegeApp) => number | null
type Direction = "high" | "low"

const fmtPct = (v: number | null) => (v != null ? `${Math.round(v * 100)}%` : "—")
const fmtMoney = (v: number | null) =>
  v != null ? `$${v.toLocaleString("en-US")}` : "—"
const fmtNum = (v: number | null) => (v != null ? v.toLocaleString("en-US") : "—")
const fmtStr = (v: string | null | undefined) => v || "—"
const fmtBool = (v: boolean | undefined) => (v === true ? "Yes" : v === false ? "No" : "—")
const fmtRange = (lo: number | null, hi: number | null) =>
  lo != null && hi != null ? `${lo}–${hi}` : lo != null ? `${lo}+` : "—"

interface Row {
  label: string
  value: (a: CollegeApp) => string
  rank?: { get: Getter; dir: Direction }
}

const sections: { title: string; rows: Row[] }[] = [
  {
    title: "Overview",
    rows: [
      { label: "Name", value: (a) => a.college?.name ?? a.universityName },
      { label: "City / State", value: (a) => a.college ? fmtStr([a.college.city, a.college.state].filter(Boolean).join(", ") || null) : "—" },
      { label: "Type", value: (a) => fmtStr(a.college?.type) },
      { label: "Enrollment", value: (a) => fmtNum(a.college?.enrollment ?? null), rank: { get: (a) => a.college?.enrollment ?? null, dir: "high" } },
      { label: "Locale", value: (a) => fmtStr(a.college?.locale) },
    ],
  },
  {
    title: "Admissions",
    rows: [
      { label: "Acceptance Rate", value: (a) => fmtPct(a.college?.acceptanceRate ?? null), rank: { get: (a) => a.college?.acceptanceRate ?? null, dir: "high" } },
      { label: "SAT Avg", value: (a) => fmtNum(a.college?.satAvg ?? null), rank: { get: (a) => a.college?.satAvg ?? null, dir: "high" } },
      { label: "SAT Range (25th–75th)", value: (a) => fmtRange(a.college?.sat25 ?? null, a.college?.sat75 ?? null) },
      { label: "ACT Avg", value: (a) => fmtNum(a.college?.actAvg ?? null), rank: { get: (a) => a.college?.actAvg ?? null, dir: "high" } },
      { label: "ACT Range (25th–75th)", value: (a) => fmtRange(a.college?.act25 ?? null, a.college?.act75 ?? null) },
      { label: "Test Optional", value: (a) => fmtBool(a.college?.testOptional) },
    ],
  },
  {
    title: "Cost",
    rows: [
      { label: "In-State Tuition", value: (a) => fmtMoney(a.college?.inStateTuition ?? null), rank: { get: (a) => a.college?.inStateTuition ?? null, dir: "low" } },
      { label: "Out-of-State Tuition", value: (a) => fmtMoney(a.college?.outOfStateTuition ?? null), rank: { get: (a) => a.college?.outOfStateTuition ?? null, dir: "low" } },
      { label: "Room & Board", value: (a) => fmtMoney(a.college?.roomAndBoard ?? null), rank: { get: (a) => a.college?.roomAndBoard ?? null, dir: "low" } },
    ],
  },
  {
    title: "Financial Aid",
    rows: [
      { label: "Pell Grant %", value: (a) => fmtPct(a.college?.pellPct ?? null), rank: { get: (a) => a.college?.pellPct ?? null, dir: "high" } },
      { label: "Federal Loan %", value: (a) => fmtPct(a.college?.fedLoanPct ?? null), rank: { get: (a) => a.college?.fedLoanPct ?? null, dir: "low" } },
      { label: "Median Debt", value: (a) => fmtMoney(a.college?.medianDebt ?? null), rank: { get: (a) => a.college?.medianDebt ?? null, dir: "low" } },
    ],
  },
  {
    title: "Outcomes",
    rows: [
      { label: "4-Year Grad Rate", value: (a) => fmtPct(a.college?.gradRate4yr ?? null), rank: { get: (a) => a.college?.gradRate4yr ?? null, dir: "high" } },
      { label: "6-Year Grad Rate", value: (a) => fmtPct(a.college?.gradRate6yr ?? null), rank: { get: (a) => a.college?.gradRate6yr ?? null, dir: "high" } },
      { label: "Retention Rate", value: (a) => fmtPct(a.college?.retentionRate ?? null), rank: { get: (a) => a.college?.retentionRate ?? null, dir: "high" } },
      { label: "Median Earnings (6yr)", value: (a) => fmtMoney(a.college?.medianEarnings6yr ?? null), rank: { get: (a) => a.college?.medianEarnings6yr ?? null, dir: "high" } },
      { label: "Median Earnings (10yr)", value: (a) => fmtMoney(a.college?.medianEarnings10yr ?? null), rank: { get: (a) => a.college?.medianEarnings10yr ?? null, dir: "high" } },
    ],
  },
  {
    title: "Your Application",
    rows: [
      { label: "Application Type", value: (a) => fmtStr(a.applicationType) },
      { label: "Status", value: (a) => fmtStr(a.status) },
      { label: "Classification", value: (a) => fmtStr(a.classification) },
      { label: "Deadline", value: (a) => formatDate(a.deadline) },
    ],
  },
]

function rankValues(apps: CollegeApp[], get: Getter, dir: Direction) {
  const vals = apps.map((a) => get(a))
  const valid = vals.filter((v): v is number => v != null)
  if (valid.length < 2) return apps.map(() => "neutral" as const)
  const best = dir === "high" ? Math.max(...valid) : Math.min(...valid)
  const worst = dir === "high" ? Math.min(...valid) : Math.max(...valid)
  return vals.map((v) => {
    if (v == null) return "neutral" as const
    if (v === best) return "best" as const
    if (v === worst) return "worst" as const
    return "neutral" as const
  })
}

const cellColor = { best: "bg-emerald-50", worst: "bg-rose-50", neutral: "" }

export default function CollegeComparePage() {
  const [apps, setApps] = useState<CollegeApp[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    fetch("/api/college-applications")
      .then((r) => r.json())
      .then((data) => { setApps(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const options = useMemo(
    () => apps.map((a) => ({ id: a.id, label: a.universityName })),
    [apps]
  )

  const selected = useMemo(
    () => apps.filter((a) => selectedIds.includes(a.id)),
    [apps, selectedIds]
  )

  const handleChange = (ids: string[]) => setSelectedIds(ids.slice(0, 4))

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Compare Colleges" description="Side-by-side comparison of your college list." />
        <div className="space-y-3">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Compare Colleges" description="Side-by-side comparison of your college list." />

      <div className="max-w-md">
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Select 2–4 colleges to compare
        </label>
        <MultiSelect
          options={options}
          selectedIds={selectedIds}
          onChange={handleChange}
          placeholder="Choose colleges..."
          searchPlaceholder="Search your college list..."
          emptyMessage="No colleges in your list yet."
        />
      </div>

      {selected.length < 2 ? (
        <Card variant="bento">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1E3A5F]/10 text-[#1E3A5F] mb-3">
              <GraduationCap className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-[#1E3A5F]">Select at least 2 colleges</p>
            <p className="text-xs text-muted-foreground mt-1">Pick colleges from your list above to see a side-by-side comparison.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[600px] text-sm">
            {sections.map((section) => (
              <tbody key={section.title}>
                <tr>
                  <td
                    colSpan={selected.length + 1}
                    className="bg-[#1E3A5F]/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#1E3A5F]"
                  >
                    {section.title}
                  </td>
                </tr>
                {section.rows.map((row) => {
                  const ranks = row.rank
                    ? rankValues(selected, row.rank.get, row.rank.dir)
                    : selected.map(() => "neutral" as const)
                  return (
                    <tr key={row.label} className="border-t border-gray-100">
                      <td className="whitespace-nowrap px-4 py-2 font-medium text-muted-foreground w-48">
                        {row.label}
                      </td>
                      {selected.map((app, i) => (
                        <td
                          key={app.id}
                          className={cn("px-4 py-2 text-center", cellColor[ranks[i]])}
                        >
                          {row.value(app)}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            ))}
          </table>
        </div>
      )}
    </div>
  )
}
