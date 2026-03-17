"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatTuition, getCollegeTypeLabel } from "@/lib/college-utils"
import {
  GraduationCap,
  Home,
  BookOpen,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Building2,
  MapPin,
  Trophy,
  CheckCircle2,
} from "lucide-react"

interface College {
  id: string
  name: string
  city?: string | null
  state?: string | null
  type?: string | null
  inStateTuition?: number | null
  outOfStateTuition?: number | null
  roomAndBoard?: number | null
  booksSupplies?: number | null
}

interface AidPackage {
  grants?: number
  scholarships?: number
  loans?: number
  workStudy?: number
  [key: string]: unknown
}

interface CollegeApp {
  id: string
  universityName: string
  classification?: string | null
  college?: College | null
  aidPackage?: AidPackage | null
  netCostEstimate?: number | null
  status: string
}

interface CollegeCostComparisonProps {
  collegeApps: CollegeApp[]
  totalScholarships: number
}

function classificationBadge(classification: string | null | undefined) {
  if (!classification) return null
  const colorMap: Record<string, string> = {
    REACH: "bg-rose-100 text-rose-700 border-rose-200",
    MATCH: "bg-blue-100 text-blue-700 border-blue-200",
    LIKELY: "bg-amber-100 text-amber-700 border-amber-200",
    SAFETY: "bg-emerald-100 text-emerald-700 border-emerald-200",
  }
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border ${colorMap[classification] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {classification}
    </span>
  )
}

function getCOA(college: College | null | undefined, useOutOfState = false): number | null {
  if (!college) return null
  const tuition = useOutOfState ? college.outOfStateTuition : college.inStateTuition
  if (tuition == null) return null
  return tuition + (college.roomAndBoard ?? 0) + (college.booksSupplies ?? 0)
}

function getAidTotal(aidPackage: AidPackage | null | undefined): number {
  if (!aidPackage) return 0
  return (aidPackage.grants ?? 0) + (aidPackage.scholarships ?? 0) + (aidPackage.loans ?? 0) + (aidPackage.workStudy ?? 0)
}

function getGrantAid(aidPackage: AidPackage | null | undefined): number {
  if (!aidPackage) return 0
  return (aidPackage.grants ?? 0) + (aidPackage.scholarships ?? 0)
}

export function CollegeCostComparison({ collegeApps, totalScholarships }: CollegeCostComparisonProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [useOutOfState, setUseOutOfState] = useState(false)

  const appsWithCosts = collegeApps.filter((app) => app.college && (app.college.inStateTuition != null || app.college.outOfStateTuition != null))

  if (appsWithCosts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-[#2563EB]" />
            College Cost Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Building2 className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">No colleges with cost data on your list yet.</p>
            <p className="text-xs mt-1">Add colleges from the College List page to see cost comparisons here.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Find cheapest net cost
  const netCosts = appsWithCosts.map((app) => {
    const coa = getCOA(app.college, useOutOfState) ?? 0
    const aid = getAidTotal(app.aidPackage)
    return { id: app.id, netCost: coa - aid }
  })
  const cheapestId = netCosts.length > 0 ? netCosts.reduce((a, b) => (a.netCost < b.netCost ? a : b)).id : null

  return (
    <div className="space-y-4">
      {/* Per-School Cost Cards */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide">
          College Cost Comparison
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setUseOutOfState(!useOutOfState)}
          className="text-xs"
        >
          {useOutOfState ? "Showing Out-of-State" : "Showing In-State"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {appsWithCosts.map((app, i) => {
          const college = app.college!
          const coa = getCOA(college, useOutOfState)
          const aid = getAidTotal(app.aidPackage)
          const grantAid = getGrantAid(app.aidPackage)
          const netCost = coa != null ? coa - aid : null
          const fourYearTotal = netCost != null ? netCost * 4 : null
          const isCheapest = app.id === cheapestId
          const isExpanded = expandedCards.has(app.id)

          return (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className={`relative hover:shadow-sm transition-shadow ${isCheapest ? "ring-2 ring-emerald-400" : ""}`}>
                {isCheapest && (
                  <div className="absolute -top-2.5 left-3">
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium">
                      <Trophy className="h-3 w-3" />
                      Best Value
                    </span>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-sm truncate">{app.universityName}</CardTitle>
                      {college.city && college.state && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {college.city}, {college.state}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {classificationBadge(app.classification)}
                      {college.type && (
                        <span className="text-[10px] text-muted-foreground">
                          {getCollegeTypeLabel(college.type)}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Cost breakdown */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <GraduationCap className="h-3 w-3" />
                        Tuition
                      </span>
                      <span className="font-medium">
                        {formatTuition(useOutOfState ? college.outOfStateTuition : college.inStateTuition)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Home className="h-3 w-3" />
                        Room & Board
                      </span>
                      <span className="font-medium">{formatTuition(college.roomAndBoard)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <BookOpen className="h-3 w-3" />
                        Books & Supplies
                      </span>
                      <span className="font-medium">{formatTuition(college.booksSupplies)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1.5">
                      <span className="font-semibold text-[#1E3A5F]">Est. Total COA</span>
                      <span className="font-semibold text-[#1E3A5F]">{formatTuition(coa)}</span>
                    </div>
                  </div>

                  {/* Aid breakdown if available */}
                  {app.aidPackage && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs h-7"
                        onClick={() => toggleCard(app.id)}
                      >
                        {isExpanded ? (
                          <>Aid Details <ChevronUp className="h-3 w-3 ml-1" /></>
                        ) : (
                          <>Aid Details <ChevronDown className="h-3 w-3 ml-1" /></>
                        )}
                      </Button>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="space-y-1.5 text-xs"
                        >
                          {(app.aidPackage.grants ?? 0) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-emerald-600">Grants</span>
                              <span className="text-emerald-600 font-medium">-{formatTuition(app.aidPackage.grants ?? 0)}</span>
                            </div>
                          )}
                          {(app.aidPackage.scholarships ?? 0) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-emerald-600">Scholarships</span>
                              <span className="text-emerald-600 font-medium">-{formatTuition(app.aidPackage.scholarships ?? 0)}</span>
                            </div>
                          )}
                          {(app.aidPackage.loans ?? 0) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-amber-600">Loans</span>
                              <span className="text-amber-600 font-medium">{formatTuition(app.aidPackage.loans ?? 0)}</span>
                            </div>
                          )}
                          {(app.aidPackage.workStudy ?? 0) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-blue-600">Work-Study</span>
                              <span className="text-blue-600 font-medium">{formatTuition(app.aidPackage.workStudy ?? 0)}</span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </>
                  )}

                  {/* Net cost & 4-year */}
                  {netCost != null && (
                    <div className="rounded-lg bg-gray-50 p-2.5 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">Net Annual Cost</span>
                        <span className={`font-bold ${isCheapest ? "text-emerald-600" : "text-[#1E3A5F]"}`}>
                          {formatTuition(netCost)}
                        </span>
                      </div>
                      {fourYearTotal != null && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">4-Year Projected</span>
                          <span className={`font-semibold ${isCheapest ? "text-emerald-600" : "text-[#1E3A5F]"}`}>
                            {formatTuition(fourYearTotal)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Side-by-Side Comparison Table */}
      {appsWithCosts.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowRight className="h-4 w-4 text-[#2563EB]" />
              Side-by-Side Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium text-muted-foreground min-w-[140px]">Category</th>
                    {appsWithCosts.map((app) => (
                      <th key={app.id} className="pb-2 px-3 font-medium text-[#1E3A5F] text-right min-w-[120px]">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="truncate max-w-[140px]">{app.universityName}</span>
                          {app.id === cheapestId && (
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <ComparisonRow
                    label="Tuition"
                    values={appsWithCosts.map((app) => formatTuition(useOutOfState ? app.college!.outOfStateTuition : app.college!.inStateTuition))}
                    rawValues={appsWithCosts.map((app) => (useOutOfState ? app.college!.outOfStateTuition : app.college!.inStateTuition) ?? Infinity)}
                    highlightLowest
                  />
                  <ComparisonRow
                    label="Room & Board"
                    values={appsWithCosts.map((app) => formatTuition(app.college!.roomAndBoard))}
                    rawValues={appsWithCosts.map((app) => app.college!.roomAndBoard ?? Infinity)}
                    highlightLowest
                  />
                  <ComparisonRow
                    label="Books & Supplies"
                    values={appsWithCosts.map((app) => formatTuition(app.college!.booksSupplies))}
                    rawValues={appsWithCosts.map((app) => app.college!.booksSupplies ?? Infinity)}
                    highlightLowest
                  />
                  <ComparisonRow
                    label="Total COA"
                    values={appsWithCosts.map((app) => formatTuition(getCOA(app.college, useOutOfState)))}
                    rawValues={appsWithCosts.map((app) => getCOA(app.college, useOutOfState) ?? Infinity)}
                    highlightLowest
                    bold
                  />
                  <ComparisonRow
                    label="Grants/Scholarships"
                    values={appsWithCosts.map((app) => {
                      const g = getGrantAid(app.aidPackage)
                      return g > 0 ? formatTuition(g) : "N/A"
                    })}
                    rawValues={appsWithCosts.map((app) => getGrantAid(app.aidPackage))}
                    highlightHighest
                    colorClass="text-emerald-600"
                  />
                  <ComparisonRow
                    label="Loans"
                    values={appsWithCosts.map((app) => {
                      const l = app.aidPackage?.loans ?? 0
                      return l > 0 ? formatTuition(l) : "N/A"
                    })}
                    rawValues={appsWithCosts.map((app) => app.aidPackage?.loans ?? 0)}
                    highlightLowest
                    colorClass="text-amber-600"
                  />
                  <ComparisonRow
                    label="Net Annual Cost"
                    values={appsWithCosts.map((app) => {
                      const coa = getCOA(app.college, useOutOfState)
                      const aid = getAidTotal(app.aidPackage)
                      return coa != null ? formatTuition(coa - aid) : "N/A"
                    })}
                    rawValues={appsWithCosts.map((app) => {
                      const coa = getCOA(app.college, useOutOfState)
                      const aid = getAidTotal(app.aidPackage)
                      return coa != null ? coa - aid : Infinity
                    })}
                    highlightLowest
                    bold
                  />
                  <ComparisonRow
                    label="4-Year Total"
                    values={appsWithCosts.map((app) => {
                      const coa = getCOA(app.college, useOutOfState)
                      const aid = getAidTotal(app.aidPackage)
                      return coa != null ? formatTuition((coa - aid) * 4) : "N/A"
                    })}
                    rawValues={appsWithCosts.map((app) => {
                      const coa = getCOA(app.college, useOutOfState)
                      const aid = getAidTotal(app.aidPackage)
                      return coa != null ? (coa - aid) * 4 : Infinity
                    })}
                    highlightLowest
                    bold
                  />
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ComparisonRow({
  label,
  values,
  rawValues,
  highlightLowest,
  highlightHighest,
  bold,
  colorClass,
}: {
  label: string
  values: string[]
  rawValues: number[]
  highlightLowest?: boolean
  highlightHighest?: boolean
  bold?: boolean
  colorClass?: string
}) {
  const validValues = rawValues.filter((v) => v !== Infinity && v > 0)
  const targetValue = highlightLowest
    ? Math.min(...(validValues.length > 0 ? validValues : [Infinity]))
    : highlightHighest
      ? Math.max(...(validValues.length > 0 ? validValues : [-Infinity]))
      : null

  return (
    <tr>
      <td className={`py-2.5 pr-4 ${bold ? "font-semibold text-[#1E3A5F]" : "text-muted-foreground"}`}>
        {label}
      </td>
      {values.map((value, idx) => {
        const isHighlighted = targetValue != null && rawValues[idx] === targetValue && validValues.length > 1
        return (
          <td
            key={idx}
            className={`py-2.5 px-3 text-right ${
              isHighlighted
                ? "text-emerald-600 font-semibold"
                : bold
                  ? `font-semibold ${colorClass || "text-[#1E3A5F]"}`
                  : colorClass || "text-muted-foreground"
            }`}
          >
            {value}
          </td>
        )
      })}
    </tr>
  )
}
